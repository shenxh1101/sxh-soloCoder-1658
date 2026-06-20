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

export type AnomalyType = "fuel_high" | "fuel_mileage" | "maintenance_overdue" | "maintenance_overdue_km" | "maintenance_super_overdue" | "maintenance_high_cost";
export type AnomalyStatus = "pending" | "handling" | "resolved";

export interface AnomalyRecord {
  id: string;
  vehicleId: string;
  plateNumber: string;
  type: AnomalyType;
  title: string;
  description: string;
  relatedRecordId?: string;
  relatedRecordType?: "fuel" | "maintenance";
  severity: "low" | "medium" | "high";
  status: AnomalyStatus;
  detectedAt: string;
  handledAt?: string;
  handledBy?: string;
  handleNote?: string;
  value?: number;
  threshold?: number;
}

export type ApprovalAction = "approve" | "reject" | "resubmit";

export interface ApprovalRecord {
  id: string;
  maintenanceId: string;
  action: ApprovalAction;
  reason?: string;
  operator: string;
  operatorRole: string;
  operatedAt: string;
  description?: string;
  workshop?: string;
}

export interface ImportBatch {
  id: string;
  entityType: ImportEntityType;
  fileName: string;
  importedAt: string;
  importedBy: string;
  result: ImportResult;
  recordIds: string[];
  rolledBack: boolean;
  rolledBackAt?: string;
}

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
  approvalRecords?: ApprovalRecord[];
  notes?: string;
  createdAt: string;
}

export interface RiskTimelineEvent {
  id: string;
  vehicleId: string;
  eventType: "anomaly_detected" | "anomaly_handled" | "maintenance_overdue" | "fuel_high" | "maintenance_high_cost";
  title: string;
  description: string;
  occurredAt: string;
  severity: "low" | "medium" | "high";
  relatedAnomalyId?: string;
  relatedRecordId?: string;
  relatedRecordType?: "fuel" | "maintenance";
  handler?: string;
  handleNote?: string;
}

export interface VehicleRiskScore {
  vehicleId: string;
  plateNumber: string;
  driverName: string;
  currentMileage: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  fuelFluctuation: number;
  overdueMaintenanceCount: number;
  upcomingMaintenanceCount: number;
  unresolvedAnomalyCount: number;
  totalAnomalyCount: number;
  resolvedRate: number;
  trendData: Array<{ month: string; score: number }>;
}
