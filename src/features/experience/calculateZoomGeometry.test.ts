import { describe, test, expect } from 'vitest';
import { calculateZoomGeometry } from './calculateZoomGeometry';

describe('calculateZoomGeometry unit tests', () => {
  // Constants from poster-entrance.png
  const Wi = 1536;
  const Hi = 1024;
  const Fx = 775.5;
  const Fy = 548.5;
  const Tw = 277;
  const Th = 547;
  const overscan = 1.15;

  test('Focal point maps to container-local viewport center within tolerance', () => {
    const Wc = 1280;
    const Hc = 800;
    const { scale, translateX, translateY } = calculateZoomGeometry(Wc, Hc, Wc, Hc, 0, 0, overscan);

    // Compute Sc cover scaling factor
    const Sc = Math.max(Wc / Wi, Hc / Hi);
    const Ox = (Wc - Wi * Sc) / 2;
    const Oy = (Hc - Hi * Sc) / 2;

    // Source focal point scaled and centered in cover mode
    const Prx = Ox + Fx * Sc;
    const Pry = Oy + Fy * Sc;

    // Apply transform formula (right-to-left: scale then translate)
    const mappedX = scale * Prx + translateX;
    const mappedY = scale * Pry + translateY;

    // Viewport centers
    const Cvx = Wc / 2;
    const Cvy = Hc / 2;

    expect(Math.abs(mappedX - Cvx)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mappedY - Cvy)).toBeLessThanOrEqual(0.5);
  });

  test('Focal point maps correctly with container offsets from viewport origin', () => {
    const Wc = 1280;
    const Hc = 800;
    const containerLeft = 100;
    const containerTop = 150;
    const { scale, translateX, translateY } = calculateZoomGeometry(Wc, Hc, Wc, Hc, containerLeft, containerTop, overscan);

    // Compute Sc
    const Sc = Math.max(Wc / Wi, Hc / Hi);
    const Ox = (Wc - Wi * Sc) / 2;
    const Oy = (Hc - Hi * Sc) / 2;

    const Prx = Ox + Fx * Sc;
    const Pry = Oy + Fy * Sc;

    const mappedX = scale * Prx + translateX;
    const mappedY = scale * Pry + translateY;

    const Cvx = Wc / 2 - containerLeft;
    const Cvy = Hc / 2 - containerTop;

    expect(Math.abs(mappedX - Cvx)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mappedY - Cvy)).toBeLessThanOrEqual(0.5);
  });

  test('Portrait viewport handles vertical scaling and cropping', () => {
    const Wc = 430;
    const Hc = 932;
    const { scale, translateX, translateY } = calculateZoomGeometry(Wc, Hc, Wc, Hc, 0, 0, overscan);

    const Sc = Math.max(Wc / Wi, Hc / Hi);
    const Ox = (Wc - Wi * Sc) / 2;
    const Oy = (Hc - Hi * Sc) / 2;
    const Prx = Ox + Fx * Sc;
    const Pry = Oy + Fy * Sc;

    const mappedX = scale * Prx + translateX;
    const mappedY = scale * Pry + translateY;

    expect(Math.abs(mappedX - (Wc / 2))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mappedY - (Hc / 2))).toBeLessThanOrEqual(0.5);
  });

  test('Landscape viewport handles horizontal scaling and cropping', () => {
    const Wc = 1920;
    const Hc = 1080;
    const { scale, translateX, translateY } = calculateZoomGeometry(Wc, Hc, Wc, Hc, 0, 0, overscan);

    const Sc = Math.max(Wc / Wi, Hc / Hi);
    const Ox = (Wc - Wi * Sc) / 2;
    const Oy = (Hc - Hi * Sc) / 2;
    const Prx = Ox + Fx * Sc;
    const Pry = Oy + Fy * Sc;

    const mappedX = scale * Prx + translateX;
    const mappedY = scale * Pry + translateY;

    expect(Math.abs(mappedX - (Wc / 2))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mappedY - (Hc / 2))).toBeLessThanOrEqual(0.5);
  });

  test('Invalid dimensions fail-safely returning default 1 scale and 0 translation', () => {
    const resultZero = calculateZoomGeometry(0, 800, 1280, 800);
    expect(resultZero).toEqual({ scale: 1, translateX: 0, translateY: 0 });

    const resultNegative = calculateZoomGeometry(1280, -800, 1280, 800);
    expect(resultNegative).toEqual({ scale: 1, translateX: 0, translateY: 0 });
  });

  test('Overscan scales the geometry output proportionally', () => {
    const Wc = 1280;
    const Hc = 800;
    
    const geo1 = calculateZoomGeometry(Wc, Hc, Wc, Hc, 0, 0, 1.0);
    const geo2 = calculateZoomGeometry(Wc, Hc, Wc, Hc, 0, 0, 2.0);

    expect(geo2.scale).toBe(geo1.scale * 2);
  });

  test('Non-integer inputs resolve within tolerance', () => {
    const Wc = 375.6;
    const Hc = 812.4;
    const { scale, translateX, translateY } = calculateZoomGeometry(Wc, Hc, Wc, Hc, 0, 0, overscan);

    const Sc = Math.max(Wc / Wi, Hc / Hi);
    const Ox = (Wc - Wi * Sc) / 2;
    const Oy = (Hc - Hi * Sc) / 2;
    const Prx = Ox + Fx * Sc;
    const Pry = Oy + Fy * Sc;

    const mappedX = scale * Prx + translateX;
    const mappedY = scale * Pry + translateY;

    expect(Math.abs(mappedX - (Wc / 2))).toBeLessThanOrEqual(0.5);
    expect(Math.abs(mappedY - (Hc / 2))).toBeLessThanOrEqual(0.5);
  });
});
