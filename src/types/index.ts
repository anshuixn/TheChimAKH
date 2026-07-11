/**
 * Shared Type Definitions
 */

export interface BrickProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  specs: {
    dimensions?: string;
    grade?: string;
    weight?: string;
    compressiveStrength?: string;
    waterAbsorption?: string;
    dimensionalTolerance?: string;
    rawMaterials?: string;
    firingTemp?: string;
  };
  applications: string[];
  packaging: string;
}

export interface Project {
  id: string;
  title: string;
  location: string;
  year: number;
  description: string;
  quantityUsed: string;
}
