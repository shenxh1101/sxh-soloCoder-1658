import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Vehicle,
  FuelRecord,
  MaintenanceRecord,
  MaintenanceRule,
  FuelRankItem,
  CostRankItem,
  MonthlyCost,
  MaintenanceAlert,
} from "@/types";
import {
  mockVehicles,
  mockFuelRecords,
  mockMaintenanceRecords,
  mockMaintenanceRules,
  currentMonth,
} from "@/data/mock";
import {
  calcFuelConsumption,
  calcRemainingKm,
  getMonthStr,
  isSameMonth,
  lastNMonths,
  avg,
  genId,
} from "@/utils/calculations";

interface AppState {
  vehicles: Vehicle[];
  fuelRecords: FuelRecord[];
  maintenanceRecords: MaintenanceRecord[];
  maintenanceRules: MaintenanceRule[];
  filters: {
    month: string;
    vehicleId: string | null;
  };
  setFilterMonth: (m: string) => void;
  setFilterVehicle: (id: string | null) => void;

  addVehicle: (v: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => void;
  updateVehicle: (id: string, patch: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicleById: (id: string) => Vehicle | undefined;

  addFuelRecord: (
    r: Omit<FuelRecord, "id" | "createdAt" | "fuelConsumption">
  ) => { fuelConsumption: number | null };
  getFuelRecordsByVehicle: (vehicleId: string) => FuelRecord[];

  addMaintenanceRecord: (r: Omit<MaintenanceRecord, "id" | "createdAt">) => void;
  completeMaintenance: (
    id: string,
    finish: { finishDate: string; cost: number; mileageAfter: number }
  ) => void;
  getMaintenanceRecordsByVehicle: (vehicleId: string) => MaintenanceRecord[];

  getMonthlyFuelRank: (month: string) => FuelRankItem[];
  getMonthlyCostRank: (month: string) => CostRankItem[];
  getMonthlyTotalCost: (month: string) => MonthlyCost;
  getLast6MonthsCost: () => Array<{ month: string; fuel: number; maintenance: number; total: number }>;

  getMaintenanceAlerts: () => MaintenanceAlert[];
  updateMaintenanceRule: (vehicleId: string, patch: Partial<MaintenanceRule>) => void;
  markMaintenanceDone: (vehicleId: string, atKm: number) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      vehicles: mockVehicles,
      fuelRecords: mockFuelRecords,
      maintenanceRecords: mockMaintenanceRecords,
      maintenanceRules: mockMaintenanceRules,
      filters: { month: currentMonth, vehicleId: null },

      setFilterMonth: (m) => set({ filters: { ...get().filters, month: m } }),
      setFilterVehicle: (id) => set({ filters: { ...get().filters, vehicleId: id } }),

      addVehicle: (v) => {
        const now = new Date().toISOString();
        set({
          vehicles: [
            ...get().vehicles,
            { ...v, id: genId(), createdAt: now, updatedAt: now },
          ],
        });
      },
      updateVehicle: (id, patch) => {
        set({
          vehicles: get().vehicles.map((v) =>
            v.id === id ? { ...v, ...patch, updatedAt: new Date().toISOString() } : v
          ),
        });
      },
      deleteVehicle: (id) => {
        set({
          vehicles: get().vehicles.filter((v) => v.id !== id),
          fuelRecords: get().fuelRecords.filter((r) => r.vehicleId !== id),
          maintenanceRecords: get().maintenanceRecords.filter((r) => r.vehicleId !== id),
          maintenanceRules: get().maintenanceRules.filter((r) => r.vehicleId !== id),
        });
      },
      getVehicleById: (id) => get().vehicles.find((v) => v.id === id),

      addFuelRecord: (r) => {
        const state = get();
        const vehicleRecords = state.fuelRecords
          .filter((x) => x.vehicleId === r.vehicleId && x.fuelDate < r.fuelDate)
          .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime());
        const lastMileage = vehicleRecords[0]?.currentMileage;
        const vehicle = state.vehicles.find((v) => v.id === r.vehicleId);
        const baseMileage = lastMileage ?? vehicle?.initialMileage ?? 0;
        const consump = calcFuelConsumption(r.currentMileage, baseMileage, r.fuelAmount);
        set({
          fuelRecords: [
            ...state.fuelRecords,
            {
              ...r,
              id: genId(),
              fuelConsumption: consump,
              createdAt: new Date().toISOString(),
            },
          ],
          vehicles: state.vehicles.map((v) =>
            v.id === r.vehicleId && r.currentMileage > v.currentMileage
              ? { ...v, currentMileage: r.currentMileage, updatedAt: new Date().toISOString() }
              : v
          ),
        });
        return { fuelConsumption: consump };
      },
      getFuelRecordsByVehicle: (vehicleId) =>
        get()
          .fuelRecords.filter((r) => r.vehicleId === vehicleId)
          .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime()),

