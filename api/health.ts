import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateRequestId } from './_lib/requestId.js';
import { getClientIp } from './_lib/clientIp.js';
import { sendResponse, sendInternalError } from './_lib/responseContract.js';
import { setSecurityHeaders } from './_lib/http.js';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const requestId = generateRequestId();

  try {
    setSecurityHeaders(res, req);

    if (req.method !== 'GET') {
      return sendResponse(res, 'METHOD_NOT_ALLOWED', 'ONLY GET ENTRANCE ALLOWED.', requestId);
    }

    const ip = getClientIp(req);
    sendResponse(res, 'SUCCESS', 'OPERATIONAL PIPELINES STEADY.', requestId, { ip });
  } catch (err) {
    sendInternalError(res, err, requestId);
  }
}
