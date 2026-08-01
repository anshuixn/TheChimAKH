/**
 * frameLoader.ts
 * ================
 * Handles loading and decoding of individual images.
 * Uses fetch + createImageBitmap for hardware-accelerated off-thread decoding,
 * with standard HTMLImageElement fallback.
 *
 * Supports AbortSignal for immediate request cancellation on scroll speed changes or unmounts.
 */

export type DecodedFrame = ImageBitmap | HTMLImageElement;


export async function loadFrame(
  url: string,
  signal?: AbortSignal
): Promise<DecodedFrame> {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const useImageBitmap =
    typeof window !== 'undefined' && typeof window.createImageBitmap === 'function';

  if (useImageBitmap) {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch frame at ${url}: ${response.statusText}`);
      }

      const blob = await response.blob();

      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      // Decode at full native resolution — preserves crisp brick details, sharp chimney text, and maximum clarity.
      const bitmap = await window.createImageBitmap(blob);
      return bitmap;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      // createImageBitmap with options failed — retry without resize options
      // (some older mobile browsers reject unknown ImageBitmapOptions keys)
      try {
        const response2 = await fetch(url, { signal });
        if (!response2.ok) { const e = new Error(`Retry fetch failed: ${response2.statusText}`); Object.assign(e, { cause: err }); throw e; }
        const blob2 = await response2.blob();
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const bitmap2 = await window.createImageBitmap(blob2);
        return bitmap2;
      } catch (err2) {
        if (err2 instanceof DOMException && err2.name === 'AbortError') throw err2;
        console.warn(`[FrameLoader] createImageBitmap failed for ${url}, falling back to HTMLImageElement.`, err2);
      }
    }
  }

  // HTMLImageElement fallback
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      signal?.removeEventListener('abort', handleAbort);
    };

    const handleAbort = () => {
      cleanup();
      img.src = '';
      reject(new DOMException('Aborted', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener('abort', handleAbort);
    }

    img.onload = () => {
      cleanup();
      if (typeof img.decode === 'function') {
        img.decode()
          .then(() => { resolve(img); })
          .catch(() => { resolve(img); });
      } else {
        resolve(img);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load HTMLImageElement for ${url}`));
    };

    img.src = url;
  });
}
