import { useMemo } from "react";
import { Truck, Fuel, Wrench, Bell } from "lucide-react";
import { useStore } from "@/store";
import KpiCard from "@/components/common/KpiCard";
import CostTrendChart from "@/components/charts/CostTrendChart";
import {
  formatLiters,
  formatCurrency,
  formatKm,
  formatDate,
  maintenanceTypeLabel,
  monthLabel,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";
import type { AlertLevel, MaintenanceType } from "@/types";

/**
 * 仪表盘总览页面
 * - 展示车队运营核心KPI数据
 * - 包含成本趋势图、保养提醒和待处理维修列表
 */
export default function Dashboard() {
  const {
    vehicles,
    fuelRecords,
    maintenanceRecords,
    filters,
    getLast6MonthsCost,
    getMonthlyTotalCost,
    getMaintenanceAlerts,
    getVehicleById,
  } = useStore();

  // 当前月份
  const currentMonth = filters.month;

  // 车辆总数
  const totalVehicles = vehicles.length;

  // 当月总油耗
  const monthlyFuel = useMemo(() => {
    return fuelRecords
      .filter((r) => r.fuelDate.startsWith(currentMonth))
      .reduce((s, r) => s + r.fuelAmount, 0);
  }, [fuelRecords, currentMonth]);

  // 当月总维修费
  const monthlyMaintenance = useMemo(() => {
    return maintenanceRecords
      .filter(
        (r) =>
          r.status === "completed" &&
          (r.finishDate?.startsWith(currentMonth) || false)
      )
      .reduce((s, r) => s + r.cost, 0);
  }, [maintenanceRecords, currentMonth]);

  // 近6个月成本趋势
  const last6MonthsCost = useMemo(() => {
    const raw = getLast6MonthsCost();
    return raw.map((item) => ({
      ...item,
      month: monthLabel(item.month),
    }));
  }, [getLast6MonthsCost]);

  // 保养提醒列表
  const alerts = useMemo(() => getMaintenanceAlerts(), [getMaintenanceAlerts]);

  // 待保养提醒数量（非safe级别的数量）
  const pendingReminderCount = alerts.filter((a) => a.level !== "safe").length;

  // 待处理维修申请
  const pendingMaintenances = useMemo(() => {
    return maintenanceRecords.filter((r) => r.status === "pending");
  }, [maintenanceRecords]);

  // 告警级别配置
  const alertLevelConfig: Record<
    AlertLevel,
    { badge: string; text: string; label: string }
  > = {
    safe: {
      badge: "bg-fuel-50 text-fuel-600 border border-fuel-200",
      text: "text-fuel-600",
      label: "正常",
    },
    warning: {
      badge:
        "bg-alert-yellow/15 text-alert-yellow border border-alert-yellow/30",
      text: "text-alert-yellow",
      label: "预警",
    },
    danger: {
      badge: "bg-alert-red/10 text-alert-red border border-alert-red/20",
      text: "text-alert-red",
      label: "警报",
    },
  };

  // 维修类型配置
  const maintenanceTypeConfig: Record<
    MaintenanceType,
    { badge: string; label: string }
  > = {
    routine: {
      badge: "bg-fuel-50 text-fuel-600 border border-fuel-200",
      label: "常规保养",
    },
    fault: {
      badge: "bg-alert-red/10 text-alert-red border border-alert-red/20",
      label: "故障维修",
    },
    overhaul: {
      badge: "bg-repair-50 text-repair-600 border border-repair-200",
      label: "大修",
    },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 页面头部 */}
      <div className="page-header">
        <div>
          <h1 className="page-title">仪表盘总览</h1>
          <p className="text-deep-400 mt-1 text-sm">车队运营数据实时监控</p>
        </div>
      </div>

      {/* KPI 卡片区域 2x2 网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          icon={Truck}
          title="车辆总数"
          value={totalVehicles}
          color="blue"
        />
        <KpiCard
          icon={Fuel}
          title="当月总油耗"
          value={formatLiters(monthlyFuel)}
          color="green"
        />
        <KpiCard
          icon={Wrench}
          title="当月总维修费"
          value={formatCurrency(monthlyMaintenance, 0)}
          color="purple"
        />
        <KpiCard
          icon={Bell}
          title="待保养提醒"
          value={pendingReminderCount}
          color="red"
        />
      </div>

      {/* 成本趋势图 */}
      <div className="card p-6 rounded-[12px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-orange-500" />
            </div>
            成本趋势
          </h3>
          <span className="text-xs text-deep-400">近6个月数据</span>
        </div>
        <CostTrendChart data={last6MonthsCost} />
      </div>

      {/* 保养提醒 + 待处理维修 双列布局 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* 左侧：保养提醒表格 */}
        <div className="card rounded-[12px] overflow-hidden">
          <div className="p-5 border-b border-deep-50/80">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-orange-500" />
                </div>
                保养提醒
              </h3>
              <span className="text-xs text-deep-400">
                共 {alerts.length} 条
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-deep-50/40">
                <tr>
                  <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                    剩余里程
                  </th>
                  <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                    车牌号
                  </th>
                  <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                    司机
                  </th>
                  <th className="text-left text-xs font-medium text-deep-400 px-5 py-3 whitespace-nowrap">
                    级别
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-deep-400 text-sm"
                    >
                      暂无保养提醒
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => {
                    const config = alertLevelConfig[alert.level];
                    return (
                      <tr
                        key={alert.vehicleId}
                        className="border-t border-deep-50/60 hover:bg-deep-50/30 transition-colors"
                      >
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "num font-semibold text-sm",
                              config.text
                            )}
                          >
                            {formatKm(alert.remaining)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-medium text-deep-700 tracking-wider">
                            {alert.plate}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="text-sm text-deep-600">
                            {alert.driverName}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "badge border",
                              config.badge
                            )}
                          >
                            {config.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：待处理维修申请列表 */}
        <div className="card rounded-[12px] overflow-hidden">
          <div className="p-5 border-b border-deep-50/80">
            <div className="flex items-center justify-between">
              <h3 className="section-title">
                <div className="w-8 h-8 rounded-lg bg-repair-50 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-repair-500" />
                </div>
                待处理维修
              </h3>
              <span className="text-xs text-deep-400">
                {pendingMaintenances.length} 条待处理
              </span>
            </div>
          </div>

          {pendingMaintenances.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="w-12 h-12 rounded-xl bg-fuel-50 flex items-center justify-center mx-auto mb-3">
                <Wrench className="w-6 h-6 text-fuel-400" />
              </div>
              <p className="text-deep-500 text-sm font-medium mb-1">
                暂无待处理维修
              </p>
              <p className="text-deep-400 text-xs">所有维修申请均已完成</p>
            </div>
          ) : (
            <div className="divide-y divide-deep-50/60">
              {pendingMaintenances.map((record) => {
                const vehicle = getVehicleById(record.vehicleId);
                const typeConfig = maintenanceTypeConfig[record.type];
                return (
                  <div
                    key={record.id}
                    className="p-5 hover:bg-deep-50/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "badge border",
                            typeConfig.badge
                          )}
                        >
                          {maintenanceTypeLabel(record.type)}
                        </span>
                        <span className="badge bg-alert-yellow/15 text-alert-yellow border border-alert-yellow/30">
                          待处理
                        </span>
                      </div>
                      <span className="text-xs text-deep-400 whitespace-nowrap shrink-0">
                        {formatDate(record.applyDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      {vehicle && (
                        <span className="text-sm font-semibold text-deep-700 tracking-wider">
                          {vehicle.plateNumber}
                        </span>
                      )}
                      <span className="text-deep-300">|</span>
                      <span className="text-xs text-deep-400">
                        维修厂：{record.workshop}
                      </span>
                    </div>

                    <p className="text-sm text-deep-600 line-clamp-2 leading-relaxed">
                      {record.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
