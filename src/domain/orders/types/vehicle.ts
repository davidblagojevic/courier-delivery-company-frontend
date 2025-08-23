export interface VehicleInfo {
  id: string;
  name: string;
  maxWeight: number;
  isZeroEmission: boolean;
  vehicleImage: string | null;
  pricePerKilometer: number;
}