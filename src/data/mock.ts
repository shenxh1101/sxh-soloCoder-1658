import type { Vehicle, FuelRecord, MaintenanceRecord, MaintenanceRule } from "@/types";
import { formatYMD, getMonthStr, calcFuelConsumption, genId } from "@/utils/calculations";

const now = new Date();
const monthsAgo = (m: number, day = 15) => {
  const d = new Date(now.getFullYear(), now.getMonth() - m, day);
  return formatYMD(d);
};

const vehicles: Vehicle[] = [
  {
    id: "v1",
    plateNumber: "京A·88888",
    model: "东风天龙 KL 重型货车",
    initialMileage: 85000,
    currentMileage: 142300,
    driverName: "张建国",
    driverPhone: "13800138001",
    purchaseDate: "2022-03-15",
    notes: "主要跑京津冀线路",
    createdAt: monthsAgo(8, 1),
    updatedAt: monthsAgo(0, 10),
  },
  {
    id: "v2",
    plateNumber: "京B·66666",
    model: "解放 J6P 牵引车",
    initialMileage: 120000,
    currentMileage: 178500,
    driverName: "李卫东",
    driverPhone: "13800138002",
    purchaseDate: "2021-08-20",
    notes: "",
    createdAt: monthsAgo(8, 2),
    updatedAt: monthsAgo(0, 12),
  },
  {
    id: "v3",
    plateNumber: "京C·12345",
    model: "福田欧曼 EST",
    initialMileage: 45000,
    currentMileage: 98600,
    driverName: "王志强",
    driverPhone: "13800138003",
    purchaseDate: "2023-01-10",
    notes: "新车，性能良好",
    createdAt: monthsAgo(8, 3),
    updatedAt: monthsAgo(0, 11),
  },
  {
    id: "v4",
    plateNumber: "京D·55555",
    model: "重汽豪沃 TH7",
    initialMileage: 160000,
    currentMileage: 223400,
    driverName: "赵德海",
    driverPhone: "13800138004",
    purchaseDate: "2020-11-05",
    notes: "老车，需注意保养",
    createdAt: monthsAgo(8, 4),
    updatedAt: monthsAgo(0, 9),
  },
  {
    id: "v5",
    plateNumber: "京E·77777",
    model: "陕汽德龙 X6000",
    initialMileage: 30000,
    currentMileage: 76800,
    driverName: "刘德胜",
    driverPhone: "13800138005",
    purchaseDate: "2023-05-18",
    notes: "",
    createdAt: monthsAgo(8, 5),
    updatedAt: monthsAgo(0, 13),
  },
  {
    id: "v6",
    plateNumber: "京F·33333",
    model: "江淮格尔发 K7",
    initialMileage: 95000,
    currentMileage: 155200,
    driverName: "孙明辉",
    driverPhone: "13800138006",
    purchaseDate: "2022-07-22",
    notes: "冷藏运输专用",
    createdAt: monthsAgo(8, 6),
    updatedAt: monthsAgo(0, 8),
  },
];

const gasStations = ["中石化朝阳站", "中石油海淀站", "壳牌大兴站", "中石化通州站", "中石油丰台站"];

