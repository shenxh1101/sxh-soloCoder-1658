import { useMemo } from "react";
import { Fuel, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import { useStore } from "@/store";
import { formatKm, formatLiters, formatConsumption } from "@/utils/formatters";
import { calcFuelConsumption, getLastFuelRecordByVehicle } from "@/utils/calculations";
import { cn } from "@/lib/utils";

interface FuelPreviewProps {
  vehicleId: string;
  fuelAmount: number;
  currentMileage: number;
  fuelDate?: string;
}

/**
 * 油耗实时预览卡组件
 * - 读取上次加油记录计算百公里油耗
 * - 首次加油时显示提示信息
 */
export default function FuelPreview({
  vehicleId,
  fuelAmount,
  currentMileage,
  fuelDate,
}: FuelPreviewProps) {
  const { fuelRecords, getVehicleById } = useStore();

  const vehicle = getVehicleById(vehicleId);

  // 计算预览数据
  const preview = useMemo(() => {
    if (!vehicleId) {
      return {
        isFirstFuel: false,
        lastMileage: null,
        currentMileage: null,
        distance: null,
        consumption: null,
        noVehicle: true,
      };
    }

    // 查找上次加油记录
    const lastRecord = getLastFuelRecordByVehicle(fuelRecords, vehicleId, fuelDate);
    const baseMileage = lastRecord?.currentMileage ?? vehicle?.initialMileage;

    const isFirstFuel = !lastRecord;

    // 如果缺少必要数据，返回空状态
    if (!currentMileage || !fuelAmount || !baseMileage) {
      return {
        isFirstFuel,
        lastMileage: baseMileage || null,
        currentMileage: currentMileage || null,
        distance: null,
        consumption: null,
        noVehicle: false,
      };
    }

    const distance = currentMileage - baseMileage;
    const consumption = calcFuelConsumption(
      currentMileage,
      baseMileage,
      fuelAmount
    );

    return {
      isFirstFuel,
      lastMileage: baseMileage,
      currentMileage,
      distance: distance > 0 ? distance : null,
      consumption,
      noVehicle: false,
    };
  }, [vehicleId, fuelAmount, currentMileage, fuelDate, fuelRecords, vehicle]);

  // 未选择车辆
  if (preview.noVehicle) {
    return (
      <div className="card p-6 rounded-[12px] h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center mb-4">
          <Fuel className="w-8 h-8 text-deep-300" />
        </div>
        <p className="text-deep-500 font-medium mb-1">请先选择车辆</p>
        <p className="text-sm text-deep-400">选择后将实时预览油耗数据</p>
      </div>
    );
  }

  // 首次加油提示
  if (preview.isFirstFuel && preview.distance === null) {
    return (
      <div className="card p-6 rounded-[12px] h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-fuel-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-fuel-500" />
        </div>
        <p className="text-deep-700 font-semibold mb-1">首次加油</p>
        <p className="text-sm text-deep-500 max-w-xs">
          这是该车辆的首次加油记录，下次加油时将自动计算百公里油耗
        </p>
        <div className="mt-6 w-full p-4 rounded-xl bg-fuel-50/80 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-deep-500">当前里程</span>
            <span className="num text-sm font-semibold text-deep-700">
              {preview.currentMileage
                ? formatKm(preview.currentMileage)
                : "--"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-deep-500">本次加油</span>
            <span className="num text-sm font-semibold text-fuel-600">
              {fuelAmount ? formatLiters(fuelAmount) : "--"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 油耗数据展示
  return (
    <div className="card p-6 rounded-[12px] h-full">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-fuel-50 flex items-center justify-center">
          <TrendingUp className="w-4.5 h-4.5 text-fuel-500" />
        </div>
        <div>
          <h3 className="section-title !mb-0">油耗实时预览</h3>
          {vehicle && (
            <p className="text-xs text-deep-400 mt-0.5 tracking-wider">
              {vehicle.plateNumber}
            </p>
          )}
        </div>
      </div>

      {/* 百公里油耗大数字 */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-fuel-500 to-fuel-600 text-white mb-5">
        <p className="text-sm text-white/70 mb-1">预计百公里油耗</p>
        <p className="num text-4xl font-bold">
          {preview.consumption !== null && preview.consumption !== undefined
            ? `${preview.consumption.toFixed(2)}`
            : "--"}
          <span className="text-lg font-normal ml-1 text-white/80">
            L/100km
          </span>
        </p>
      </div>

      {/* 详细数据 */}
      <div className="space-y-3">
        {/* 上次里程 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-deep-50/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-deep-400" />
            <span className="text-sm text-deep-500">上次里程</span>
          </div>
          <span className="num text-sm font-semibold text-deep-700">
            {preview.lastMileage ? formatKm(preview.lastMileage) : "--"}
          </span>
        </div>

        {/* 本次里程 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-deep-50/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-deep-500">本次里程</span>
          </div>
          <span className="num text-sm font-semibold text-orange-600">
            {preview.currentMileage
              ? formatKm(preview.currentMileage)
              : "--"}
          </span>
        </div>

        {/* 行驶距离 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50/60">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-deep-600">行驶距离</span>
          </div>
          <span className="num text-sm font-semibold text-orange-600">
            {preview.distance ? formatKm(preview.distance) : "--"}
          </span>
        </div>

        {/* 本次加油量 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-fuel-50/60">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-fuel-500" />
            <span className="text-sm text-deep-600">本次加油</span>
          </div>
          <span className="num text-sm font-semibold text-fuel-600">
            {fuelAmount ? formatLiters(fuelAmount) : "--"}
          </span>
        </div>
      </div>

      {/* 提示信息 */}
      {preview.consumption === null && preview.distance && (
        <div
          className={cn(
            "mt-4 p-3 rounded-lg flex items-start gap-2",
            "bg-alert-yellow/10"
          )}
        >
          <AlertCircle className="w-4 h-4 text-alert-yellow shrink-0 mt-0.5" />
          <p className="text-xs text-deep-600">
            里程未增加或数据异常，无法计算油耗
          </p>
        </div>
      )}

      {preview.isFirstFuel && (
        <div className="mt-4 p-3 rounded-lg flex items-start gap-2 bg-fuel-50">
          <AlertCircle className="w-4 h-4 text-fuel-500 shrink-0 mt-0.5" />
          <p className="text-xs text-deep-600">
            首次加油无对比数据，下次加油可正常计算
          </p>
        </div>
      )}
    </div>
  );
}
