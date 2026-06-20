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

export function maintenanceStatusLabel(status: "pending_approval" | "rejected" | "pending" | "completed"): string {
  const map = {
    pending_approval: "待审批",
    rejected: "已驳回",
    pending: "待处理",
    completed: "已完成",
  };
  return map[status] || status;
}

export function monthLabel(monthStr: string): string {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return `${y}年${+m}月`;
}

export function anomalyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    fuel_high: "油耗偏高",
    fuel_mileage: "加油里程异常",
    maintenance_overdue: "维修超期(时间)",
    maintenance_overdue_km: "保养超期(里程)",
    maintenance_super_overdue: "严重超期未保养",
    maintenance_high_cost: "维修费用偏高",
  };
  return map[type] || type;
}

export function anomalyStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "待处理",
    handling: "处理中",
    resolved: "已解决",
  };
  return map[status] || status;
}

export function anomalySeverityLabel(severity: string): string {
  const map: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
  };
  return map[severity] || severity;
}

export function approvalActionLabel(action: string): string {
  const map: Record<string, string> = {
    approve: "通过",
    reject: "驳回",
  };
  return map[action] || action;
}

export function importEntityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    vehicle: "车辆档案",
    fuel: "加油记录",
    maintenance: "维修记录",
  };
  return map[type] || type;
}
