export function formatCurrency(amount: number, digits = 0): string {
  if (!isFinite(amount)) return "¥0";
  return `¥${amount.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function formatNumber(n: number, digits = 0): string {
  if (!isFinite(n)) return "0";
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatKm(km: number): string {
  return `${formatNumber(km)} km`;
}

export function formatLiters(l: number): string {
  return `${formatNumber(l, 2)} L`;
}

export function formatConsumption(c: number | null): string {
  if (c === null || c === undefined || !isFinite(c)) return "-- L/100km";
  return `${c.toFixed(2)} L/100km`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "--";
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function maintenanceTypeLabel(type: "routine" | "fault" | "overhaul"): string {
  const map = { routine: "常规保养", fault: "故障维修", overhaul: "大修" };
  return map[type] || type;
}

export function maintenanceStatusLabel(status: "pending" | "completed"): string {
  return status === "pending" ? "待处理" : "已完成";
}

export function monthLabel(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return `${y}年${+m}月`;
}
