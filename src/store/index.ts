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
} from "@/types";
import {
  calcFuelConsumption,
  calcRemainingKm,
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
    beforeDate?: string
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
    r: Omit<FuelRecord, "id" | "fuelConsumption" | "createdAt" | "source">
  ) => FuelRecord;
  addMaintenanceRecord: (
    r: Omit<MaintenanceRecord, "id" | "createdAt">
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
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function getLastFuelRecordByVehicle(
  fuelRecords: FuelRecord[],
  vehicleId: string,
  beforeDate?: string
): FuelRecord | null {
  const records = fuelRecords.filter((r) => r.vehicleId === vehicleId);
  if (records.length === 0) return null;
  if (beforeDate) {
    const before = new Date(beforeDate).getTime();
    const sorted = records
      .filter((r) => new Date(r.fuelDate).getTime() < before)
      .sort((a, b) => {
        const ad = new Date(a.fuelDate).getTime();
        const bd = new Date(b.fuelDate).getTime();
        if (bd !== ad) return bd - ad;
        return b.currentMileage - a.currentMileage;
      });
    return sorted[0] || null;
  }
  const sorted = [...records].sort((a, b) => {
    const ad = new Date(a.fuelDate).getTime();
    const bd = new Date(b.fuelDate).getTime();
    if (bd !== ad) return bd - ad;
    return b.currentMileage - a.currentMileage;
  });
  return sorted[0] || null;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      vehicles: mockVehicles,
      fuelRecords: mockFuelRecords,
      maintenanceRecords: mockMaintenanceRecords,
      maintenanceRules: mockMaintenanceRules,
      driverChangeRecords: [],
      filters: {
        month: lastNMonths(1)[0],
      },
      selectedVehicles: [],

      getVehicleById: (id) => get().vehicles.find((v) => v.id === id),

      getFuelRecordsByVehicle: (vehicleId) =>
        get().fuelRecords.filter((r) => r.vehicleId === vehicleId),

      getMaintenanceRecordsByVehicle: (vehicleId) =>
        get().maintenanceRecords.filter((r) => r.vehicleId === vehicleId),

      getLastFuelRecordByVehicle: (
        fuelRecords,
        vehicleId,
        beforeDate
      ) => getLastFuelRecordByVehicle(fuelRecords, vehicleId, beforeDate),

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
        const last = getLastFuelRecordByVehicle(
          fuelRecords,
          r.vehicleId,
          r.fuelDate
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
          createdAt: new Date().toISOString(),
        };

        if (vehicle && r.currentMileage > vehicle.currentMileage) {
          updateVehicle(vehicle.id, { currentMileage: r.currentMileage });
        }

        set((s) => ({
          fuelRecords: [...s.fuelRecords, newRecord],
        }));
        return newRecord;
      },

      addFuelRecordBackfill: (r) => {
        const { fuelRecords, getVehicleById } = get();
        const last = getLastFuelRecordByVehicle(
          fuelRecords,
          r.vehicleId,
          r.fuelDate
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
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          fuelRecords: [...s.fuelRecords, newRecord],
        }));
        return newRecord;
      },

      addMaintenanceRecord: (r) => {
        const newRecord: MaintenanceRecord = {
          ...r,
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
              const last = getLastFuelRecordByVehicle(
                allRecords,
                vehicleId,
                fuelDate
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
    }),
    {
      name: "fleet-management-store",
      partialize: (state) => ({
        vehicles: state.vehicles,
        fuelRecords: state.fuelRecords,
        maintenanceRecords: state.maintenanceRecords,
        maintenanceRules: state.maintenanceRules,
        driverChangeRecords: state.driverChangeRecords,
        filters: state.filters,
      }),
    }
  )
);
