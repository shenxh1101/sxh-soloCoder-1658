import type { Vehicle, FuelRecord, MaintenanceRecord, ImportResult } from "@/types";

export function exportVehiclesToCSV(vehicles: Vehicle[]): string {
  const headers = [
    "车牌号",
    "车型",
    "初始里程",
    "当前里程",
    "司机姓名",
    "司机电话",
    "购车日期",
    "备注",
  ];
  const rows = vehicles.map((v) =>
    [
      v.plateNumber,
      v.model,
      v.initialMileage,
      v.currentMileage,
      v.driverName,
      v.driverPhone,
      v.purchaseDate,
      v.notes || "",
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function exportFuelToCSV(
  records: FuelRecord[],
  vehicleMap: Record<string, string>
): string {
  const headers = [
    "车牌号",
    "加油日期",
    "加油量(L)",
    "金额(元)",
    "单价(元/L)",
    "当前里程",
    "百公里油耗(L)",
    "加油站",
    "来源",
    "备注",
  ];
  const rows = records.map((r) =>
    [
      vehicleMap[r.vehicleId] || r.vehicleId,
      r.fuelDate,
      r.fuelAmount,
      r.fuelCost,
      r.pricePerLiter,
      r.currentMileage,
      r.fuelConsumption?.toFixed(2) || "",
      r.gasStation,
      r.source === "backfill" ? "补录" : "正常",
      r.notes || "",
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function exportMaintenanceToCSV(
  records: MaintenanceRecord[],
  vehicleMap: Record<string, string>
): string {
  const headers = [
    "车牌号",
    "维修类型",
    "故障描述",
    "维修厂",
    "费用(元)",
    "维修后里程",
    "申请日期",
    "完成日期",
    "状态",
    "备注",
  ];
  const typeMap: Record<string, string> = {
    routine: "常规保养",
    fault: "故障维修",
    overhaul: "大修",
  };
  const statusMap: Record<string, string> = {
    pending: "待完成",
    completed: "已完成",
  };
  const rows = records.map((r) =>
    [
      vehicleMap[r.vehicleId] || r.vehicleId,
      typeMap[r.type] || r.type,
      r.description,
      r.workshop,
      r.cost,
      r.mileageAfter,
      r.applyDate,
      r.finishDate,
      statusMap[r.status] || r.status,
      r.notes || "",
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
        if (char === "\r" && next === "\n") i++;
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export function createEmptyImportResult(): ImportResult {
  return { success: 0, failed: 0, skipped: 0, errors: [], total: 0 };
}

export function validateVehicleRow(
  row: string[],
  headers: string[]
): Vehicle | null {
  const get = (name: string) => row[headers.indexOf(name)]?.trim() || "";
  const plate = get("车牌号");
  const model = get("车型");
  if (!plate || !model) return null;
  return {
    id: "",
    plateNumber: plate,
    model: model,
    initialMileage: parseFloat(get("初始里程")) || 0,
    currentMileage: parseFloat(get("当前里程")) || parseFloat(get("初始里程")) || 0,
    driverName: get("司机姓名") || "",
    driverPhone: get("司机电话") || "",
    purchaseDate: get("购车日期") || new Date().toISOString().split("T")[0],
    notes: get("备注"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
