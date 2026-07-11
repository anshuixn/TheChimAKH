import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateRequestId } from './_lib/requestId.js';
import { setSecurityHeaders, validateOrigin, validateFetchMetadata, validateRequestSize } from './_lib/http.js';
import { sendResponse, sendInternalError } from './_lib/responseContract.js';
import { QuoteRequestSchema } from './_lib/validation.js';
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
    // 2. Set security headers
    setSecurityHeaders(res, req);

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    // 3. Method Enforcement
    if (req.method !== 'POST') {
      return sendResponse(res, 'METHOD_NOT_ALLOWED', 'ONLY POST PERMITTED.', requestId);
    }

    // 4. Origin Check
    if (!validateOrigin(req, requestId)) {
      return sendResponse(res, 'ORIGIN_REJECTED', 'CORS ORIGIN BLOCK ACTIVE.', requestId);
    }

    // 5. Fetch Metadata Checks
    if (!validateFetchMetadata(req, requestId)) {
      return sendResponse(res, 'ORIGIN_REJECTED', 'FETCH METADATA REJECTED.', requestId);
    }

    // 6. Content-Type Check
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return sendResponse(res, 'UNSUPPORTED_MEDIA_TYPE', 'EXPECTING APPLICATION/JSON CONTENT.', requestId);
    }

    // 7. Payload Size Checks (50 KB limit)
    if (!validateRequestSize(req, res, requestId)) {
      return;
    }

    // 8. Body Parsing & Error Checks
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

    // 9. Schema Checks (Zod QuoteRequestSchema)
    const parsed = QuoteRequestSchema.safeParse(body);
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

    // 10. Honeypot Evaluation
    const isBot = !!payload._hp;
    if (isBot) {
      logWarn('[Security] Honeypot field filled. Bot detected.', { requestId });
      const hpRate = await consumeRateLimit(req, 'honeypot', requestId);
      if (!hpRate.allowed) {
        res.setHeader('Retry-After', String(hpRate.resetSeconds));
        return sendResponse(res, 'RATE_LIMITED', 'TOO MANY REQUEST ATTEMPTS.', requestId);
      }
      return sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY.', requestId);
    }

    // 11. Idempotency Check
    const fingerprint = deriveRequestFingerprint(payload);
    const clientIp = getClientIp(req);
    const supabase = getSupabaseAdmin();

    const { data: existing, error: queryError } = await supabase
      .from('quote_requests')
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
        return sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY (CACHED).', requestId);
      } else {
        logWarn('[Idempotency] submissionId reused with conflicting payload data.', {
          submissionId: payload.submissionId,
          requestId,
        });
        return sendResponse(res, 'IDEMPOTENCY_CONFLICT', 'TRANSACTION COLLISION DETECTED.', requestId);
      }
    }

    // 12. Rate Limit (3 submissions / 15 minutes)
    const rateLimit = await consumeRateLimit(req, 'quote', requestId);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.resetSeconds));
      return sendResponse(res, 'RATE_LIMITED', 'SUBMISSION LIMIT EXCEEDED. TRY AGAIN LATER.', requestId);
    }

    // 13. Turnstile Verification
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
    const normalizedLocation = payload.projectLocation.trim();
    const normalizedQty = parseFloat(payload.estimatedQty);
    const normalizedQtyUnit = payload.qtyUnit.trim();
    const normalizedRequiredBy = payload.requiredBy || null;
    const normalizedMessage = payload.message?.trim() || null;
    const normalizedVariant = payload.brickVariant;

    // 15. DB Persistence
    const identityHash = deriveRequestFingerprint({ clientIp });
    const { error: insertError } = await supabase.from('quote_requests').insert({
      submission_id: payload.submissionId,
      request_fingerprint: fingerprint,
      name: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
      company: normalizedCompany,
      project_location: normalizedLocation,
      estimated_qty: normalizedQty,
      qty_unit: normalizedQtyUnit,
      required_by: normalizedRequiredBy,
      message: normalizedMessage,
      brick_variant: normalizedVariant,
      consent_captured: payload.consentCaptured,
      client_identity: identityHash,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        logWarn('[Database] Concurrency double-insert blocked by primary unique key constraint.', { requestId });
        return sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY.', requestId);
      }
      logError('[Database] Persistence operation failed.', insertError, { requestId });
      return sendResponse(res, 'DEPENDENCY_UNAVAILABLE', 'DATABASE PERSISTENCE COLLAPSED.', requestId);
    }

    // 16. Optional Email notification
    const emailSubject = `New Batch Estimate Request - ${normalizedName}`;
    const emailHtml = `
      <h2>Maa Sita Int Udhyog - Quote Request Log</h2>
      <p><strong>Name:</strong> ${normalizedName}</p>
      <p><strong>Phone:</strong> ${normalizedPhone}</p>
      <p><strong>Location:</strong> ${normalizedLocation}</p>
      <p><strong>Quantity:</strong> ${normalizedQty} ${normalizedQtyUnit}</p>
      <p><strong>Variant Requested:</strong> ${normalizedVariant}</p>
      <p><strong>Required By:</strong> ${normalizedRequiredBy || 'N/A'}</p>
      <p><strong>Additional Specs:</strong> ${normalizedMessage || 'N/A'}</p>
      <p><strong>Submission UUID:</strong> ${payload.submissionId}</p>
    `;

    sendEmailNotification({ subject: emailSubject, html: emailHtml }, requestId);

    // 17. Structured logging
    logInfo('[Quote] Quote request processed successfully.', {
      submissionId: payload.submissionId,
      requestId,
    });

    // 18. Send response
    sendResponse(res, 'SUCCESS', 'OPERATIONAL TRANSACTION STEADY.', requestId);
  } catch (err) {
    sendInternalError(res, err, requestId);
  }
}
