export interface AvailableVehicle {
  vehicleId: string;
  name: string;
  isZeroEmission: boolean;
  vehicleImage: string | null;
  price: number;
  maxWeight: number;
}
