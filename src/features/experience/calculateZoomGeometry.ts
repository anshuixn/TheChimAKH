export interface ZoomGeometry {
  scale: number;
  translateX: number;
  translateY: number;
}

export function calculateZoomGeometry(
  viewportWidth: number,
  viewportHeight: number,
  containerWidth: number,
  containerHeight: number,
  containerLeft: number = 0,
  containerTop: number = 0,
  overscan: number = 1.15
): ZoomGeometry {
  // If any input dimensions are invalid, fall back to safe default transform
  if (
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    overscan <= 0
  ) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  // Intrinsic parameters measured from poster-entrance.png
  const Wi = 1536;
  const Hi = 1024;
  const Fx = 775.5;
  const Fy = 548.5;
  const Tw = 277;
  const Th = 547;

  // 1. Calculate Sc (cover scaling factor)
  const Sc = Math.max(containerWidth / Wi, containerHeight / Hi);
  const Wr = Wi * Sc;
  const Hr = Hi * Sc;

  // 2. Calculate offsets due to center alignment of cover background
  const Ox = (containerWidth - Wr) / 2;
  const Oy = (containerHeight - Hr) / 2;

  // 3. Rendered chimney center in container coordinates
  const Prx = Ox + Fx * Sc;
  const Pry = Oy + Fy * Sc;

  // 4. Rendered target box size
  const Trw = Tw * Sc;
  const Trh = Th * Sc;

  // 5. Calculate Zoom scale
  const Z = Math.max(viewportWidth / Trw, viewportHeight / Trh) * overscan;

  // 6. Viewport center in container coordinates
  const Cvx = viewportWidth / 2 - containerLeft;
  const Cvy = viewportHeight / 2 - containerTop;

  // 7. Translation offsets
  const Tx = Cvx - Z * Prx;
  const Ty = Cvy - Z * Pry;

  return {
    scale: Z,
    translateX: Tx,
    translateY: Ty,
  };
}
