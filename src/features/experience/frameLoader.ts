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
  // Check if AbortSignal is already aborted
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Check if createImageBitmap is supported and available in the environment
  const useImageBitmap = typeof window !== 'undefined' && typeof window.createImageBitmap === 'function';

  if (useImageBitmap) {
    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Failed to fetch frame at ${url}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Additional check before starting expensive decode
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const bitmap = await window.createImageBitmap(blob);
      return bitmap;
    } catch (err) {
      // If aborted, propagate AbortError
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      
      // Fallback to HTMLImageElement on general network / decode errors
      console.warn(`[FrameLoader] createImageBitmap failed for ${url}, falling back to HTMLImageElement. Error:`, err);
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
      img.src = ''; // Cancel loading of image
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
      resolve(img);
    };

    img.onerror = () => {
      cleanup();
      reject(new Error(`Failed to load HTMLImageElement for ${url}`));
    };

    img.src = url;
  });
}
