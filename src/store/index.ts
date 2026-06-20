import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  mockVehicles,
  mockFuelRecords,
  mockMaintenanceRecords,
  mockMaintenanceRules,
} from "@/data/mock";
import type {
  Vehicle,
  FuelRecord,
  MaintenanceRecord,
  MaintenanceRule,
  FuelRankItem,
  CostRankItem,
  MonthlyCost,
  MaintenanceAlert,
  AlertLevel,
  DriverChangeRecord,
  FuelRecordSource,
  ImportResult,
  ImportEntityType,
  ImportPreviewResult,
  ImportPreviewItem,
  MaintenancePlanItem,
  AnomalyRecord,
  AnomalyType,
  AnomalyStatus,
  ApprovalRecord,
  ImportBatch,
  RiskTimelineEvent,
  VehicleRiskScore,
} from "@/types";
import {
  calcFuelConsumption,
  calcRemainingKm,
  calcEstimatedMaintenanceDate,
  isSameMonth,
  lastNMonths,
} from "@/utils/calculations";
import {
  parseCSV,
  validateVehicleRow,
  createEmptyImportResult,
} from "@/utils/csv";

interface StoreState {
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  maintenanceRecords: MaintenanceRecord[];
  maintenanceRules: MaintenanceRule[];
  driverChangeRecords: DriverChangeRecord[];
  anomalyRecords: AnomalyRecord[];
  importBatches: ImportBatch[];
  filters: {
    month: string;
  };
  selectedVehicles: string[];
  getVehicleById: (id: string) => Vehicle | undefined;
  getFuelRecordsByVehicle: (vehicleId: string) => FuelRecord[];
  getMaintenanceRecordsByVehicle: (
    vehicleId: string
  ) => MaintenanceRecord[];
  getLastFuelRecordByVehicle: (
    fuelRecords: FuelRecord[],
    vehicleId: string,
    beforeDate?: string,
    beforeCreatedAt?: string
  ) => FuelRecord | null;
  getRuleByVehicle: (vehicleId: string) => MaintenanceRule | undefined;
  addVehicle: (v: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => Vehicle;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  addDriverChangeRecord: (
    record: Omit<DriverChangeRecord, "id" | "createdAt">
  ) => void;
  getDriverChangesByVehicle: (vehicleId: string) => DriverChangeRecord[];
  addFuelRecord: (
    r: Omit<FuelRecord, "id" | "fuelConsumption" | "createdAt" | "source">
  ) => FuelRecord;
  addFuelRecordBackfill: (
    r: Omit<FuelRecord, "id" | "fuelConsumption" | "createdAt" | "source">,
    createdAt?: string
  ) => FuelRecord;
  addMaintenanceRecord: (
    r: Omit<MaintenanceRecord, "id" | "createdAt" | "approvalRecords">
  ) => MaintenanceRecord;
  completeMaintenance: (
    id: string,
    data: { finishDate: string; cost: number; mileageAfter: number }
  ) => void;
  updateMaintenanceRule: (
    vehicleId: string,
    data: Partial<MaintenanceRule>
  ) => void;
  markMaintenanceDone: (vehicleId: string, currentKm: number) => void;
  getMonthlyFuelRank: (month: string) => FuelRankItem[];
  getMonthlyCostRank: (month: string) => CostRankItem[];
  getMonthlyTotalCost: (month: string) => MonthlyCost;
  getMaintenanceAlerts: () => MaintenanceAlert[];
  setFilterMonth: (month: string) => void;
  toggleSelectedVehicle: (vehicleId: string) => void;
  clearSelectedVehicles: () => void;
  getVehicleCostTrend: (
    vehicleId: string,
    months: number
  ) => Array<{
    month: string;
    fuel: number;
    maintenance: number;
    total: number;
  }>;
  getLast6MonthsCost: () => Array<{
    month: string;
    fuel: number;
    maintenance: number;
    total: number;
  }>;
  importFromCSV: (
    entityType: ImportEntityType,
    csvText: string
  ) => ImportResult;
  approveMaintenance: (id: string) => void;
  rejectMaintenance: (id: string, reason: string) => void;
  getMaintenancePlan: (days?: number) => MaintenancePlanItem[];
  previewImportCSV: (
    entityType: ImportEntityType,
    csvText: string
  ) => ImportPreviewResult;
  detectAnomalies: () => AnomalyRecord[];
  getAnomalies: (
    filters?: { vehicleId?: string; status?: AnomalyStatus; type?: AnomalyType }
  ) => AnomalyRecord[];
  handleAnomaly: (
    id: string,
    status: AnomalyStatus,
    note?: string,
    operator?: string
  ) => void;
  approveMaintenanceWithRecord: (
    id: string,
    operator?: string,
    operatorRole?: string
  ) => void;
  rejectMaintenanceWithRecord: (
    id: string,
    reason: string,
    operator?: string,
    operatorRole?: string
  ) => void;
  resubmitMaintenance: (
    id: string,
    updates?: Partial<MaintenanceRecord>
  ) => void;
  getApprovalRecordsByMaintenance: (maintenanceId: string) => ApprovalRecord[];
  importFromCSVWithBatch: (
    entityType: ImportEntityType,
    csvText: string,
    fileName: string,
    operator?: string
  ) => { batch: ImportBatch; result: ImportResult };
  rollbackImportBatch: (batchId: string, operator?: string) => boolean;
  getImportBatches: (entityType?: ImportEntityType) => ImportBatch[];
  getVehicleAnomalyStats: (
    vehicleId: string,
    months?: number
  ) => { total: number; pending: number; resolved: number; resolvedRate: number };
  getVehicleAnomalyTrend: (
    vehicleId: string,
    months: number
  ) => Array<{ month: string; count: number; resolved: number }>;
  getRiskTimeline: (vehicleId: string) => RiskTimelineEvent[];
  getVehicleRiskScores: (months: number) => VehicleRiskScore[];
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getLastFuelRecordByVehicle(
  fuelRecords: FuelRecord[],
  vehicleId: string,
  beforeDate?: string,
  beforeCreatedAt?: string
): FuelRecord | null {
  const filtered = fuelRecords
    .filter((r) => {
      if (r.vehicleId !== vehicleId) return false;
      if (beforeDate && r.fuelDate >= beforeDate) return false;
      if (beforeDate && r.fuelDate === beforeDate && beforeCreatedAt && (!r.createdAt || r.createdAt >= beforeCreatedAt)) return false;
      return true;
    })
    .sort((a, b) => {
      const ad = new Date(a.fuelDate).getTime();
      const bd = new Date(b.fuelDate).getTime();
      if (bd !== ad) return bd - ad;
      const ac = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bc = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (bc !== ac) return bc - ac;
      return b.currentMileage - a.currentMileage;
    });
  return filtered[0] || null;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      vehicles: mockVehicles,
      fuelRecords: mockFuelRecords,
      maintenanceRecords: mockMaintenanceRecords,
      maintenanceRules: mockMaintenanceRules,
      driverChangeRecords: [],
      anomalyRecords: [],
      importBatches: [],
      filters: {
        month: lastNMonths(1)[0],
      },
      selectedVehicles: [],

      getVehicleById: (id) => get().vehicles.find((v) => v.id === id),

      getFuelRecordsByVehicle: (vehicleId) =>
        get().fuelRecords.filter((r) => r.vehicleId === vehicleId),

      getMaintenanceRecordsByVehicle: (vehicleId) =>
        get()
          .maintenanceRecords.filter((r) => r.vehicleId === vehicleId)
          .sort((a, b) => {
            const ad = new Date(a.applyDate).getTime();
            const bd = new Date(b.applyDate).getTime();
            if (bd !== ad) return bd - ad;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }),

      getLastFuelRecordByVehicle: (
        fuelRecords,
        vehicleId,
        beforeDate,
        beforeCreatedAt
      ) => getLastFuelRecordByVehicle(fuelRecords, vehicleId, beforeDate, beforeCreatedAt),

      getRuleByVehicle: (vehicleId) =>
        get().maintenanceRules.find((r) => r.vehicleId === vehicleId),

      addVehicle: (v) => {
        const newVehicle: Vehicle = {
          ...v,
          id: genId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const defaultRule: MaintenanceRule = {
          id: genId(),
          vehicleId: newVehicle.id,
          intervalKm: 5000,
          lastMaintenanceKm: newVehicle.initialMileage,
          warningThreshold: 500,
          enabled: true,
        };
        set((s) => ({
          vehicles: [...s.vehicles, newVehicle],
          maintenanceRules: [...s.maintenanceRules, defaultRule],
        }));
        return newVehicle;
      },

      updateVehicle: (id, data) => {
        const { vehicles, addDriverChangeRecord, getVehicleById } = get();
        const oldVehicle = getVehicleById(id);
        if (!oldVehicle) return;

        const newVehicles = vehicles.map((v) => {
          if (v.id === id) {
            return {
              ...v,
              ...data,
              updatedAt: new Date().toISOString(),
            };
          }
          return v;
        });

        if (
          (data.driverName && data.driverName !== oldVehicle.driverName) ||
          (data.driverPhone && data.driverPhone !== oldVehicle.driverPhone)
        ) {
          addDriverChangeRecord({
            vehicleId: id,
            oldDriverName: oldVehicle.driverName,
            oldDriverPhone: oldVehicle.driverPhone,
            newDriverName: data.driverName || oldVehicle.driverName,
            newDriverPhone: data.driverPhone || oldVehicle.driverPhone,
            changeDate: new Date().toISOString().split("T")[0],
          });
        }

        set({ vehicles: newVehicles });
      },

      deleteVehicle: (id) => {
        set((s) => ({
          vehicles: s.vehicles.filter((v) => v.id !== id),
          fuelRecords: s.fuelRecords.filter((r) => r.vehicleId !== id),
          maintenanceRecords: s.maintenanceRecords.filter(
            (r) => r.vehicleId !== id
          ),
          maintenanceRules: s.maintenanceRules.filter(
            (r) => r.vehicleId !== id
          ),
          driverChangeRecords: s.driverChangeRecords.filter(
            (r) => r.vehicleId !== id
          ),
          selectedVehicles: s.selectedVehicles.filter((vid) => vid !== id),
        }));
      },

      addDriverChangeRecord: (record) => {
        const newRecord: DriverChangeRecord = {
          ...record,
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          driverChangeRecords: [...s.driverChangeRecords, newRecord],
        }));
      },

      getDriverChangesByVehicle: (vehicleId) =>
        get()
          .driverChangeRecords.filter((r) => r.vehicleId === vehicleId)
          .sort(
            (a, b) =>
              new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
          ),

      addFuelRecord: (r) => {
        const { fuelRecords, getVehicleById, updateVehicle } = get();
        const createdAt = new Date().toISOString();
        const last = getLastFuelRecordByVehicle(
          fuelRecords,
          r.vehicleId,
          r.fuelDate,
          createdAt
        );
        const vehicle = getVehicleById(r.vehicleId);
        const lastMileage = last
          ? last.currentMileage
          : vehicle?.initialMileage || 0;
        const consumption = calcFuelConsumption(
          r.currentMileage,
          lastMileage,
          r.fuelAmount
        );
        const newRecord: FuelRecord = {
          ...r,
          id: genId(),
          source: "normal",
          fuelConsumption: consumption,
          createdAt,
        };

        if (vehicle && r.currentMileage > vehicle.currentMileage) {
          updateVehicle(vehicle.id, { currentMileage: r.currentMileage });
        }

        set((s) => ({
          fuelRecords: [...s.fuelRecords, newRecord],
        }));
        return newRecord;
      },

      addFuelRecordBackfill: (r, createdAt) => {
        const { fuelRecords, getVehicleById } = get();
        const actualCreatedAt = createdAt || new Date().toISOString();
        const last = getLastFuelRecordByVehicle(
          fuelRecords,
          r.vehicleId,
          r.fuelDate,
          actualCreatedAt
        );
        const vehicle = getVehicleById(r.vehicleId);
        const lastMileage = last
          ? last.currentMileage
          : vehicle?.initialMileage || 0;
        const consumption = calcFuelConsumption(
          r.currentMileage,
          lastMileage,
          r.fuelAmount
        );
        const newRecord: FuelRecord = {
          ...r,
          id: genId(),
          source: "backfill",
          fuelConsumption: consumption,
          createdAt: actualCreatedAt,
        };
        set((s) => ({
          fuelRecords: [...s.fuelRecords, newRecord],
        }));
        return newRecord;
      },

      addMaintenanceRecord: (r) => {
        const newRecord: MaintenanceRecord = {
          ...r,
          status: "pending_approval",
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          maintenanceRecords: [...s.maintenanceRecords, newRecord],
        }));
        return newRecord;
      },

      completeMaintenance: (id, data) => {
        const { maintenanceRecords, getVehicleById, updateVehicle } = get();
        const record = maintenanceRecords.find((r) => r.id === id);
        if (!record) return;

        if (record.type === "routine") {
          get().markMaintenanceDone(record.vehicleId, data.mileageAfter);
        }

        const vehicle = getVehicleById(record.vehicleId);
        if (vehicle && data.mileageAfter > vehicle.currentMileage) {
          updateVehicle(vehicle.id, { currentMileage: data.mileageAfter });
        }

        set((s) => ({
          maintenanceRecords: s.maintenanceRecords.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...data,
                  status: "completed",
                }
              : r
          ),
        }));
      },

      approveMaintenance: (id) => {
        set((s) => ({
          maintenanceRecords: s.maintenanceRecords.map((r) =>
            r.id === id && r.status === "pending_approval"
              ? {
                  ...r,
                  status: "pending",
                  approvedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      rejectMaintenance: (id, reason) => {
        set((s) => ({
          maintenanceRecords: s.maintenanceRecords.map((r) =>
            r.id === id && r.status === "pending_approval"
              ? {
                  ...r,
                  status: "rejected",
                  rejectReason: reason,
                  rejectedAt: new Date().toISOString(),
                }
              : r
          ),
        }));
      },

      updateMaintenanceRule: (vehicleId, data) => {
        set((s) => ({
          maintenanceRules: s.maintenanceRules.map((r) =>
            r.vehicleId === vehicleId ? { ...r, ...data } : r
          ),
        }));
      },

      markMaintenanceDone: (vehicleId, currentKm) => {
        const { maintenanceRules, getRuleByVehicle } = get();
        const rule = getRuleByVehicle(vehicleId);
        if (!rule) {
          const newRule: MaintenanceRule = {
            id: genId(),
            vehicleId,
            intervalKm: 5000,
            lastMaintenanceKm: currentKm,
            warningThreshold: 500,
            enabled: true,
          };
          set((s) => ({
            maintenanceRules: [...s.maintenanceRules, newRule],
          }));
          return;
        }
        const newLastKm = Math.max(rule.lastMaintenanceKm, currentKm);
        set({
          maintenanceRules: maintenanceRules.map((r) =>
            r.vehicleId === vehicleId
              ? { ...r, lastMaintenanceKm: newLastKm }
              : r
          ),
        });
      },

      getMonthlyFuelRank: (month) => {
        const { vehicles, fuelRecords } = get();
        const data = vehicles.map((v) => {
          const vRecords = fuelRecords.filter(
            (r) => r.vehicleId === v.id && isSameMonth(r.fuelDate, month)
          );
          const totalFuel = vRecords.reduce((s, r) => s + r.fuelAmount, 0);
          const consumptions = vRecords
            .map((r) => r.fuelConsumption)
            .filter((c): c is number => c !== null && c !== undefined);
          const avgConsumption =
            consumptions.length > 0
              ? consumptions.reduce((s, n) => s + n, 0) / consumptions.length
              : Infinity;
          return {
            plate: v.plateNumber,
            avgConsumption,
            totalFuel,
            rank: 0,
          };
        });

        const sortedData = [...data]
          .filter((d) => d.avgConsumption !== Infinity)
          .sort((a, b) => a.avgConsumption - b.avgConsumption);

        let currentRank = 0;
        let prevValue: number | null = null;
        const ranked = sortedData.map((item, idx) => {
          if (item.avgConsumption !== prevValue) {
            currentRank = idx + 1;
          }
          prevValue = item.avgConsumption;
          return { ...item, rank: currentRank };
        });

        const noData = data.filter((d) => d.avgConsumption === Infinity);
        return [...ranked, ...noData];
      },

      getMonthlyCostRank: (month) => {
        const { vehicles, maintenanceRecords } = get();
        const data = vehicles.map((v) => {
          const cost = maintenanceRecords
            .filter(
              (r) =>
                r.vehicleId === v.id &&
                r.status === "completed" &&
                isSameMonth(r.finishDate, month)
            )
            .reduce((s, r) => s + r.cost, 0);
          return { plate: v.plateNumber, cost, rank: 0 };
        });
        const sorted = [...data]
          .filter((d) => d.cost > 0)
          .sort((a, b) => b.cost - a.cost);

        let currentRank = 0;
        let prevValue: number | null = null;
        const ranked = sorted.map((item, idx) => {
          if (item.cost !== prevValue) {
            currentRank = idx + 1;
          }
          prevValue = item.cost;
          return { ...item, rank: currentRank };
        });
        const noCost = data.filter((d) => d.cost <= 0);
        return [...ranked, ...noCost];
      },

      getMonthlyTotalCost: (month) => {
        const { fuelRecords, maintenanceRecords } = get();
        const fuel = fuelRecords
          .filter((r) => isSameMonth(r.fuelDate, month))
          .reduce((s, r) => s + r.fuelCost, 0);
        const maintenance = maintenanceRecords
          .filter(
            (r) => r.status === "completed" && isSameMonth(r.finishDate, month)
          )
          .reduce((s, r) => s + r.cost, 0);
        return { fuel, maintenance, total: fuel + maintenance };
      },

      getMaintenanceAlerts: () => {
        const { vehicles, maintenanceRules } = get();
        const alerts: MaintenanceAlert[] = [];
        vehicles.forEach((v) => {
          const rule = maintenanceRules.find((r) => r.vehicleId === v.id);
          if (!rule || !rule.enabled) return;
          const { remaining, nextKm, level } = calcRemainingKm(
            v.currentMileage,
            rule.lastMaintenanceKm,
            rule.intervalKm,
            rule.warningThreshold
          );
          alerts.push({
            vehicleId: v.id,
            plate: v.plateNumber,
            driverName: v.driverName,
            currentMileage: v.currentMileage,
            nextKm,
            remaining,
            level,
          });
        });
        const levelOrder: Record<AlertLevel, number> = {
          danger: 0,
          warning: 1,
          safe: 2,
        };
        return alerts.sort(
          (a, b) => levelOrder[a.level] - levelOrder[b.level] || a.remaining - b.remaining
        );
      },

      getMaintenancePlan: (days = 30) => {
        const { vehicles, maintenanceRules } = get();
        const plan: MaintenancePlanItem[] = [];
        vehicles.forEach((v) => {
          const rule = maintenanceRules.find((r) => r.vehicleId === v.id);
          if (!rule || !rule.enabled) return;
          const { remaining, nextKm, level } = calcRemainingKm(
            v.currentMileage,
            rule.lastMaintenanceKm,
            rule.intervalKm,
            rule.warningThreshold
          );
          const { estimatedDate, estimatedDays } = calcEstimatedMaintenanceDate(
            v.currentMileage,
            rule.lastMaintenanceKm,
            rule.intervalKm,
            200
          );
          if (estimatedDays <= days) {
            plan.push({
              vehicleId: v.id,
              plate: v.plateNumber,
              driverName: v.driverName,
              currentMileage: v.currentMileage,
              lastMaintenanceKm: rule.lastMaintenanceKm,
              nextKm,
              remainingKm: remaining,
              estimatedDate,
              estimatedDays,
              level,
            });
          }
        });
        return plan.sort((a, b) => a.estimatedDays - b.estimatedDays);
      },

      setFilterMonth: (month) => {
        set((s) => ({ filters: { ...s.filters, month } }));
      },

      toggleSelectedVehicle: (vehicleId) => {
        set((s) => {
          const exists = s.selectedVehicles.includes(vehicleId);
          if (exists) {
            return {
              selectedVehicles: s.selectedVehicles.filter((id) => id !== vehicleId),
            };
          }
          if (s.selectedVehicles.length >= 3) {
            return s;
          }
          return {
            selectedVehicles: [...s.selectedVehicles, vehicleId],
          };
        });
      },

      clearSelectedVehicles: () => {
        set({ selectedVehicles: [] });
      },

      getVehicleCostTrend: (vehicleId, months) => {
        const { fuelRecords, maintenanceRecords } = get();
        const monthList = lastNMonths(months);
        return monthList.map((m) => {
          const fuel = fuelRecords
            .filter((r) => r.vehicleId === vehicleId && isSameMonth(r.fuelDate, m))
            .reduce((s, r) => s + r.fuelCost, 0);
          const maintenance = maintenanceRecords
            .filter(
              (r) =>
                r.vehicleId === vehicleId &&
                r.status === "completed" &&
                isSameMonth(r.finishDate, m)
            )
            .reduce((s, r) => s + r.cost, 0);
          return { month: m, fuel, maintenance, total: fuel + maintenance };
        });
      },

      getLast6MonthsCost: () => {
        const { fuelRecords, maintenanceRecords } = get();
        const monthList = lastNMonths(6);
        return monthList.map((m) => {
          const fuel = fuelRecords
            .filter((r) => isSameMonth(r.fuelDate, m))
            .reduce((s, r) => s + r.fuelCost, 0);
          const maintenance = maintenanceRecords
            .filter(
              (r) =>
                r.status === "completed" &&
                isSameMonth(r.finishDate, m)
            )
            .reduce((s, r) => s + r.cost, 0);
          return { month: m, fuel, maintenance, total: fuel + maintenance };
        });
      },

      importFromCSV: (entityType, csvText) => {
        const result = createEmptyImportResult();
        const rows = parseCSV(csvText);
        if (rows.length < 2) return result;

        const headers = rows[0].map((h) => h.trim());
        const dataRows = rows.slice(1);
        result.total = dataRows.length;

        if (entityType === "vehicle") {
          const newVehicles: Vehicle[] = [];
          const newRules: MaintenanceRule[] = [];
          dataRows.forEach((row, idx) => {
            try {
              const validated = validateVehicleRow(row, headers);
              if (!validated) {
                result.failed++;
                result.errors.push({
                  row: idx + 2,
                  message: "缺少必填字段（车牌号、车型）",
                });
                return;
              }
              const existing = get().vehicles.find(
                (v) => v.plateNumber === validated.plateNumber
              );
              if (existing) {
                result.skipped++;
                result.errors.push({
                  row: idx + 2,
                  message: `车牌号 ${validated.plateNumber} 已存在，跳过`,
                });
                return;
              }
              const v: Vehicle = {
                ...validated,
                id: genId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              newVehicles.push(v);
              newRules.push({
                id: genId(),
                vehicleId: v.id,
                intervalKm: 5000,
                lastMaintenanceKm: v.initialMileage,
                warningThreshold: 500,
                enabled: true,
              });
              result.success++;
            } catch (e) {
              result.failed++;
              result.errors.push({
                row: idx + 2,
                message: e instanceof Error ? e.message : "解析失败",
              });
            }
          });
          set((s) => ({
            vehicles: [...s.vehicles, ...newVehicles],
            maintenanceRules: [...s.maintenanceRules, ...newRules],
          }));
        } else if (entityType === "fuel") {
          const getField = (name: string, row: string[]) =>
            row[headers.indexOf(name)]?.trim() || "";
          const vehicleMap: Record<string, string> = {};
          get().vehicles.forEach((v) => {
            vehicleMap[v.plateNumber] = v.id;
          });
          const newRecords: FuelRecord[] = [];
          dataRows.forEach((row, idx) => {
            try {
              const plate = getField("车牌号", row);
              const vehicleId = vehicleMap[plate];
              if (!vehicleId) {
                result.failed++;
                result.errors.push({
                  row: idx + 2,
                  message: `找不到车牌号 ${plate}`,
                });
                return;
              }
              const fuelAmount = parseFloat(getField("加油量(L)", row));
              const fuelCost = parseFloat(getField("金额(元)", row));
              const pricePerLiter = parseFloat(getField("单价(元/L)", row)) || 0;
              const currentMileage = parseInt(getField("当前里程", row));
              const fuelDate = getField("加油日期", row) || new Date().toISOString().split("T")[0];
              const sourceStr = getField("来源", row);
              const source: FuelRecordSource =
                sourceStr === "补录" ? "backfill" : "normal";

              if (!fuelAmount || !currentMileage || !fuelCost) {
                result.failed++;
                result.errors.push({
                  row: idx + 2,
                  message: "缺少必填字段（加油量、当前里程、金额）",
                });
                return;
              }

              const allRecords = [...get().fuelRecords, ...newRecords];
              const createdAt = new Date().toISOString();
              const last = getLastFuelRecordByVehicle(
                allRecords,
                vehicleId,
                fuelDate,
                createdAt
              );
              const vehicle = get().vehicles.find((v) => v.id === vehicleId);
              const lastMileage = last
                ? last.currentMileage
                : vehicle?.initialMileage || 0;
              const consumption = calcFuelConsumption(
                currentMileage,
                lastMileage,
                fuelAmount
              );

              newRecords.push({
                id: genId(),
                vehicleId,
                fuelAmount,
                fuelCost,
                pricePerLiter: pricePerLiter || fuelCost / fuelAmount,
                currentMileage,
                fuelConsumption: consumption,
                gasStation: getField("加油站", row) || "",
                fuelDate,
                source,
                notes: getField("备注", row),
                createdAt,
              });
              result.success++;
            } catch (e) {
              result.failed++;
              result.errors.push({
                row: idx + 2,
                message: e instanceof Error ? e.message : "解析失败",
              });
            }
          });

          const recordsWithSource = newRecords.filter(
            (r) => r.source === "normal"
          );
          recordsWithSource.forEach((r) => {
            const vehicle = get().vehicles.find((v) => v.id === r.vehicleId);
            if (vehicle && r.currentMileage > vehicle.currentMileage) {
              get().updateVehicle(vehicle.id, {
                currentMileage: r.currentMileage,
              });
            }
          });

          set((s) => ({
            fuelRecords: [...s.fuelRecords, ...newRecords],
          }));
        } else if (entityType === "maintenance") {
          const getField = (name: string, row: string[]) =>
            row[headers.indexOf(name)]?.trim() || "";
          const vehicleMap: Record<string, string> = {};
          get().vehicles.forEach((v) => {
            vehicleMap[v.plateNumber] = v.id;
          });
          const typeMap: Record<string, "routine" | "fault" | "overhaul"> = {
            "常规保养": "routine",
            "故障维修": "fault",
            "大修": "overhaul",
          };
          const statusMap: Record<string, "pending" | "completed"> = {
            待完成: "pending",
            已完成: "completed",
          };
          const newRecords: MaintenanceRecord[] = [];
          dataRows.forEach((row, idx) => {
            try {
              const plate = getField("车牌号", row);
              const vehicleId = vehicleMap[plate];
              if (!vehicleId) {
                result.failed++;
                result.errors.push({
                  row: idx + 2,
                  message: `找不到车牌号 ${plate}`,
                });
                return;
              }
              const typeStr = getField("维修类型", row);
              const type = typeMap[typeStr] || "fault";
              const cost = parseFloat(getField("费用(元)", row)) || 0;
              const mileageAfter = parseInt(getField("维修后里程", row)) || 0;
              const applyDate =
                getField("申请日期", row) ||
                new Date().toISOString().split("T")[0];
              const finishDate =
                getField("完成日期", row) ||
                new Date().toISOString().split("T")[0];
              const statusStr = getField("状态", row);
              const status = statusMap[statusStr] || "completed";

              if (!getField("故障描述", row)) {
                result.failed++;
                result.errors.push({
                  row: idx + 2,
                  message: "缺少必填字段（故障描述）",
                });
                return;
              }

              newRecords.push({
                id: genId(),
                vehicleId,
                type,
                description: getField("故障描述", row),
                workshop: getField("维修厂", row) || "",
                cost,
                mileageAfter,
                applyDate,
                finishDate,
                status,
                notes: getField("备注", row),
                createdAt: new Date().toISOString(),
              });
              result.success++;
            } catch (e) {
              result.failed++;
              result.errors.push({
                row: idx + 2,
                message: e instanceof Error ? e.message : "解析失败",
              });
            }
          });

          const completed = newRecords.filter(
            (r) => r.status === "completed" && r.type === "routine"
          );
          completed.forEach((r) => {
            get().markMaintenanceDone(r.vehicleId, r.mileageAfter);
            const vehicle = get().vehicles.find((v) => v.id === r.vehicleId);
            if (vehicle && r.mileageAfter > vehicle.currentMileage) {
              get().updateVehicle(vehicle.id, {
                currentMileage: r.mileageAfter,
              });
            }
          });

          set((s) => ({
            maintenanceRecords: [...s.maintenanceRecords, ...newRecords],
          }));
        }
        return result;
      },

      previewImportCSV: (entityType, csvText) => {
        const willAdd: ImportPreviewItem[] = [];
        const willSkip: ImportPreviewItem[] = [];
        const willError: ImportPreviewItem[] = [];
        const rows = parseCSV(csvText);

        if (rows.length < 2) {
          return { willAdd, willSkip, willError, total: 0 };
        }

        const headers = rows[0].map((h) => h.trim());
        const dataRows = rows.slice(1);
        const total = dataRows.length;

        if (entityType === "vehicle") {
          dataRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            try {
              const validated = validateVehicleRow(row, headers);
              if (!validated) {
                willError.push({
                  row: rowNum,
                  data: row,
                  status: "error",
                  message: "缺少必填字段（车牌号、车型）",
                });
                return;
              }
              const existing = get().vehicles.find(
                (v) => v.plateNumber === validated.plateNumber
              );
              if (existing) {
                willSkip.push({
                  row: rowNum,
                  data: validated,
                  status: "skip",
                  message: `车牌号 ${validated.plateNumber} 已存在，跳过`,
                });
                return;
              }
              willAdd.push({
                row: rowNum,
                data: validated,
                status: "add",
              });
            } catch (e) {
              willError.push({
                row: rowNum,
                data: row,
                status: "error",
                message: e instanceof Error ? e.message : "解析失败",
              });
            }
          });
        } else if (entityType === "fuel") {
          const getField = (name: string, row: string[]) =>
            row[headers.indexOf(name)]?.trim() || "";
          const vehicleMap: Record<string, string> = {};
          get().vehicles.forEach((v) => {
            vehicleMap[v.plateNumber] = v.id;
          });
          dataRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            try {
              const plate = getField("车牌号", row);
              const vehicleId = vehicleMap[plate];
              if (!vehicleId) {
                willError.push({
                  row: rowNum,
                  data: row,
                  status: "error",
                  message: `找不到车牌号 ${plate}`,
                });
                return;
              }
              const fuelAmount = parseFloat(getField("加油量(L)", row));
              const fuelCost = parseFloat(getField("金额(元)", row));
              const currentMileage = parseInt(getField("当前里程", row));

              if (!fuelAmount || !currentMileage || !fuelCost) {
                willError.push({
                  row: rowNum,
                  data: row,
                  status: "error",
                  message: "缺少必填字段（加油量、当前里程、金额）",
                });
                return;
              }

              willAdd.push({
                row: rowNum,
                data: {
                  plate,
                  fuelAmount,
                  fuelCost,
                  currentMileage,
                },
                status: "add",
              });
            } catch (e) {
              willError.push({
                row: rowNum,
                data: row,
                status: "error",
                message: e instanceof Error ? e.message : "解析失败",
              });
            }
          });
        } else if (entityType === "maintenance") {
          const getField = (name: string, row: string[]) =>
            row[headers.indexOf(name)]?.trim() || "";
          const vehicleMap: Record<string, string> = {};
          get().vehicles.forEach((v) => {
            vehicleMap[v.plateNumber] = v.id;
          });
          dataRows.forEach((row, idx) => {
            const rowNum = idx + 2;
            try {
              const plate = getField("车牌号", row);
              const vehicleId = vehicleMap[plate];
              if (!vehicleId) {
                willError.push({
                  row: rowNum,
                  data: row,
                  status: "error",
                  message: `找不到车牌号 ${plate}`,
                });
                return;
              }
              const description = getField("故障描述", row);
              if (!description) {
                willError.push({
                  row: rowNum,
                  data: row,
                  status: "error",
                  message: "缺少必填字段（故障描述）",
                });
                return;
              }
              willAdd.push({
                row: rowNum,
                data: {
                  plate,
                  description,
                  type: getField("维修类型", row),
                },
                status: "add",
              });
            } catch (e) {
              willError.push({
                row: rowNum,
                data: row,
                status: "error",
                message: e instanceof Error ? e.message : "解析失败",
              });
            }
          });
        }

        return { willAdd, willSkip, willError, total };
      },

      detectAnomalies: () => {
        const { vehicles, fuelRecords, maintenanceRecords, maintenanceRules, anomalyRecords } = get();
        const newAnomalies: AnomalyRecord[] = [];
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        const existingKeys = new Set(anomalyRecords.map(a => `${a.vehicleId}-${a.type}-${a.relatedRecordId || "none"}`));

        vehicles.forEach((vehicle) => {
          const rule = maintenanceRules.find(r => r.vehicleId === vehicle.id && r.enabled);
          if (rule) {
            const { remaining, level } = calcRemainingKm(
              vehicle.currentMileage,
              rule.lastMaintenanceKm,
              rule.intervalKm,
              rule.warningThreshold
            );

            if (remaining < -rule.intervalKm) {
              const key = `${vehicle.id}-maintenance_super_overdue-none`;
              if (!existingKeys.has(key)) {
                newAnomalies.push({
                  id: genId(),
                  vehicleId: vehicle.id,
                  plateNumber: vehicle.plateNumber,
                  type: "maintenance_super_overdue",
                  title: "严重超期未保养",
                  description: `已超期 ${Math.abs(remaining).toLocaleString()} km，建议立即安排保养，避免车辆损坏`,
                  severity: "high",
                  status: "pending",
                  detectedAt: now.toISOString(),
                  value: Math.abs(remaining),
                  threshold: rule.intervalKm,
                });
              }
            } else if (level === "danger") {
              const key = `${vehicle.id}-maintenance_overdue_km-none`;
              if (!existingKeys.has(key)) {
                newAnomalies.push({
                  id: genId(),
                  vehicleId: vehicle.id,
                  plateNumber: vehicle.plateNumber,
                  type: "maintenance_overdue_km",
                  title: "保养里程超期",
                  description: `剩余保养里程不足 ${rule.warningThreshold / 2} km，当前 ${remaining.toLocaleString()} km`,
                  severity: "high",
                  status: "pending",
                  detectedAt: now.toISOString(),
                  value: remaining,
                  threshold: rule.warningThreshold / 2,
                });
              }
            }
          }

          const vFuelRecords = fuelRecords.filter(r => r.vehicleId === vehicle.id);
          if (vFuelRecords.length >= 3) {
            const recentRecords = vFuelRecords
              .filter(r => r.fuelConsumption !== null)
              .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime())
              .slice(0, 6);

            if (recentRecords.length >= 3) {
              const consumptions = recentRecords.map(r => r.fuelConsumption!).filter(Boolean);
              if (consumptions.length >= 3) {
                const avg = consumptions.reduce((s, n) => s + n, 0) / consumptions.length;
                const latest = consumptions[0];
                const threshold = avg * 1.3;

                if (latest > threshold && latest > 0) {
                  const key = `${vehicle.id}-fuel_high-${recentRecords[0].id}`;
                  if (!existingKeys.has(key)) {
                    newAnomalies.push({
                      id: genId(),
                      vehicleId: vehicle.id,
                      plateNumber: vehicle.plateNumber,
                      type: "fuel_high",
                      title: "油耗突然偏高",
                      description: `本次油耗 ${latest.toFixed(2)} L/100km，超过近期均值 ${avg.toFixed(2)} 的 30%`,
                      relatedRecordId: recentRecords[0].id,
                      relatedRecordType: "fuel",
                      severity: "medium",
                      status: "pending",
                      detectedAt: now.toISOString(),
                      value: latest,
                      threshold: +threshold.toFixed(2),
                    });
                  }
                }
              }
            }
          }

          const pendingMaintenance = maintenanceRecords.filter(
            r => r.vehicleId === vehicle.id && (r.status === "pending_approval" || r.status === "pending")
          );
          pendingMaintenance.forEach((record) => {
            const applyDate = new Date(record.applyDate);
            const daysDiff = Math.floor((now.getTime() - applyDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysDiff > 7) {
              const key = `${vehicle.id}-maintenance_overdue-${record.id}`;
              if (!existingKeys.has(key)) {
                newAnomalies.push({
                  id: genId(),
                  vehicleId: vehicle.id,
                  plateNumber: vehicle.plateNumber,
                  type: "maintenance_overdue",
                  title: "维修申请超期未处理",
                  description: `${record.status === "pending_approval" ? "审批" : "维修"}已超期 ${daysDiff} 天，请及时处理`,
                  relatedRecordId: record.id,
                  relatedRecordType: "maintenance",
                  severity: daysDiff > 14 ? "high" : "medium",
                  status: "pending",
                  detectedAt: now.toISOString(),
                  value: daysDiff,
                  threshold: 7,
                });
              }
            }
          });

          const completedMaintenance = maintenanceRecords.filter(
            r => r.vehicleId === vehicle.id && r.status === "completed"
          );
          if (completedMaintenance.length > 0) {
            const costs = completedMaintenance.map(r => r.cost).filter(c => c > 0);
            if (costs.length >= 3) {
              const avgCost = costs.reduce((s, n) => s + n, 0) / costs.length;
              const latest = completedMaintenance.sort((a, b) =>
                new Date(b.finishDate).getTime() - new Date(a.finishDate).getTime()
              )[0];

              if (latest && latest.cost > avgCost * 1.5 && latest.cost > 0) {
                const key = `${vehicle.id}-maintenance_high_cost-${latest.id}`;
                if (!existingKeys.has(key)) {
                  newAnomalies.push({
                    id: genId(),
                    vehicleId: vehicle.id,
                    plateNumber: vehicle.plateNumber,
                    type: "maintenance_high_cost",
                    title: "维修费用偏高",
                    description: `本次维修费用 ¥${latest.cost.toLocaleString()}，超过历史均值 ¥${avgCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} 的 50%`,
                    relatedRecordId: latest.id,
                    relatedRecordType: "maintenance",
                    severity: "medium",
                    status: "pending",
                    detectedAt: now.toISOString(),
                    value: latest.cost,
                    threshold: +(avgCost * 1.5).toFixed(0),
                  });
                }
              }
            }
          }

          vFuelRecords.forEach((record, index) => {
            if (index === 0) return;
            const prev = vFuelRecords[index - 1];
            const dateDiff = new Date(record.fuelDate).getTime() - new Date(prev.fuelDate).getTime();
            if (dateDiff > 0) return;

            if (record.currentMileage <= prev.currentMileage && dateDiff >= 0) {
              const key = `${vehicle.id}-fuel_mileage-${record.id}`;
              if (!existingKeys.has(key)) {
                newAnomalies.push({
                  id: genId(),
                  vehicleId: vehicle.id,
                  plateNumber: vehicle.plateNumber,
                  type: "fuel_mileage",
                  title: "加油里程异常",
                  description: `本次里程 ${record.currentMileage.toLocaleString()} km 不大于上次 ${prev.currentMileage.toLocaleString()} km`,
                  relatedRecordId: record.id,
                  relatedRecordType: "fuel",
                  severity: "low",
                  status: "pending",
                  detectedAt: now.toISOString(),
                  value: record.currentMileage,
                  threshold: prev.currentMileage,
                });
              }
            }
          });
        });

        if (newAnomalies.length > 0) {
          set((s) => ({ anomalyRecords: [...newAnomalies, ...s.anomalyRecords] }));
        }

        return [...newAnomalies, ...anomalyRecords];
      },

      getAnomalies: (filters) => {
        const { anomalyRecords } = get();
        let records = [...anomalyRecords];

        if (filters?.vehicleId) {
          records = records.filter(r => r.vehicleId === filters.vehicleId);
        }
        if (filters?.status) {
          records = records.filter(r => r.status === filters.status);
        }
        if (filters?.type) {
          records = records.filter(r => r.type === filters.type);
        }

        const statusOrder: Record<string, number> = { pending: 0, handling: 1, resolved: 2 };
        const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

        return records.sort((a, b) => {
          const sa = statusOrder[a.status] ?? 99;
          const sb = statusOrder[b.status] ?? 99;
          if (sa !== sb) return sa - sb;

          const sva = severityOrder[a.severity] ?? 99;
          const svb = severityOrder[b.severity] ?? 99;
          if (sva !== svb) return sva - svb;

          return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
        });
      },

      handleAnomaly: (id, status, note, operator = "系统管理员") => {
        set((s) => ({
          anomalyRecords: s.anomalyRecords.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  handleNote: note || r.handleNote,
                  handledAt: status === "resolved" ? new Date().toISOString() : r.handledAt,
                  handledBy: operator,
                }
              : r
          ),
        }));
      },

      approveMaintenanceWithRecord: (id, operator = "系统管理员", operatorRole = "管理人员") => {
        const approvalRecord: ApprovalRecord = {
          id: genId(),
          maintenanceId: id,
          action: "approve",
          operator,
          operatorRole,
          operatedAt: new Date().toISOString(),
        };

        set((s) => ({
          maintenanceRecords: s.maintenanceRecords.map((r) =>
            r.id === id && r.status === "pending_approval"
              ? {
                  ...r,
                  status: "pending",
                  approvedAt: new Date().toISOString(),
                  approvalRecords: [...(r.approvalRecords || []), approvalRecord],
                }
              : r
          ),
        }));
      },

      rejectMaintenanceWithRecord: (id, reason, operator = "系统管理员", operatorRole = "管理人员") => {
        const approvalRecord: ApprovalRecord = {
          id: genId(),
          maintenanceId: id,
          action: "reject",
          reason,
          operator,
          operatorRole,
          operatedAt: new Date().toISOString(),
        };

        set((s) => ({
          maintenanceRecords: s.maintenanceRecords.map((r) =>
            r.id === id && r.status === "pending_approval"
              ? {
                  ...r,
                  status: "rejected",
                  rejectReason: reason,
                  rejectedAt: new Date().toISOString(),
                  approvalRecords: [...(r.approvalRecords || []), approvalRecord],
                }
              : r
          ),
        }));
      },

      resubmitMaintenance: (id, updates) => {
        const resubmitRecord: ApprovalRecord = {
          id: genId(),
          maintenanceId: id,
          action: "resubmit",
          operator: "司机",
          operatorRole: "司机",
          operatedAt: new Date().toISOString(),
          description: updates?.description,
          workshop: updates?.workshop,
        };

        set((s) => ({
          maintenanceRecords: s.maintenanceRecords.map((r) =>
            r.id === id && r.status === "rejected"
              ? {
                  ...r,
                  ...updates,
                  status: "pending_approval",
                  createdAt: new Date().toISOString(),
                  approvalRecords: [...(r.approvalRecords || []), resubmitRecord],
                }
              : r
          ),
        }));
      },

      getApprovalRecordsByMaintenance: (maintenanceId) => {
        const record = get().maintenanceRecords.find(r => r.id === maintenanceId);
        return record?.approvalRecords || [];
      },

      importFromCSVWithBatch: (entityType, csvText, fileName, operator = "系统管理员") => {
        const result = get().importFromCSV(entityType, csvText);

        let recordIds: string[] = [];
        if (entityType === "vehicle") {
          recordIds = get().vehicles.slice(-result.success).map(v => v.id);
        } else if (entityType === "fuel") {
          recordIds = get().fuelRecords.slice(-result.success).map(r => r.id);
        } else if (entityType === "maintenance") {
          recordIds = get().maintenanceRecords.slice(-result.success).map(r => r.id);
        }

        const batch: ImportBatch = {
          id: genId(),
          entityType,
          fileName,
          importedAt: new Date().toISOString(),
          importedBy: operator,
          result,
          recordIds,
          rolledBack: false,
        };

        set((s) => ({ importBatches: [batch, ...s.importBatches] }));

        return { batch, result };
      },

      rollbackImportBatch: (batchId, operator = "系统管理员") => {
        const batch = get().importBatches.find(b => b.id === batchId);
        if (!batch || batch.rolledBack) return false;

        if (batch.entityType === "vehicle") {
          set((s) => ({
            vehicles: s.vehicles.filter(v => !batch.recordIds.includes(v.id)),
            maintenanceRules: s.maintenanceRules.filter(r => !batch.recordIds.includes(r.vehicleId)),
            fuelRecords: s.fuelRecords.filter(r => !batch.recordIds.includes(r.vehicleId)),
            maintenanceRecords: s.maintenanceRecords.filter(r => !batch.recordIds.includes(r.vehicleId)),
            driverChangeRecords: s.driverChangeRecords.filter(r => !batch.recordIds.includes(r.vehicleId)),
            anomalyRecords: s.anomalyRecords.filter(a => !batch.recordIds.includes(a.vehicleId)),
          }));
        } else if (batch.entityType === "fuel") {
          const fuelRecordsToRemove = get().fuelRecords.filter(r => batch.recordIds.includes(r.id));
          const vehicleMileageUpdates: Record<string, number> = {};

          fuelRecordsToRemove.forEach((fr) => {
            const vehicleId = fr.vehicleId;
            if (!vehicleMileageUpdates[vehicleId]) {
              const vehicle = get().vehicles.find(v => v.id === vehicleId);
              if (vehicle) {
                vehicleMileageUpdates[vehicleId] = vehicle.currentMileage;
              }
            }
          });

          Object.keys(vehicleMileageUpdates).forEach((vehicleId) => {
            const remainingRecords = get().fuelRecords.filter(
              r => r.vehicleId === vehicleId && !batch.recordIds.includes(r.id)
            );
            const normalRecords = remainingRecords.filter(r => r.source === "normal");
            if (normalRecords.length > 0) {
              const maxMileage = Math.max(...normalRecords.map(r => r.currentMileage));
              vehicleMileageUpdates[vehicleId] = maxMileage;
            } else {
              const vehicle = get().vehicles.find(v => v.id === vehicleId);
              if (vehicle) {
                vehicleMileageUpdates[vehicleId] = vehicle.initialMileage;
              }
            }
          });

          set((s) => ({
            fuelRecords: s.fuelRecords.filter(r => !batch.recordIds.includes(r.id)),
            vehicles: s.vehicles.map(v =>
              vehicleMileageUpdates[v.id] !== undefined
                ? { ...v, currentMileage: vehicleMileageUpdates[v.id] }
                : v
            ),
          }));
        } else if (batch.entityType === "maintenance") {
          set((s) => ({
            maintenanceRecords: s.maintenanceRecords.filter(r => !batch.recordIds.includes(r.id)),
          }));
        }

        set((s) => ({
          importBatches: s.importBatches.map(b =>
            b.id === batchId
              ? { ...b, rolledBack: true, rolledBackAt: new Date().toISOString() }
              : b
          ),
        }));

        return true;
      },

      getImportBatches: (entityType) => {
        const batches = get().importBatches;
        if (entityType) {
          return batches.filter(b => b.entityType === entityType);
        }
        return batches;
      },

      getVehicleAnomalyStats: (vehicleId, months = 3) => {
        const anomalies = get().anomalyRecords.filter(a => a.vehicleId === vehicleId);
        const monthList = lastNMonths(months);
        const filtered = anomalies.filter(a => monthList.some(m => a.detectedAt.startsWith(m)));

        const total = filtered.length;
        const pending = filtered.filter(a => a.status === "pending" || a.status === "handling").length;
        const resolved = filtered.filter(a => a.status === "resolved").length;
        const resolvedRate = total > 0 ? +(resolved / total).toFixed(2) : 1;

        return { total, pending, resolved, resolvedRate };
      },

      getVehicleAnomalyTrend: (vehicleId, months = 6) => {
        const anomalies = get().anomalyRecords.filter(a => a.vehicleId === vehicleId);
        const monthList = lastNMonths(months);

        return monthList.map((month) => {
          const monthAnomalies = anomalies.filter(a => a.detectedAt.startsWith(month));
          return {
            month,
            count: monthAnomalies.length,
            resolved: monthAnomalies.filter(a => a.status === "resolved").length,
          };
        });
      },

      getRiskTimeline: (vehicleId) => {
        const { anomalyRecords, maintenanceRecords, fuelRecords, vehicles, maintenanceRules } = get();
        const events: RiskTimelineEvent[] = [];

        anomalyRecords
          .filter(a => a.vehicleId === vehicleId)
          .forEach(anomaly => {
            events.push({
              id: `anomaly-detect-${anomaly.id}`,
              vehicleId,
              eventType: anomaly.type === "fuel_high" ? "fuel_high"
                : anomaly.type === "maintenance_overdue" ? "maintenance_overdue"
                : anomaly.type === "maintenance_high_cost" ? "maintenance_high_cost"
                : "anomaly_detected",
              title: anomaly.title,
              description: anomaly.description,
              occurredAt: anomaly.detectedAt,
              severity: anomaly.severity,
              relatedAnomalyId: anomaly.id,
              relatedRecordId: anomaly.relatedRecordId,
              relatedRecordType: anomaly.relatedRecordType,
            });

            if (anomaly.status === "resolved" && anomaly.handledAt) {
              events.push({
                id: `anomaly-handle-${anomaly.id}`,
                vehicleId,
                eventType: "anomaly_handled",
                title: `已处理：${anomaly.title}`,
                description: anomaly.handleNote || "异常已标记为已解决",
                occurredAt: anomaly.handledAt,
                severity: "low",
                relatedAnomalyId: anomaly.id,
                handler: anomaly.handledBy,
                handleNote: anomaly.handleNote,
              });
            }
          });

        maintenanceRecords
          .filter(r => r.vehicleId === vehicleId && r.approvalRecords && r.approvalRecords.length > 0)
          .forEach(record => {
            record.approvalRecords!.forEach(approval => {
              if (approval.action === "resubmit") {
                events.push({
                  id: `resubmit-${approval.id}`,
                  vehicleId,
                  eventType: "anomaly_detected",
                  title: "重新提交维修申请",
                  description: `司机重新提交了维修申请${approval.description ? `，描述：${approval.description}` : ""}`,
                  occurredAt: approval.operatedAt,
                  severity: "low",
                  relatedRecordId: record.id,
                  relatedRecordType: "maintenance",
                  handler: approval.operator,
                });
              }
            });
          });

        return events.sort((a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
        );
      },

      getVehicleRiskScores: (months = 3) => {
        const { vehicles, fuelRecords, maintenanceRecords, maintenanceRules, anomalyRecords } = get();
        const monthList = lastNMonths(months);

        return vehicles.map(vehicle => {
          const vFuel = fuelRecords.filter(r =>
            r.vehicleId === vehicle.id &&
            monthList.some(m => r.fuelDate.startsWith(m)) &&
            r.fuelConsumption !== null
          );

          const consumptions = vFuel.map(r => r.fuelConsumption!);
          let fuelFluctuation = 0;
          if (consumptions.length >= 3) {
            const avg = consumptions.reduce((s, n) => s + n, 0) / consumptions.length;
            const variance = consumptions.reduce((s, n) => s + Math.pow(n - avg, 2), 0) / consumptions.length;
            fuelFluctuation = avg > 0 ? +(Math.sqrt(variance) / avg * 100).toFixed(1) : 0;
          }

          const overdueMaintenance = maintenanceRecords.filter(r =>
            r.vehicleId === vehicle.id &&
            (r.status === "pending_approval" || r.status === "pending") &&
            monthList.some(m => r.applyDate.startsWith(m))
          ).length;

          const rule = maintenanceRules.find(r => r.vehicleId === vehicle.id && r.enabled);
          let upcomingMaintenance = 0;
          if (rule) {
            const { remaining } = calcRemainingKm(
              vehicle.currentMileage,
              rule.lastMaintenanceKm,
              rule.intervalKm,
              rule.warningThreshold
            );
            if (remaining < rule.warningThreshold) upcomingMaintenance = 1;
          }

          const vAnomalies = anomalyRecords.filter(a =>
            a.vehicleId === vehicle.id &&
            monthList.some(m => a.detectedAt.startsWith(m))
          );

          const totalAnomalyCount = vAnomalies.length;
          const unresolvedAnomalyCount = vAnomalies.filter(a => a.status !== "resolved").length;
          const resolvedCount = vAnomalies.filter(a => a.status === "resolved").length;
          const resolvedRate = totalAnomalyCount > 0 ? resolvedCount / totalAnomalyCount : 1;

          let riskScore = 0;
          riskScore += Math.min(fuelFluctuation, 30) * 0.5;
          riskScore += overdueMaintenance * 15;
          riskScore += upcomingMaintenance * 10;
          riskScore += unresolvedAnomalyCount * 10;
          riskScore += (1 - resolvedRate) * 15;
          riskScore = Math.min(Math.round(riskScore), 100);

          const riskLevel: "low" | "medium" | "high" =
            riskScore >= 60 ? "high" : riskScore >= 30 ? "medium" : "low";

          const trendData = monthList.map(month => {
            const monthAnomalies = anomalyRecords.filter(a =>
              a.vehicleId === vehicle.id && a.detectedAt.startsWith(month)
            );
            const monthFuel = fuelRecords.filter(r =>
              r.vehicleId === vehicle.id && r.fuelDate.startsWith(month) && r.fuelConsumption !== null
            );
            const monthOverdue = maintenanceRecords.filter(r =>
              r.vehicleId === vehicle.id &&
              (r.status === "pending_approval" || r.status === "pending") &&
              r.applyDate.startsWith(month)
            ).length;

            let monthScore = 0;
            monthScore += monthAnomalies.filter(a => a.status !== "resolved").length * 10;
            monthScore += monthOverdue * 15;
            if (monthFuel.length >= 2) {
              const vals = monthFuel.map(r => r.fuelConsumption!);
              const avg = vals.reduce((s, n) => s + n, 0) / vals.length;
              const variance = vals.reduce((s, n) => s + Math.pow(n - avg, 2), 0) / vals.length;
              const cv = avg > 0 ? Math.sqrt(variance) / avg * 100 : 0;
              monthScore += Math.min(cv, 30) * 0.5;
            }
            return { month, score: Math.min(Math.round(monthScore), 100) };
          });

          return {
            vehicleId: vehicle.id,
            plateNumber: vehicle.plateNumber,
            driverName: vehicle.driverName,
            currentMileage: vehicle.currentMileage,
            riskScore,
            riskLevel,
            fuelFluctuation,
            overdueMaintenanceCount: overdueMaintenance,
            upcomingMaintenanceCount: upcomingMaintenance,
            unresolvedAnomalyCount,
            totalAnomalyCount,
            resolvedRate: +resolvedRate.toFixed(2),
            trendData,
          };
        }).sort((a, b) => b.riskScore - a.riskScore);
      },
    }),
    {
      name: "fleet-management-store",
      partialize: (state) => ({
        vehicles: state.vehicles,
        fuelRecords: state.fuelRecords,
        maintenanceRecords: state.maintenanceRecords,
        maintenanceRules: state.maintenanceRules,
        driverChangeRecords: state.driverChangeRecords,
        anomalyRecords: state.anomalyRecords,
        importBatches: state.importBatches,
        filters: state.filters,
      }),
    }
  )
);
