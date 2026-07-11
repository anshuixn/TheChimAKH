import type { BrickProduct } from '../types';

export const RED_CLAY_BRICK: BrickProduct = {
  id: 'traditional-red-clay-brick',
  name: 'Traditional Red Fired-Clay Brick',
  description: 'Premium structural brick made from rich clay soil and fired in our state-of-the-art continuous kiln. Designed to withstand heavy structural loads and harsh weather conditions, offering enduring durability for generations of Indian architecture.',
  images: [
    '/images/brick-hero.jpg', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    '/images/brick-detail.jpg', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
  ],
  specs: {
    dimensions: '9" x 4.25" x 2.75" (Standard Indian Modular Size)', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    grade: 'Class I / Class II structural options available', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    weight: 'Approx. 3.0 kg to 3.5 kg', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    compressiveStrength: '10.5 N/mm² to 15.0 N/mm²', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    waterAbsorption: '< 15% of dry weight', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    dimensionalTolerance: '± 3 mm', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    rawMaterials: 'Rich alluvial soil, silt, and clean sand mix', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
    firingTemp: '900°C to 1000°C in continuous coal-fired kiln', // [PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]
  },
  applications: [
    'Load-bearing structural masonry walls',
    'Reinforced brick masonry structural panels',
    'Exposed facade brickwork (restrained classic aesthetic)',
    'Boundary walls, retaining structures, and foundations',
  ],
  packaging: 'Secured stacks of 500 bricks, plastic strapped on custom pallets (optional for bulk shipping)',
};
