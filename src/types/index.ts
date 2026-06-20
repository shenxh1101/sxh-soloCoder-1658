export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  initialMileage: number;
  currentMileage: number;
  driverName: string;
  driverPhone: string;
  purchaseDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverChangeRecord {
  id: string;
  vehicleId: string;
  oldDriverName: string;
  oldDriverPhone: string;
  newDriverName: string;
  newDriverPhone: string;
  changeDate: string;
  reason?: string;
  createdAt: string;
}

export type FuelRecordSource = "normal" | "backfill";

export interface FuelRecord {
  id: string;
  vehicleId: string;
  fuelAmount: number;
  fuelCost: number;
  pricePerLiter: number;
  currentMileage: number;
  fuelConsumption: number | null;
  gasStation: string;
  fuelDate: string;
  source: FuelRecordSource;
  notes?: string;
  createdAt: string;
}

export type MaintenanceType = "routine" | "fault" | "overhaul";
export type MaintenanceStatus = "pending_approval" | "rejected" | "pending" | "completed";

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  workshop: string;
  cost: number;
  mileageAfter: number;
  applyDate: string;
  finishDate: string;
  status: MaintenanceStatus;
  rejectReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface MaintenanceRule {
  id: string;
  vehicleId: string;
  intervalKm: number;
  lastMaintenanceKm: number;
  warningThreshold: number;
  enabled: boolean;
}

export interface MaintenancePlanItem {
  vehicleId: string;
  plate: string;
  driverName: string;
  currentMileage: number;
  lastMaintenanceKm: number;
  nextKm: number;
  remainingKm: number;
  estimatedDate: string;
  estimatedDays: number;
  level: AlertLevel;
}

export interface FuelRankItem {
  plate: string;
  avgConsumption: number;
  totalFuel: number;
  rank: number;
}

export interface CostRankItem {
  plate: string;
  cost: number;
  rank: number;
}

export interface MonthlyCost {
  fuel: number;
  maintenance: number;
  total: number;
}

export type AlertLevel = "safe" | "warning" | "danger";

export interface MaintenanceAlert {
  vehicleId: string;
  plate: string;
  driverName: string;
  currentMileage: number;
  nextKm: number;
  remaining: number;
  level: AlertLevel;
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  total: number;
}

export interface ImportPreviewItem<T = any> {
  row: number;
  data: T;
  status: "add" | "skip" | "error";
  message?: string;
}

export interface ImportPreviewResult<T = any> {
  willAdd: ImportPreviewItem<T>[];
  willSkip: ImportPreviewItem<T>[];
  willError: ImportPreviewItem<T>[];
  total: number;
}

export type ImportEntityType = "vehicle" | "fuel" | "maintenance";