      addMaintenanceRecord: (r) => {
        const state = get();
        set({
          maintenanceRecords: [
            ...state.maintenanceRecords,
            { ...r, id: genId(), createdAt: new Date().toISOString() },
          ],
        });
      },
      completeMaintenance: (id, finish) => {
        const state = get();
        const rec = state.maintenanceRecords.find((r) => r.id === id);
        if (!rec) return;
        set({
          maintenanceRecords: state.maintenanceRecords.map((r) =>
            r.id === id ? { ...r, ...finish, status: "completed" } : r
          ),
          vehicles: state.vehicles.map((v) =>
            v.id === rec.vehicleId && finish.mileageAfter > v.currentMileage
              ? { ...v, currentMileage: finish.mileageAfter, updatedAt: new Date().toISOString() }
              : v
          ),
        });
      },
      getMaintenanceRecordsByVehicle: (vehicleId) =>
        get()
          .maintenanceRecords.filter((r) => r.vehicleId === vehicleId)
          .sort((a, b) => {
            const da = a.finishDate || a.applyDate;
            const db = b.finishDate || b.applyDate;
            return new Date(db).getTime() - new Date(da).getTime();
          }),

      getMonthlyFuelRank: (month) => {
        const state = get();
        const items = state.vehicles.map((v) => {
          const recs = state.fuelRecords.filter(
            (r) => r.vehicleId === v.id && isSameMonth(r.fuelDate, month) && r.fuelConsumption !== null
          );
          return {
            plate: v.plateNumber,
            avgConsumption: avg(recs.map((r) => r.fuelConsumption!).filter(Boolean)),
            totalFuel: +recs.reduce((s, r) => s + r.fuelAmount, 0).toFixed(2),
            rank: 0,
          };
        })
          .filter((i) => i.totalFuel > 0)
          .sort((a, b) => a.avgConsumption - b.avgConsumption)
          .map((i, idx) => ({ ...i, rank: idx + 1 }));
        return items;
      },
      getMonthlyCostRank: (month) => {
        const state = get();
        const items = state.vehicles.map((v) => {
          const cost = state.maintenanceRecords
            .filter((r) => r.vehicleId === v.id && r.status === "completed" && isSameMonth(r.finishDate, month))
            .reduce((s, r) => s + r.cost, 0);
          return { plate: v.plateNumber, cost, rank: 0 };
        })
          .filter((i) => i.cost > 0)
          .sort((a, b) => b.cost - a.cost)
          .map((i, idx) => ({ ...i, rank: idx + 1 }));
        return items;
      },
      getMonthlyTotalCost: (month) => {
        const state = get();
        const fuel = state.fuelRecords
          .filter((r) => isSameMonth(r.fuelDate, month))
          .reduce((s, r) => s + r.fuelCost, 0);
        const maintenance = state.maintenanceRecords
          .filter((r) => r.status === "completed" && isSameMonth(r.finishDate, month))
          .reduce((s, r) => s + r.cost, 0);
        return { fuel: +fuel.toFixed(2), maintenance: +maintenance.toFixed(2), total: +(fuel + maintenance).toFixed(2) };
      },
      getLast6MonthsCost: () => {
        return lastNMonths(6).map((m) => {
          const c = get().getMonthlyTotalCost(m);
          return { month: m, ...c };
        });
      },
      getMaintenanceAlerts: () => {
        const state = get();
        const alerts: MaintenanceAlert[] = [];
        state.vehicles.forEach((v) => {
          const rule = state.maintenanceRules.find((r) => r.vehicleId === v.id);
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
        return alerts.sort((a, b) => a.remaining - b.remaining);
      },
      updateMaintenanceRule: (vehicleId, patch) => {
        const state = get();
        const existing = state.maintenanceRules.find((r) => r.vehicleId === vehicleId);
        if (existing) {
          set({
            maintenanceRules: state.maintenanceRules.map((r) =>
              r.vehicleId === vehicleId ? { ...r, ...patch } : r
            ),
          });
        } else {
          set({
            maintenanceRules: [
              ...state.maintenanceRules,
              { id: `rule-${genId()}`, vehicleId, intervalKm: 5000, lastMaintenanceKm: 0, warningThreshold: 1000, enabled: true, ...patch },
            ],
          });
        }
      },
      markMaintenanceDone: (vehicleId, atKm) => {
        const state = get();
        set({
          maintenanceRules: state.maintenanceRules.map((r) =>
            r.vehicleId === vehicleId ? { ...r, lastMaintenanceKm: atKm } : r
          ),
        });
      },
    }),
    {
      name: "fleet-management-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { getMonthStr, isSameMonth };
