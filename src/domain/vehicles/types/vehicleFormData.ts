export interface VehicleFormData {
  id?: string;
  name: string;
  maxWeight: number;
  isZeroEmission: boolean;
  pricePerKilometer: number;
  vehicleAvailabilityRuleId: string;
  vehicleImage?: string;
}
