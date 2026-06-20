import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Fuel, DollarSign, Wrench, Truck } from "lucide-react";
import { useStore } from "@/store";
import VehicleInfo from "@/components/vehicle/VehicleInfo";
import FuelTrendChart from "@/components/charts/FuelTrendChart";
import MaintenanceTimeline from "@/components/maintenance/MaintenanceTimeline";
import KpiCard from "@/components/common/KpiCard";
import EmptyState from "@/components/common/EmptyState";
import {
  formatLiters,
  formatCurrency,
  formatKm,
  formatDate,
  formatConsumption,
  maintenanceTypeLabel,
  maintenanceStatusLabel,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { MaintenanceType, MaintenanceStatus } from "@/types";

/**
 * 单车详情页面
 * - 展示指定车辆的完整信息、累计统计、油耗趋势、维修历史
 * - 包含完整的加油记录和维修记录表格
 */
export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    getVehicleById,
    getFuelRecordsByVehicle,
    getMaintenanceRecordsByVehicle,
  } = useStore();

  const vehicle = id ? getVehicleById(id) : undefined;

  // 返回车辆列表
  const handleBack = () => {
    navigate("/vehicles");
  };

  // 加油记录
  const fuelRecords = useMemo(() => {
    return id ? getFuelRecordsByVehicle(id) : [];
  }, [id, getFuelRecordsByVehicle]);

  // 维修记录
  const maintenanceRecords = useMemo(() => {
    return id ? getMaintenanceRecordsByVehicle(id) : [];
  }, [id, getMaintenanceRecordsByVehicle]);

  // 累计统计数据
  const stats = useMemo(() => {
    const completedMaintenances = maintenanceRecords.filter(
      (r) => r.status === "completed"
    );
    const totalFuelAmount = fuelRecords.reduce(
      (s, r) => s + r.fuelAmount,
      0
    );
    const totalFuelCost = fuelRecords.reduce((s, r) => s + r.fuelCost, 0);
    const totalMaintenanceCost = completedMaintenances.reduce(
      (s, r) => s + r.cost,
      0
    );
    const maintenanceCount = completedMaintenances.length;
    return {
      totalFuelAmount,
      totalFuelCost,
      totalMaintenanceCost,
      maintenanceCount,
    };
  }, [fuelRecords, maintenanceRecords]);

  // 油耗趋势图数据
  const fuelTrendData = useMemo(() => {
    // 按日期升序排列用于图表
    return [...fuelRecords]
      .sort(
        (a, b) =>
          new Date(a.fuelDate).getTime() - new Date(b.fuelDate).getTime()
      )
      .map((r) => ({
        date: formatDate(r.fuelDate),
        consumption: r.fuelConsumption,
      }));
  }, [fuelRecords]);

  // 平均油耗
  const avgConsumption = useMemo(() => {
    const consumptions = fuelRecords
      .map((r) => r.fuelConsumption)
      .filter((c): c is number => c !== null && c !== undefined);
    if (consumptions.length === 0) return undefined;
    return consumptions.reduce((s, n) => s + n, 0) / consumptions.length;
  }, [fuelRecords]);

  // 维修类型配置
  const maintenanceTypeConfig: Record<
    MaintenanceType,
    { badge: string }
  > = {
    routine: {
      badge: "bg-fuel-50 text-fuel-600 border border-fuel-200",
    },
    fault: {
      badge: "bg-alert-red/10 text-alert-red border border-alert-red/20",
    },
    overhaul: {
      badge: "bg-repair-50 text-repair-600 border border-repair-200",
    },
  };

  // 维修状态配置
  const maintenanceStatusConfig: Record<
    MaintenanceStatus,
    { badge: string }
  > = {
    pending: {
      badge:
        "bg-alert-yellow/15 text-alert-yellow border border-alert-yellow/30",
    },
    completed: {
      badge: "bg-fuel-50 text-fuel-600 border border-fuel-200",
    },
  };

  if (!vehicle) {
    return (
      <div className="animate-fade-in">
        <button onClick={handleBack} className="btn-secondary mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回车辆列表
        </button>
        <EmptyState
          icon={Truck}
          title="未找到该车辆"
          description="该车辆可能已被删除或不存在，请返回列表查看"
          action={
            <button onClick={handleBack} className="btn-primary">
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 返回按钮和页面标题 */}
      <div className="space-y-4">
        <button onClick={handleBack} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          返回车辆列表
        </button>
        <div>
          <h1 className="text-3xl font-bold text-deep-700 tracking-wider">
            {vehicle.plateNumber}
          </h1>
          <p className="text-deep-500 mt-1">{vehicle.model}</p>
        </div>
      </div>

      {/* 第一行：VehicleInfo + 累计统计卡 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* VehicleInfo 占 1/3 */}
        <div className="xl:col-span-1">
          <VehicleInfo vehicleId={vehicle.id} />
        </div>

        {/* 累计统计卡 2x2 占 2/3 */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <KpiCard
            icon={Fuel}
            title="总加油量"
            value={formatLiters(stats.totalFuelAmount)}
            color="green"
          />
          <KpiCard
            icon={DollarSign}
            title="总油费"
            value={formatCurrency(stats.totalFuelCost, 0)}
            color="orange"
          />
          <KpiCard
            icon={Wrench}
            title="总维修费"
            value={formatCurrency(stats.totalMaintenanceCost, 0)}
            color="purple"
          />
          <KpiCard
            icon={Truck}
            title="维修次数"
            value={`${stats.maintenanceCount} 次`}
            color="blue"
          />
        </div>
      </div>

      {/* 第二行：油耗趋势图 + 维修时间线 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 百公里油耗趋势图 */}
        <div className="card p-6 rounded-[12px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              <div className="w-8 h-8 rounded-lg bg-fuel-50 flex items-center justify-center">
                <Fuel className="w-4 h-4 text-fuel-500" />
              </div>
              百公里油耗趋势
            </h3>
            <span className="text-xs text-deep-400">
              共 {fuelTrendData.length} 条记录
            </span>
          </div>
          {fuelTrendData.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center">
              <EmptyState
                icon={Fuel}
                title="暂无油耗数据"
                description="暂无加油记录，油耗趋势无法展示"
              />
            </div>
          ) : (
            <FuelTrendChart
              data={fuelTrendData}
              avgLine={avgConsumption}
            />
          )}
        </div>

        {/* 维修历史时间线 */}
        <div>
          <MaintenanceTimeline vehicleId={vehicle.id} />
        </div>
      </div>

      {/* 第三行：加油历史表格 + 维修记录表格 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 完整加油历史表格 */}
        <div className="card rounded-[12px] overflow-hidden">
          <div className="p-5 border-b border-deep-50/80">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                <div className="w-8 h-8 rounded-lg bg-fuel-50 flex items-center justify-center">
                  <Fuel className="w-4 h-4 text-fuel-500" />
                </div>
                加油历史
              </h3>
              <span className="text-xs text-deep-400">
                共 {fuelRecords.length} 条记录
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            {fuelRecords.length === 0 ? (
              <EmptyState
                icon={Fuel}
                title="暂无加油记录"
                description="该车辆还没有录入加油记录"
                className="py-12"
              />
            ) : (
              <table className="w-full">
                <thead className="bg-deep-50/40 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      日期
                    </th>
                    <th className="text-right text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      加油量
                    </th>
                    <th className="text-right text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      金额
                    </th>
                    <th className="text-right text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      单价
                    </th>
                    <th className="text-right text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      里程
                    </th>
                    <th className="text-right text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      油耗
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fuelRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="border-t border-deep-50/60 hover:bg-deep-50/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="text-sm text-deep-600">
                          {formatDate(record.fuelDate)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span className="num text-sm font-semibold text-fuel-600">
                          {formatLiters(record.fuelAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span className="num text-sm font-semibold text-orange-600">
                          {formatCurrency(record.fuelCost, 0)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span className="num text-sm text-deep-600">
                          ¥{record.pricePerLiter.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span className="num text-sm text-deep-600">
                          {formatKm(record.currentMileage)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right">
                        <span
                          className={cn(
                            "num text-sm font-medium",
                            record.fuelConsumption !== null
                              ? "text-deep-700"
                              : "text-deep-300"
                          )}
                        >
                          {formatConsumption(record.fuelConsumption)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 完整维修记录表格 */}
        <div className="card rounded-[12px] overflow-hidden">
          <div className="p-5 border-b border-deep-50/80">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                <div className="w-8 h-8 rounded-lg bg-repair-50 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-repair-500" />
                </div>
                维修记录
              </h3>
              <span className="text-xs text-deep-400">
                共 {maintenanceRecords.length} 条记录
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            {maintenanceRecords.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="暂无维修记录"
                description="该车辆还没有维修或保养记录"
                className="py-12"
              />
            ) : (
              <table className="w-full">
                <thead className="bg-deep-50/40 sticky top-0">
                  <tr>
                    <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      类型
                    </th>
                    <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      状态
                    </th>
                    <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      描述
                    </th>
                    <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      申请日期
                    </th>
                    <th className="text-right text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                      费用
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRecords.map((record) => {
                    const typeCfg = maintenanceTypeConfig[record.type];
                    const statusCfg =
                      maintenanceStatusConfig[record.status];
                    return (
                      <tr
                        key={record.id}
                        className="border-t border-deep-50/60 hover:bg-deep-50/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "badge border",
                              typeCfg.badge
                            )}
                          >
                            {maintenanceTypeLabel(record.type)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "badge border",
                              statusCfg.badge
                            )}
                          >
                            {maintenanceStatusLabel(record.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-deep-600 line-clamp-1 block max-w-[200px]">
                            {record.description}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm text-deep-500">
                            {formatDate(record.applyDate)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          {record.status === "completed" ? (
                            <span className="num text-sm font-semibold text-repair-600">
                              {formatCurrency(record.cost, 0)}
                            </span>
                          ) : (
                            <span className="text-sm text-deep-300">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
