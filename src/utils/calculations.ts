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

export function getLastFuelRecordByVehicle<T extends { vehicleId: string; currentMileage: number; fuelDate: string }>(
  records: T[],
  vehicleId: string,
  beforeDate?: string
): T | null {
  const filtered = records
    .filter((r) => r.vehicleId === vehicleId && (!beforeDate || r.fuelDate < beforeDate))
    .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime());
  return filtered[0] || null;
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