function buildFuelRecords(): FuelRecord[] {
  const records: FuelRecord[] = [];
  vehicles.forEach((v) => {
    let mileage = v.initialMileage;
    for (let m = 7; m >= 0; m--) {
      const fillsThisMonth = 3 + Math.floor(Math.random() * 2);
      for (let f = 0; f < fillsThisMonth; f++) {
        const day = Math.floor(5 + (f * 8) + Math.random() * 3);
        const dist = 450 + Math.floor(Math.random() * 550);
        const fuelAmount = +(28 + Math.random() * 12).toFixed(2);
        const pricePerLiter = +(7.5 + Math.random() * 0.8).toFixed(2);
        const newMileage = mileage + dist;
        const lastRecord = records
          .filter((r) => r.vehicleId === v.id)
          .sort((a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime())[0];
        const consump = calcFuelConsumption(
          newMileage,
          lastRecord ? lastRecord.currentMileage : v.initialMileage,
          fuelAmount
        );
        records.push({
          id: genId(),
          vehicleId: v.id,
          fuelAmount,
          fuelCost: +(fuelAmount * pricePerLiter).toFixed(2),
          pricePerLiter,
          currentMileage: newMileage,
          fuelConsumption: consump,
          gasStation: gasStations[Math.floor(Math.random() * gasStations.length)],
          fuelDate: monthsAgo(m, Math.min(day, 28)),
          source: "normal",
          notes: "",
          createdAt: monthsAgo(m, Math.min(day, 28)),
        });
        mileage = newMileage;
      }
    }
  });
  return records;
}

function buildMaintenanceRecords(): MaintenanceRecord[] {
  const records: MaintenanceRecord[] = [];
  const types: ("routine" | "fault" | "overhaul")[] = ["routine", "routine", "fault", "routine", "overhaul", "fault"];
  const workshops = ["通达汽修厂", "顺达维修中心", "鑫源4S店", "华胜重卡维修", "鸿运汽车服务"];
  const descs = [
    "更换机油机滤",
    "更换刹车片",
    "轮胎更换四条",
    "发动机故障排查",
    "变速箱保养",
    "空调系统检修",
    "更换离合器片",
    "大保养全车检查",
    "刹车系统维护",
    "更换电瓶",
  ];
  vehicles.forEach((v, idx) => {
    for (let m = 6; m >= 0; m--) {
      if (Math.random() > 0.55) continue;
      const type = types[(m + idx) % types.length];
      const day = 5 + Math.floor(Math.random() * 20);
      const cost = type === "routine" ? 600 + Math.floor(Math.random() * 1000)
        : type === "fault" ? 1500 + Math.floor(Math.random() * 3500)
        : 5000 + Math.floor(Math.random() * 8000);
      const mileage = Math.floor(v.currentMileage - (m * 4000 + Math.random() * 2000));
      records.push({
        id: genId(),
        vehicleId: v.id,
        type,
        description: descs[Math.floor(Math.random() * descs.length)],
        workshop: workshops[Math.floor(Math.random() * workshops.length)],
        cost,
        mileageAfter: mileage,
        applyDate: monthsAgo(m, Math.max(1, day - 1)),
        finishDate: monthsAgo(m, day),
        status: "completed",
        notes: "",
        createdAt: monthsAgo(m, Math.max(1, day - 1)),
      });
    }
  });
  records.push({
    id: genId(),
    vehicleId: "v1",
    type: "fault",
    description: "排气管异响，怀疑消音器故障",
    workshop: "通达汽修厂",
    cost: 0,
    mileageAfter: 0,
    applyDate: monthsAgo(0, 18),
    finishDate: "",
    status: "pending_approval",
    notes: "等待配件",
    createdAt: monthsAgo(0, 18),
  });
  records.push({
    id: genId(),
    vehicleId: "v4",
    type: "routine",
    description: "定期保养 - 10万公里大保",
    workshop: "华胜重卡维修",
    cost: 0,
    mileageAfter: 0,
    applyDate: monthsAgo(0, 19),
    finishDate: "",
    status: "pending_approval",
    notes: "",
    createdAt: monthsAgo(0, 19),
  });
  records.push({
    id: genId(),
    vehicleId: "v2",
    type: "fault",
    description: "离合器打滑，需要更换",
    workshop: "通达汽修厂",
    cost: 0,
    mileageAfter: 0,
    applyDate: monthsAgo(0, 15),
    finishDate: "",
    status: "rejected",
    rejectReason: "请先检查是否为拉线松动，无需立即更换离合器片",
    rejectedAt: monthsAgo(0, 14),
    notes: "",
    createdAt: monthsAgo(0, 15),
  });
  records.push({
    id: genId(),
    vehicleId: "v3",
    type: "routine",
    description: "5000公里常规保养",
    workshop: "华胜重卡维修",
    cost: 0,
    mileageAfter: 0,
    applyDate: monthsAgo(0, 10),
    finishDate: "",
    status: "pending",
    approvedAt: monthsAgo(0, 9),
    notes: "",
    createdAt: monthsAgo(0, 10),
  });
  return records;
}

function buildMaintenanceRules(): MaintenanceRule[] {
  return vehicles.map((v, i) => ({
    id: `rule-${v.id}`,
    vehicleId: v.id,
    intervalKm: 5000,
    lastMaintenanceKm:
      v.currentMileage -
      (i === 0 ? 4700 : i === 3 ? 4900 : i === 5 ? 5100 : 2500 + Math.floor(Math.random() * 1500)),
    warningThreshold: 1000,
    enabled: true,
  }));
}

export const mockVehicles: Vehicle[] = vehicles;
export const mockFuelRecords: FuelRecord[] = buildFuelRecords();
export const mockMaintenanceRecords: MaintenanceRecord[] = buildMaintenanceRecords();
export const mockMaintenanceRules: MaintenanceRule[] = buildMaintenanceRules();

export const currentMonth = getMonthStr(now);
