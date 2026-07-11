import { describe, test, expect, vi } from 'vitest';
import { getCoverVector, renderFrame } from './frameRenderer';
import type { DecodedFrame } from './frameLoader';

describe('frameRenderer — Cover Mode Calculations', () => {
  test('wider image is cropped horizontally', () => {
    // Image: 200x100 (Ratio 2.0), Canvas: 100x100 (Ratio 1.0)
    // Cropped width should be 100, x-offset should be (200 - 100) / 2 = 50.
    const rect = getCoverVector(200, 100, 100, 100);
    expect(rect.sWidth).toBe(100);
    expect(rect.sHeight).toBe(100);
    expect(rect.sx).toBe(50);
    expect(rect.sy).toBe(0);
    expect(rect.dx).toBe(0);
    expect(rect.dy).toBe(0);
    expect(rect.dWidth).toBe(100);
    expect(rect.dHeight).toBe(100);
  });

  test('taller image is cropped vertically', () => {
    // Image: 100x200 (Ratio 0.5), Canvas: 100x100 (Ratio 1.0)
    // Cropped height should be 100, y-offset should be (200 - 100) / 2 = 50.
    const rect = getCoverVector(100, 200, 100, 100);
    expect(rect.sWidth).toBe(100);
    expect(rect.sHeight).toBe(100);
    expect(rect.sx).toBe(0);
    expect(rect.sy).toBe(50);
    expect(rect.dx).toBe(0);
    expect(rect.dy).toBe(0);
    expect(rect.dWidth).toBe(100);
    expect(rect.dHeight).toBe(100);
  });

  test('renderFrame calls ctx.drawImage with correct parameters', () => {
    const ctxMock = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const frame = {
      width: 200,
      height: 100,
    } as unknown as ImageBitmap;

    renderFrame(ctxMock, frame, 100, 100);

    expect(ctxMock.drawImage).toHaveBeenCalledTimes(1);
    expect(ctxMock.drawImage).toHaveBeenCalledWith(
      frame,
      50, // sx
      0,  // sy
      100, // sWidth
      100, // sHeight
      0,  // dx
      0,  // dy
      100, // dWidth
      100  // dHeight
    );
  });
});
