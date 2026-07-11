import { getEnv } from './env.js';
import { logError, logInfo } from './logger.js';

export interface EmailOptions {
  subject: string;
  html: string;
}

/**
 * Dispatches an email notification via Resend.
 * RESEND_API_KEY is optional. If missing, this function returns silently without error.
 * Failure to dispatch email will be logged but does NOT throw, ensuring persistence success.
 */
export async function sendEmailNotification(
  options: EmailOptions,
  requestId: string
): Promise<void> {
  const env = getEnv();

  // 1. If RESEND_API_KEY is missing, bypass silently
  if (!env.RESEND_API_KEY) {
    logInfo('[Email] RESEND_API_KEY is not configured. Email notification bypassed.', { requestId });
    return;
  }

  // 2. If no notification recipient is set, bypass
  if (!env.NOTIFICATION_EMAIL) {
    logInfo('[Email] NOTIFICATION_EMAIL is not configured. Email notification bypassed.', { requestId });
    return;
  }

  const resendUrl = 'https://api.resend.com/emails';

  try {
    const response = await fetch(resendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Maa Sita Notification <notifications@maasitaudhyog.com>', // placeholder verified domain
        to: env.NOTIFICATION_EMAIL,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError(`[Email] Resend API responded with error status ${response.status}`, errorText, { requestId });
      return;
    }

    logInfo('[Email] Notification email successfully dispatched via Resend.', { requestId });
  } catch (err) {
    // Fail-soft: we log the error but do NOT propagate it or fail the request
    logError('[Email] Network failure during email dispatch.', err, { requestId });
  }
}
