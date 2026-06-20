import type { AlertLevel } from "@/types";

export function calcFuelConsumption(
  currentMileage: number,
  lastMileage: number,
  fuelAmount: number
): number | null {
  if (!lastMileage || currentMileage <= lastMileage) return null;
  const distance = currentMileage - lastMileage;
  if (distance <= 0 || fuelAmount <= 0) return null;
  return +((fuelAmount / distance) * 100).toFixed(2);
}

export function calcRemainingKm(
  currentMileage: number,
  lastMaintenanceKm: number,
  intervalKm: number,
  warningThreshold = 1000
): { remaining: number; nextKm: number; level: AlertLevel } {
  const nextKm = lastMaintenanceKm + intervalKm;
  const remaining = nextKm - currentMileage;
  let level: AlertLevel = "safe";
  if (remaining <= warningThreshold / 2) level = "danger";
  else if (remaining <= warningThreshold) level = "warning";
  return { remaining, nextKm, level };
}

export function getLastFuelRecordByVehicle<T extends { vehicleId: string; currentMileage: number; fuelDate: string; createdAt?: string }>(
  records: T[],
  vehicleId: string,
  beforeDate?: string,
  beforeCreatedAt?: string
): T | null {
  const filtered = records
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

export function calcEstimatedMaintenanceDate(
  currentMileage: number,
  lastMaintenanceKm: number,
  intervalKm: number,
  avgDailyKm: number = 200
): { estimatedDate: string; estimatedDays: number } {
  const nextKm = lastMaintenanceKm + intervalKm;
  const remaining = Math.max(0, nextKm - currentMileage);
  const estimatedDays = avgDailyKm > 0 ? Math.ceil(remaining / avgDailyKm) : 30;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + estimatedDays);
  return {
    estimatedDate: estimatedDate.toISOString().split("T")[0],
    estimatedDays,
  };
}

export function getNext30Days(): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

export function formatYMD(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getMonthStr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function isSameMonth(dateStr: string, monthStr: string): boolean {
  return dateStr.startsWith(monthStr);
}

export function lastNMonths(n: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(getMonthStr(d));
  }
  return result;
}

export function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return +(arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(2);
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
