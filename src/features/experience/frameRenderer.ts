import type { DecodedFrame } from './frameLoader';

/**
 * Calculates the source and destination rectangles for drawing an image on a canvas
 * in "cover" mode (cropping the image to fit the aspect ratio of the canvas).
 */
export function getCoverVector(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number
): {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
} {
  const imageRatio = imageWidth / imageHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let sx = 0;
  let sy = 0;
  let sWidth = imageWidth;
  let sHeight = imageHeight;

  if (imageRatio > canvasRatio) {
    // Image is wider than canvas — crop horizontally
    sWidth = imageHeight * canvasRatio;
    sx = (imageWidth - sWidth) / 2;
  } else {
    // Image is taller than canvas — crop vertically
    sHeight = imageWidth / canvasRatio;
    sy = (imageHeight - sHeight) / 2;
  }

  return {
    sx,
    sy,
    sWidth,
    sHeight,
    dx: 0,
    dy: 0,
    dWidth: canvasWidth,
    dHeight: canvasHeight,
  };
}

/**
 * Renders a single decoded frame onto a canvas 2D context using cover mode.
 * DPR-corrected canvas sizes should be set beforehand.
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  frame: DecodedFrame,
  canvasWidth: number,
  canvasHeight: number
): void {
  const frameWidth = 'width' in frame ? frame.width : (frame as HTMLImageElement).naturalWidth;
  const frameHeight = 'height' in frame ? frame.height : (frame as HTMLImageElement).naturalHeight;

  if (frameWidth <= 0 || frameHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return;
  }

  const { sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight } = getCoverVector(
    frameWidth,
    frameHeight,
    canvasWidth,
    canvasHeight
  );

  ctx.drawImage(frame, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
}
