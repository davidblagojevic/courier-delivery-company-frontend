import { type VehicleAvailabilityRule } from './vehicleAvailabilityRule';

export interface Vehicle {
  id: string;
  name: string;
  maxWeight: number;
  isZeroEmission: boolean;
  vehicleImage?: string;
  pricePerKilometer: number;
  vehicleAvailabilityRule: VehicleAvailabilityRule;
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
}
