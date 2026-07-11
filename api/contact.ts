import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateRequestId } from './_lib/requestId.js';
import { setSecurityHeaders, validateOrigin, validateFetchMetadata, validateRequestSize } from './_lib/http.js';
import { sendResponse, sendInternalError } from './_lib/responseContract.js';
import { ContactRequestSchema } from './_lib/validation.js';
import { consumeRateLimit } from './_lib/rateLimit.js';
import { verifyTurnstileToken } from './_lib/turnstile.js';
import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { deriveRequestFingerprint } from './_lib/fingerprint.js';
import { sendEmailNotification } from './_lib/email.js';
import { getClientIp } from './_lib/clientIp.js';
import { logInfo, logWarn, logError } from './_lib/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // 1. Request ID Generation
  const requestId = generateRequestId();

  try {
    // 2. Set strict security headers
    setSecurityHeaders(res, req);

    // OPTIONS preflight support
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // 3. Method Enforcement
    if (req.method !== 'POST') {
      return sendResponse(res, 'METHOD_NOT_ALLOWED', 'ONLY POST PERMITTED.', requestId);
    }

    // 4. Exact Origin Validation
    if (!validateOrigin(req, requestId)) {
      return sendResponse(res, 'ORIGIN_REJECTED', 'CORS ORIGIN BLOCK ACTIVE.', requestId);
    }

    // 5. Fetch Metadata CSRF Validation
    if (!validateFetchMetadata(req, requestId)) {
      return sendResponse(res, 'ORIGIN_REJECTED', 'FETCH METADATA REJECTED.', requestId);
    }

    // 6. Content-Type Check
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return sendResponse(res, 'UNSUPPORTED_MEDIA_TYPE', 'EXPECTING APPLICATION/JSON CONTENT.', requestId);
    }

    // 7. Request Size Enforcements (50 KB threshold check)
    if (!validateRequestSize(req, res, requestId)) {
      return; // Error payload already dispatched by helper
    }

    // 8. Body Parsing & Error handling
    let body: any;
    try {
      body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
    } catch (err) {
      logWarn('[Security] Malformed JSON payload received.', { error: String(err), requestId });
      return sendResponse(res, 'VALIDATION_ERROR', 'MALFORMED PAYLOAD INBOUND.', requestId);
    }

    // 9. Strict Zod Schema Validation
    const parsed = ContactRequestSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue: any) => {
        const path = issue.path.join('.');
        fieldErrors[path] = issue.message;
      });
      logWarn('[Validation] Request payload failed Zod schema checks.', { fieldErrors, requestId });
      return sendResponse(res, 'VALIDATION_ERROR', 'INPUT VALIDATION CHECKS FAILED.', requestId, null, fieldErrors);
    }

    const payload = parsed.data;

    // 10. Honeypot Abuse Evaluation
    const isBot = !!payload._hp;
    if (isBot) {
      logWarn('[Security] Honeypot field filled. Bot detected.', { requestId });
      
      // Consume honeypot rate limit bucket (3 hits / 30 mins)
      const hpRate = await consumeRateLimit(req, 'honeypot', requestId);
      if (!hpRate.allowed) {
        res.setHeader('Retry-After', String(hpRate.resetSeconds));
        return sendResponse(res, 'RATE_LIMITED', 'TOO MANY REQUEST ATTEMPTS.', requestId);
      }
      
      // Silent success: return generic operational success but bypass processing completely
      return sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY.', requestId);
    }

    // 11. Idempotency Verification
    const fingerprint = deriveRequestFingerprint(payload);
    const clientIp = getClientIp(req);
    const supabase = getSupabaseAdmin();

    // Query for existing submission
    const { data: existing, error: queryError } = await supabase
      .from('inquiries')
      .select('*')
      .eq('submission_id', payload.submissionId)
      .maybeSingle();

    if (queryError) {
      logError('[Database] Idempotency table read failure.', queryError, { requestId });
      return sendResponse(res, 'DEPENDENCY_UNAVAILABLE', 'DATABASE CONNECTION SHUTDOWN.', requestId);
    }

    if (existing) {
      logInfo('[Idempotency] Submission matching UUID already exists.', {
        submissionId: payload.submissionId,
        requestId,
      });

      if (existing.request_fingerprint === fingerprint) {
        // Exact duplicate match -> return cached success payload, bypass rate-limit,Turnstile,emails
        return sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY (CACHED).', requestId);
      } else {
        // Same submissionId but modified fields -> data integrity clash
        logWarn('[Idempotency] submissionId reused with conflicting payload data.', {
          submissionId: payload.submissionId,
          requestId,
        });
        return sendResponse(res, 'IDEMPOTENCY_CONFLICT', 'TRANSACTION COLLISION DETECTED.', requestId);
      }
    }

    // 12. Normal Rate Limit Consumption (5 submissions / 10 minutes)
    const rateLimit = await consumeRateLimit(req, 'contact', requestId);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetSeconds));
      return sendResponse(res, 'RATE_LIMITED', 'SUBMISSION LIMIT EXCEEDED. TRY AGAIN LATER.', requestId);
    }

    // 13. Cloudflare Turnstile Challenge Verification
    const turnstileResult = await verifyTurnstileToken(payload.turnstileToken, clientIp, requestId);
    if (turnstileResult === 'REJECTED') {
      return sendResponse(res, 'BOT_VERIFICATION_REJECTED', 'SECURITY VERIFICATION FAILED.', requestId);
    }
    if (turnstileResult === 'TIMEOUT') {
      return sendResponse(res, 'BOT_VERIFICATION_REJECTED', 'VERIFICATION CHALLENGE TIMED OUT.', requestId);
    }
    if (turnstileResult === 'PROVIDER_ERROR' || turnstileResult === 'NETWORK_ERROR') {
      return sendResponse(res, 'DEPENDENCY_UNAVAILABLE', 'SECURITY PROVIDER OFFLINE. TRY AGAIN.', requestId);
    }
    if (turnstileResult === 'CONFIGURATION_ERROR') {
      return sendResponse(res, 'CONFIGURATION_ERROR', 'SERVER VERIFICATION MISCONFIGURED.', requestId);
    }

    // 14. Normalization / Business validation
    const normalizedName = payload.name.trim();
    const normalizedPhone = payload.phone.trim();
    const normalizedEmail = payload.email?.trim().toLowerCase() || null;
    const normalizedCompany = payload.company?.trim() || null;
    const normalizedMessage = payload.message.trim();

    // 15. Durable DB Persistence
    const identityHash = deriveRequestFingerprint({ clientIp }); // pseudonymous IP log
    const { error: insertError } = await supabase.from('inquiries').insert({
      submission_id: payload.submissionId,
      request_fingerprint: fingerprint,
      name: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
      company: normalizedCompany,
      message: normalizedMessage,
      consent_captured: payload.consentCaptured,
      client_identity: identityHash,
    });

    if (insertError) {
      // Authoritative unique constraint concurrency collision check
      if (insertError.code === '23505') {
        logWarn('[Database] Concurrency double-insert blocked by primary unique key constraint.', { requestId });
        return sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY.', requestId);
      }
      logError('[Database] Persistence operation failed.', insertError, { requestId });
      return sendResponse(res, 'DEPENDENCY_UNAVAILABLE', 'DATABASE PERSISTENCE COLLAPSED.', requestId);
    }

    // 16. Optional secondary email dispatch via Resend
    const emailSubject = `New Contact Inquiry - ${normalizedName}`;
    const emailHtml = `
      <h2>Maa Sita Int Udhyog - Inquiry Log</h2>
      <p><strong>Name:</strong> ${normalizedName}</p>
      <p><strong>Phone:</strong> ${normalizedPhone}</p>
      <p><strong>Email:</strong> ${normalizedEmail || 'N/A'}</p>
      <p><strong>Company:</strong> ${normalizedCompany || 'N/A'}</p>
      <p><strong>Message:</strong> ${normalizedMessage}</p>
      <p><strong>Submission UUID:</strong> ${payload.submissionId}</p>
    `;
    
    // Dispatched asynchronously in background. Failure does not affect response.
    sendEmailNotification({ subject: emailSubject, html: emailHtml }, requestId);

    // 17. Structured Logging PII Redaction
    logInfo('[Inquiry] Contact inquiry processed successfully.', {
      submissionId: payload.submissionId,
      requestId,
      elapsedMs: 0, // Placeholder
    });

    // 18. Generic Response Dispatches
    sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY.', requestId);
  } catch (err) {
    sendInternalError(res, err, requestId);
  }
}
