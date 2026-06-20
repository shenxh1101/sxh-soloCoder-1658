import { useMemo, useState, Fragment } from "react";
import {
  Fuel as FuelIcon,
  Wrench,
  DollarSign,
  BarChart3,
  ChevronDown,
  Truck,
  User,
  TrendingUp,
  Trophy,
  Car,
  X,
  Check,
  AlertTriangle,
  Shield,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "@/store";
import { lastNMonths, isSameMonth } from "@/utils/calculations";
import {
  formatCurrency,
  formatLiters,
  formatConsumption,
  monthLabel,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";
import FuelRankChart from "@/components/charts/FuelRankChart";
import CostRankChart from "@/components/charts/CostRankChart";

/**
 * 报表中心页面
 * - 月度总成本汇总
 * - 油耗/维修费用排名图表
 * - 各车详细数据表格
 */
export default function ReportsPage() {
  const {
    filters,
    setFilterMonth,
    getMonthlyTotalCost,
    getMonthlyFuelRank,
    getMonthlyCostRank,
    vehicles,
    fuelRecords,
    maintenanceRecords,
    getVehicleById,
    selectedVehicles,
    toggleSelectedVehicle,
    clearSelectedVehicles,
    getVehicleCostTrend,
    getVehicleAnomalyStats,
    getVehicleAnomalyTrend,
    getVehicleRiskScores,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"monthly" | "comparison">("monthly");
  const [riskPeriod, setRiskPeriod] = useState<3 | 6>(3);

  const VEHICLE_COLORS = ["#f97316", "#3b82f6", "#22c55e"];

  const currentMonth = filters.month;

  // 最近6个月选项
  const monthOptions = useMemo(() => lastNMonths(6), []);

  // 月度总成本
  const monthlyCost = useMemo(
    () => getMonthlyTotalCost(currentMonth),
    [getMonthlyTotalCost, currentMonth]
  );

  // 油耗排名数据
  const fuelRankData = useMemo(
    () => getMonthlyFuelRank(currentMonth),
    [getMonthlyFuelRank, currentMonth]
  );

  // 维修费用排名数据
  const costRankData = useMemo(
    () => getMonthlyCostRank(currentMonth),
    [getMonthlyCostRank, currentMonth]
  );

  // 各车详细数据
  const vehicleDetailData = useMemo(() => {
    const data = vehicles.map((v) => {
      // 当月加油数据
      const vFuelRecords = fuelRecords.filter(
        (r) => r.vehicleId === v.id && isSameMonth(r.fuelDate, currentMonth)
      );
      const totalFuel = vFuelRecords.reduce((s, r) => s + r.fuelAmount, 0);
      const fuelCost = vFuelRecords.reduce((s, r) => s + r.fuelCost, 0);

      // 计算平均油耗
      const consumptions = vFuelRecords
        .map((r) => r.fuelConsumption)
        .filter((c): c is number => c !== null && c !== undefined);
      const avgConsumption =
        consumptions.length > 0
          ? consumptions.reduce((s, n) => s + n, 0) / consumptions.length
          : null;

      // 当月维修数据
      const repairCost = maintenanceRecords
        .filter(
          (r) =>
            r.vehicleId === v.id &&
            r.status === "completed" &&
            isSameMonth(r.finishDate, currentMonth)
        )
        .reduce((s, r) => s + r.cost, 0);

      const totalCost = fuelCost + repairCost;

      return {
        id: v.id,
        plateNumber: v.plateNumber,
        driverName: v.driverName,
        avgConsumption,
        totalFuel,
        fuelCost,
        repairCost,
        totalCost,
      };
    });

    // 按合计降序排序
    return data.sort((a, b) => b.totalCost - a.totalCost);
  }, [vehicles, fuelRecords, maintenanceRecords, currentMonth]);

  const riskScores = useMemo(
    () => getVehicleRiskScores(riskPeriod),
    [getVehicleRiskScores, riskPeriod]
  );

  const riskOverview = useMemo(() => {
    const high = riskScores.filter((r) => r.riskScore >= 60).length;
    const medium = riskScores.filter((r) => r.riskScore >= 30 && r.riskScore < 60).length;
    const low = riskScores.filter((r) => r.riskScore < 30).length;
    return { high, medium, low };
  }, [riskScores]);

  const riskTrendChartData = useMemo(() => {
    const monthList = lastNMonths(riskPeriod);
    return monthList.map((month) => {
      const row: Record<string, string | number> = { month };
      riskScores.slice(0, 6).forEach((rs) => {
        const trendItem = rs.trendData.find((t) => t.month === month);
        row[`${rs.vehicleId}_score`] = trendItem ? trendItem.score : 0;
      });
      return row;
    });
  }, [riskScores, riskPeriod]);

  const RISK_CHART_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#ec4899", "#14b8a6"];

  // 车辆对比数据
  const comparisonData = useMemo(() => {
    const monthList = lastNMonths(6);
    return monthList.map((month) => {
      const row: Record<string, string | number> = { month };
      selectedVehicles.forEach((vehicleId) => {
        const trend = getVehicleCostTrend(vehicleId, 6);
        const monthData = trend.find((t) => t.month === month);
        const vehicle = getVehicleById(vehicleId);
        if (vehicle && monthData) {
          row[`${vehicleId}_fuel`] = monthData.fuel;
          row[`${vehicleId}_maintenance`] = monthData.maintenance;
          row[`${vehicleId}_total`] = monthData.total;
        }
      });
      return row;
    });
  }, [selectedVehicles, getVehicleCostTrend, getVehicleById]);

  // 异常统计数据
  const anomalyStatsData = useMemo(() => {
    return selectedVehicles.map((vehicleId, index) => {
      const vehicle = getVehicleById(vehicleId);
      const stats = getVehicleAnomalyStats(vehicleId, 3);
      return {
        vehicleId,
        plateNumber: vehicle?.plateNumber || "",
        color: VEHICLE_COLORS[index],
        ...stats,
      };
    });
  }, [selectedVehicles, getVehicleById, getVehicleAnomalyStats]);

  // 异常趋势数据
  const anomalyTrendData = useMemo(() => {
    const monthList = lastNMonths(6);
    return monthList.map((month) => {
      const row: Record<string, string | number> = { month };
      selectedVehicles.forEach((vehicleId) => {
        const trend = getVehicleAnomalyTrend(vehicleId, 6);
        const monthData = trend.find((t) => t.month === month);
        if (monthData) {
          row[`${vehicleId}_count`] = monthData.count;
          row[`${vehicleId}_resolved`] = monthData.resolved;
        }
      });
      return row;
    });
  }, [selectedVehicles, getVehicleAnomalyTrend]);

  const LineChartTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-hover border border-deep-50/60 px-4 py-3 min-w-[180px]">
          <p className="text-xs text-deep-400 mb-2 font-medium">{monthLabel(label || "")}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-deep-500">{entry.name}</span>
              </div>
              <span className="text-xs font-mono font-semibold text-deep-700 tabular-nums">
                {formatCurrency(entry.value, 0)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const LineChartLegend = ({
    payload,
  }: {
    payload?: Array<{ value: string; color: string }>;
  }) => {
    if (!payload) return null;
    return (
      <div className="flex items-center justify-center gap-5 pt-2 flex-wrap">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-deep-500">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const BarChartTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-hover border border-deep-50/60 px-4 py-3 min-w-[180px]">
          <p className="text-xs text-deep-400 mb-2 font-medium">{monthLabel(label || "")}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-deep-500">{entry.name}</span>
              </div>
              <span className="text-xs font-mono font-semibold text-deep-700 tabular-nums">
                {entry.value} 次
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const BarChartLegend = ({
    payload,
  }: {
    payload?: Array<{ value: string; color: string }>;
  }) => {
    if (!payload) return null;
    return (
      <div className="flex items-center justify-center gap-5 pt-2 flex-wrap">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-deep-500">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-deep-700">报表中心</h1>
            <p className="text-sm text-deep-400 mt-0.5">
              月度运营成本分析与车辆数据统计
            </p>
          </div>

          {/* 月份选择器 */}
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input !w-auto !py-2.5 pr-10 appearance-none cursor-pointer bg-white"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-deep-400 pointer-events-none" />
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-2 p-1 bg-deep-50/60 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("monthly")}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "monthly"
                ? "bg-white text-deep-700 shadow-sm"
                : "text-deep-400 hover:text-deep-600"
            )}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              月度汇总
            </span>
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === "comparison"
                ? "bg-white text-deep-700 shadow-sm"
                : "text-deep-400 hover:text-deep-600"
            )}
          >
            <span className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              车辆对比
            </span>
          </button>
        </div>
      </div>

      {/* 月度汇总 Tab 内容 */}
      {activeTab === "monthly" && (
        <>
          {/* 月度总成本汇总大卡片 */}
          <div className="card p-6 rounded-[16px] bg-gradient-to-br from-deep-600 via-deep-500 to-deep-600 text-white overflow-hidden relative">
            {/* 背景装饰 */}
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5"></div>
            <div className="absolute -right-10 -bottom-20 w-48 h-48 rounded-full bg-white/5"></div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{monthLabel(currentMonth)} 总成本汇总</h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    油耗 + 维修费用 合计统计
                  </p>
                </div>
              </div>

              {/* 三列统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 油耗总成本 */}
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-fuel-500/30 flex items-center justify-center">
                      <FuelIcon className="w-5.5 h-5.5 text-fuel-300" />
                    </div>
                    <span className="text-sm text-white/70 font-medium">
                      油耗总成本
                    </span>
                  </div>
                  <p className="num text-3xl font-bold">
                    {formatCurrency(monthlyCost.fuel, 0)}
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    加油费用合计
                  </p>
                </div>

                {/* 维修总成本 */}
                <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-repair-500/30 flex items-center justify-center">
                      <Wrench className="w-5.5 h-5.5 text-repair-300" />
                    </div>
                    <span className="text-sm text-white/70 font-medium">
                      维修总成本
                    </span>
                  </div>
                  <p className="num text-3xl font-bold">
                    {formatCurrency(monthlyCost.maintenance, 0)}
                  </p>
                  <p className="text-xs text-white/50 mt-2">
                    已完成维修费用合计
                  </p>
                </div>

                {/* 合计成本 */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500/30 to-orange-400/20 backdrop-blur-sm border border-orange-400/30">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-orange-500/40 flex items-center justify-center">
                      <DollarSign className="w-5.5 h-5.5 text-orange-300" />
                    </div>
                    <span className="text-sm text-white/80 font-medium">
                      合计成本
                    </span>
                  </div>
                  <p className="num text-3xl font-bold text-orange-300">
                    {formatCurrency(monthlyCost.total, 0)}
                  </p>
                  <p className="text-xs text-white/60 mt-2">
                    本月运营总支出
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 中部图表区域：油耗排名 + 维修费用排名 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 当月油耗排名 */}
            <div className="card rounded-[12px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-fuel-50 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-fuel-500" />
                  </div>
                  <div>
                    <h3 className="section-title !mb-0">
                      当月油耗排名（L/100km）
                    </h3>
                    <p className="text-xs text-deep-400 mt-0.5">
                      平均油耗越低排名越靠前
                    </p>
                  </div>
                </div>
                {fuelRankData.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fuel-50 text-fuel-600 text-xs font-medium border border-fuel-100">
                    <Trophy className="w-3.5 h-3.5" />
                    共 {fuelRankData.length} 车
                  </span>
                )}
              </div>

              {fuelRankData.length > 0 ? (
                <FuelRankChart data={fuelRankData} />
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-deep-400">
                  <FuelIcon className="w-12 h-12 mb-3 text-deep-200" />
                  <p className="font-medium">暂无油耗数据</p>
                  <p className="text-sm mt-1">本月车辆无加油记录</p>
                </div>
              )}
            </div>

            {/* 当月维修费用排名 */}
            <div className="card rounded-[12px] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-repair-50 flex items-center justify-center">
                    <Wrench className="w-4.5 h-4.5 text-repair-500" />
                  </div>
                  <div>
                    <h3 className="section-title !mb-0">
                      当月维修费用排名（¥）
                    </h3>
                    <p className="text-xs text-deep-400 mt-0.5">
                      维修费用越高排名越靠前
                    </p>
                  </div>
                </div>
                {costRankData.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-repair-50 text-repair-600 text-xs font-medium border border-repair-100">
                    <Trophy className="w-3.5 h-3.5" />
                    共 {costRankData.length} 车
                  </span>
                )}
              </div>

              {costRankData.length > 0 ? (
                <CostRankChart data={costRankData} />
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-deep-400">
                  <Wrench className="w-12 h-12 mb-3 text-deep-200" />
                  <p className="font-medium">暂无维修数据</p>
                  <p className="text-sm mt-1">本月无已完成维修记录</p>
                </div>
              )}
            </div>
          </div>

          {/* 各车详细数据表 */}
          <div className="card rounded-[12px] overflow-hidden">
            <div className="p-5 border-b border-deep-50/80">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5 text-orange-500" />
                </div>
                <div>
                  <h3 className="section-title !mb-0">各车详细数据</h3>
                  <p className="text-xs text-deep-400 mt-0.5">
                    {monthLabel(currentMonth)} 车辆运营数据明细（按合计成本降序）
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-deep-50/40">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        排名
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        车牌
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        司机
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1 justify-end">
                        <TrendingUp className="w-3.5 h-3.5" />
                        平均油耗
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1 justify-end">
                        <FuelIcon className="w-3.5 h-3.5" />
                        加油量
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      油费
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1 justify-end">
                        <Wrench className="w-3.5 h-3.5" />
                        维修费
                      </span>
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1 justify-end">
                        <DollarSign className="w-3.5 h-3.5" />
                        合计
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deep-50">
                  {vehicleDetailData.every(
                    (d) => d.totalCost === 0
                  ) ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-16 text-center"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center">
                            <BarChart3 className="w-8 h-8 text-deep-300" />
                          </div>
                          <p className="text-deep-500 font-medium">
                            暂无运营数据
                          </p>
                          <p className="text-sm text-deep-400">
                            本月车辆无加油或维修记录
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    vehicleDetailData.map((v, index) => (
                      <tr
                        key={v.id}
                        className={cn(
                          "hover:bg-deep-50/40 transition-colors",
                          index % 2 === 1 && "bg-deep-50/20"
                        )}
                      >
                        {/* 排名 */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          {v.totalCost > 0 ? (
                            <span
                              className={cn(
                                "inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold",
                                index === 0 &&
                                  "bg-orange-500/15 text-orange-600",
                                index === 1 &&
                                  "bg-deep-400/15 text-deep-500",
                                index === 2 &&
                                  "bg-repair-500/15 text-repair-500",
                                index > 2 &&
                                  "bg-deep-100 text-deep-500"
                              )}
                            >
                              {index + 1}
                            </span>
                          ) : (
                            <span className="text-deep-300">--</span>
                          )}
                        </td>

                        {/* 车牌 */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-deep-50 text-deep-700 text-sm font-medium tracking-wider">
                            {v.plateNumber}
                          </span>
                        </td>

                        {/* 司机 */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
                              {v.driverName?.charAt(0) || "司"}
                            </div>
                            <span className="text-sm font-medium text-deep-700">
                              {v.driverName || "--"}
                            </span>
                          </div>
                        </td>

                        {/* 平均油耗 */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span
                            className={cn(
                              "num text-sm font-semibold",
                              v.avgConsumption !== null
                                ? "text-repair-600"
                                : "text-deep-400"
                            )}
                          >
                            {formatConsumption(v.avgConsumption)}
                          </span>
                        </td>

                        {/* 加油量 */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="num text-sm font-semibold text-fuel-600">
                            {v.totalFuel > 0 ? formatLiters(v.totalFuel) : "--"}
                          </span>
                        </td>

                        {/* 油费 */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="num text-sm font-semibold text-orange-600">
                            {v.fuelCost > 0 ? formatCurrency(v.fuelCost, 0) : "--"}
                          </span>
                        </td>

                        {/* 维修费 */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <span className="num text-sm font-semibold text-repair-600">
                            {v.repairCost > 0 ? formatCurrency(v.repairCost, 0) : "--"}
                          </span>
                        </td>

                        {/* 合计 */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          {v.totalCost > 0 ? (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-orange-50 num text-sm font-bold text-orange-600 border border-orange-100">
                              {formatCurrency(v.totalCost, 0)}
                            </span>
                          ) : (
                            <span className="text-deep-300">--</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 运营风险看板 */}
          <div className="card rounded-[12px] overflow-hidden">
            <div className="p-5 border-b border-deep-50/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="section-title !mb-0">运营风险看板</h3>
                    <p className="text-xs text-deep-400 mt-0.5">
                      基于油耗波动、维修超期、异常处理等维度的综合风险评估
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 p-1 bg-deep-50/60 rounded-lg">
                  <button
                    onClick={() => setRiskPeriod(3)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      riskPeriod === 3
                        ? "bg-white text-deep-700 shadow-sm"
                        : "text-deep-400 hover:text-deep-600"
                    )}
                  >
                    近3个月
                  </button>
                  <button
                    onClick={() => setRiskPeriod(6)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      riskPeriod === 6
                        ? "bg-white text-deep-700 shadow-sm"
                        : "text-deep-400 hover:text-deep-600"
                    )}
                  >
                    近6个月
                  </button>
                </div>
              </div>
            </div>

            {/* 风险评分概览 */}
            <div className="p-5 border-b border-deep-50/80">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-red-50/60 border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600 num">{riskOverview.high}</p>
                      <p className="text-xs text-red-400 font-medium">高风险车辆</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-red-300 mt-2 ml-[52px]">风险评分 ≥ 60</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600 num">{riskOverview.medium}</p>
                      <p className="text-xs text-orange-400 font-medium">中风险车辆</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-orange-300 mt-2 ml-[52px]">风险评分 30~60</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50/60 border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600 num">{riskOverview.low}</p>
                      <p className="text-xs text-green-400 font-medium">低风险车辆</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-green-300 mt-2 ml-[52px]">风险评分 &lt; 30</p>
                </div>
              </div>
            </div>

            {/* 车辆风险表格 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-deep-50/40">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        车牌
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        司机
                      </span>
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        风险评分
                      </span>
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      风险等级
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      油耗波动%
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      超期维修
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      保养临近
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      未处理异常
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                      已处理率
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-deep-50">
                  {riskScores.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center">
                            <Shield className="w-8 h-8 text-deep-300" />
                          </div>
                          <p className="text-deep-500 font-medium">暂无风险数据</p>
                          <p className="text-sm text-deep-400">当前时段内无车辆运营数据</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    riskScores.map((r, index) => {
                      const scoreColor = r.riskScore >= 60 ? "bg-red-500" : r.riskScore >= 30 ? "bg-orange-500" : "bg-green-500";
                      const levelBadge = r.riskLevel === "high"
                        ? "bg-red-50 text-red-600 border-red-100"
                        : r.riskLevel === "medium"
                        ? "bg-orange-50 text-orange-600 border-orange-100"
                        : "bg-green-50 text-green-600 border-green-100";
                      const levelText = r.riskLevel === "high" ? "高" : r.riskLevel === "medium" ? "中" : "低";
                      return (
                        <tr
                          key={r.vehicleId}
                          className={cn(
                            "hover:bg-deep-50/40 transition-colors",
                            index % 2 === 1 && "bg-deep-50/20"
                          )}
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-deep-50 text-deep-700 text-sm font-medium tracking-wider">
                              {r.plateNumber}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold">
                                {r.driverName?.charAt(0) || "司"}
                              </div>
                              <span className="text-sm font-medium text-deep-700">
                                {r.driverName || "--"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-[80px] h-2 bg-deep-100 rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full transition-all duration-500", scoreColor)}
                                  style={{ width: `${Math.min(r.riskScore, 100)}%` }}
                                />
                              </div>
                              <span className="num text-sm font-semibold text-deep-700 w-8 text-right">{r.riskScore}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className={cn("inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border", levelBadge)}>
                              {levelText}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <span className={cn(
                              "num text-sm font-semibold",
                              r.fuelFluctuation > 20 ? "text-red-600" : r.fuelFluctuation > 10 ? "text-orange-600" : "text-green-600"
                            )}>
                              {r.fuelFluctuation}%
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            {r.overdueMaintenanceCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                                {r.overdueMaintenanceCount}
                              </span>
                            ) : (
                              <span className="text-deep-300 text-sm">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            {r.upcomingMaintenanceCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
                                {r.upcomingMaintenanceCount}
                              </span>
                            ) : (
                              <span className="text-deep-300 text-sm">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            {r.unresolvedAnomalyCount > 0 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                                {r.unresolvedAnomalyCount}
                              </span>
                            ) : (
                              <span className="text-deep-300 text-sm">0</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-12 h-1.5 bg-deep-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${r.resolvedRate * 100}%`,
                                    backgroundColor: r.resolvedRate >= 0.8 ? '#22c55e' : r.resolvedRate >= 0.5 ? '#f97316' : '#ef4444',
                                  }}
                                />
                              </div>
                              <span className={cn(
                                "num text-xs font-semibold",
                                r.resolvedRate >= 0.8 ? "text-green-600" : r.resolvedRate >= 0.5 ? "text-orange-600" : "text-red-600"
                              )}>
                                {(r.resolvedRate * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 风险趋势折线图 */}
            {riskScores.length > 0 && (
              <div className="p-5 border-t border-deep-50/80">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-deep-700">风险评分趋势</h4>
                    <p className="text-xs text-deep-400">
                      近{riskPeriod}个月各车辆风险评分变化
                    </p>
                  </div>
                </div>
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={riskTrendChartData}
                      margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E8EEF7"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E8EEF7' }}
                        dy={8}
                        tickFormatter={(value) => monthLabel(value).replace("年", "/").replace("月", "")}
                      />
                      <YAxis
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        width={36}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white rounded-xl shadow-hover border border-deep-50/60 px-4 py-3 min-w-[180px]">
                                <p className="text-xs text-deep-400 mb-2 font-medium">{monthLabel(label || "")}</p>
                                {payload.map((entry, index) => (
                                  <div key={index} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-xs text-deep-500">{entry.name}</span>
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-deep-700 tabular-nums">
                                      {entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{ fill: '#F5F7FA', opacity: 0.5 }}
                      />
                      <Legend
                        content={({ payload }) => {
                          if (!payload) return null;
                          return (
                            <div className="flex items-center justify-center gap-5 pt-2 flex-wrap">
                              {payload.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-xs text-deep-500">{entry.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      {riskScores.slice(0, 6).map((rs, index) => {
                        const color = RISK_CHART_COLORS[index];
                        return (
                          <Line
                            key={`${rs.vehicleId}_risk`}
                            type="monotone"
                            dataKey={`${rs.vehicleId}_score`}
                            name={rs.plateNumber}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ fill: '#FFFFFF', stroke: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#FFFFFF' }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 车辆对比 Tab 内容 */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          {/* 车辆选择器 */}
          <div className="card rounded-[12px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Car className="w-4.5 h-4.5 text-orange-500" />
                </div>
                <div>
                  <h3 className="section-title !mb-0">选择对比车辆</h3>
                  <p className="text-xs text-deep-400 mt-0.5">
                    最多选择 3 辆车进行成本对比分析
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-deep-400">
                  已选 <span className="font-semibold text-deep-600">{selectedVehicles.length}</span>/3 辆
                </span>
                {selectedVehicles.length > 0 && (
                  <button
                    onClick={clearSelectedVehicles}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-deep-500 bg-deep-50 hover:bg-deep-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    清除选择
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {vehicles.map((vehicle) => {
                const isSelected = selectedVehicles.includes(vehicle.id);
                const colorIndex = selectedVehicles.indexOf(vehicle.id);
                const canSelect = selectedVehicles.length < 3 || isSelected;
                const vehicleColor = isSelected ? VEHICLE_COLORS[colorIndex] : undefined;

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => canSelect && toggleSelectedVehicle(vehicle.id)}
                    className={cn(
                      "relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "bg-white shadow-md"
                        : "bg-deep-50/30 hover:bg-deep-50/60",
                      isSelected && vehicleColor
                        ? "border-current"
                        : "border-transparent hover:border-deep-200",
                      !canSelect && !isSelected && "opacity-50 cursor-not-allowed"
                    )}
                    style={isSelected && vehicleColor ? { borderColor: vehicleColor, color: vehicleColor } : undefined}
                  >
                    {isSelected && (
                      <div
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                        style={{ backgroundColor: vehicleColor }}
                      >
                        {colorIndex + 1}
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-white/10"
                              : "bg-deep-100"
                          )}
                          style={isSelected && vehicleColor ? { backgroundColor: `${vehicleColor}15` } : undefined}
                        >
                          <Truck
                            className={cn(
                              "w-5 h-5",
                              isSelected ? "text-current" : "text-deep-400"
                            )}
                          />
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-semibold tracking-wider",
                            isSelected ? "text-current" : "text-deep-700"
                          )}>
                            {vehicle.plateNumber}
                          </p>
                          <p className="text-xs text-deep-400 mt-0.5">
                            {vehicle.driverName || "未分配司机"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                          isSelected
                            ? "border-transparent"
                            : "border-deep-300"
                        )}
                        style={isSelected && vehicleColor ? { backgroundColor: vehicleColor } : undefined}
                      >
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 图表区域 */}
          {selectedVehicles.length === 0 ? (
            <div className="card rounded-[12px] p-16">
              <div className="flex flex-col items-center justify-center text-deep-400">
                <div className="w-20 h-20 rounded-2xl bg-deep-50 flex items-center justify-center mb-4">
                  <Car className="w-10 h-10 text-deep-300" />
                </div>
                <p className="text-lg font-semibold text-deep-600 mb-2">请选择要对比的车辆</p>
                <p className="text-sm text-deep-400">
                  在上方选择最多 3 辆车，即可查看成本趋势对比分析
                </p>
              </div>
            </div>
          ) : selectedVehicles.length === 1 ? (
            <div className="card rounded-[12px] p-16">
              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-10 h-10 text-yellow-500" />
                </div>
                <p className="text-lg font-semibold text-yellow-600 mb-2">请至少选择 2 辆车进行对比，最多可选择 3 辆</p>
                <p className="text-sm text-deep-400">
                  在上方继续选择车辆以进行成本趋势对比分析
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 近6个月油耗成本走势 */}
              <div className="card rounded-[12px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-fuel-50 flex items-center justify-center">
                      <FuelIcon className="w-4.5 h-4.5 text-fuel-500" />
                    </div>
                    <div>
                      <h3 className="section-title !mb-0">近6个月油耗成本走势</h3>
                      <p className="text-xs text-deep-400 mt-0.5">
                        各车辆燃油费用月度对比
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={comparisonData}
                      margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E8EEF7"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E8EEF7' }}
                        dy={8}
                        tickFormatter={(value) => monthLabel(value).replace("年", "/").replace("月", "")}
                      />
                      <YAxis
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        width={48}
                      />
                      <Tooltip content={<LineChartTooltip />} cursor={{ fill: '#F5F7FA', opacity: 0.5 }} />
                      <Legend content={<LineChartLegend />} />
                      {selectedVehicles.map((vehicleId, index) => {
                        const vehicle = getVehicleById(vehicleId);
                        const color = VEHICLE_COLORS[index];
                        return (
                          <Line
                            key={`${vehicleId}_fuel`}
                            type="monotone"
                            dataKey={`${vehicleId}_fuel`}
                            name={vehicle?.plateNumber || ""}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ fill: '#FFFFFF', stroke: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#FFFFFF' }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 近6个月维修成本走势 */}
              <div className="card rounded-[12px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-repair-50 flex items-center justify-center">
                      <Wrench className="w-4.5 h-4.5 text-repair-500" />
                    </div>
                    <div>
                      <h3 className="section-title !mb-0">近6个月维修成本走势</h3>
                      <p className="text-xs text-deep-400 mt-0.5">
                        各车辆维修费用月度对比
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={comparisonData}
                      margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E8EEF7"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E8EEF7' }}
                        dy={8}
                        tickFormatter={(value) => monthLabel(value).replace("年", "/").replace("月", "")}
                      />
                      <YAxis
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        width={48}
                      />
                      <Tooltip content={<LineChartTooltip />} cursor={{ fill: '#F5F7FA', opacity: 0.5 }} />
                      <Legend content={<LineChartLegend />} />
                      {selectedVehicles.map((vehicleId, index) => {
                        const vehicle = getVehicleById(vehicleId);
                        const color = VEHICLE_COLORS[index];
                        return (
                          <Line
                            key={`${vehicleId}_maintenance`}
                            type="monotone"
                            dataKey={`${vehicleId}_maintenance`}
                            name={vehicle?.plateNumber || ""}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ fill: '#FFFFFF', stroke: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#FFFFFF' }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 近6个月总成本走势 */}
              <div className="card rounded-[12px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                      <DollarSign className="w-4.5 h-4.5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="section-title !mb-0">近6个月总成本走势</h3>
                      <p className="text-xs text-deep-400 mt-0.5">
                        各车辆总运营成本月度对比
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={comparisonData}
                      margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E8EEF7"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#E8EEF7' }}
                        dy={8}
                        tickFormatter={(value) => monthLabel(value).replace("年", "/").replace("月", "")}
                      />
                      <YAxis
                        tick={{ fill: '#A3B9DD', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        width={48}
                      />
                      <Tooltip content={<LineChartTooltip />} cursor={{ fill: '#F5F7FA', opacity: 0.5 }} />
                      <Legend content={<LineChartLegend />} />
                      {selectedVehicles.map((vehicleId, index) => {
                        const vehicle = getVehicleById(vehicleId);
                        const color = VEHICLE_COLORS[index];
                        return (
                          <Line
                            key={`${vehicleId}_total`}
                            type="monotone"
                            dataKey={`${vehicleId}_total`}
                            name={vehicle?.plateNumber || ""}
                            stroke={color}
                            strokeWidth={2.5}
                            dot={{ fill: '#FFFFFF', stroke: color, strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#FFFFFF' }}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 异常分析区域 */}
              <div className="space-y-6">
                <div className="card rounded-[12px] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="section-title !mb-0">异常分析</h3>
                        <p className="text-xs text-deep-400 mt-0.5">
                          各车辆异常统计与趋势对比
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 异常统计卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {anomalyStatsData.map((stats) => (
                      <div
                        key={stats.vehicleId}
                        className="p-5 rounded-2xl border border-deep-100 bg-gradient-to-br from-white to-deep-50/30 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${stats.color}15` }}
                          >
                            <Truck
                              className="w-5 h-5"
                              style={{ color: stats.color }}
                            />
                          </div>
                          <div>
                            <p
                              className="text-sm font-semibold tracking-wider"
                              style={{ color: stats.color }}
                            >
                              {stats.plateNumber}
                            </p>
                            <p className="text-xs text-deep-400">
                              近3个月异常统计
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center p-2 rounded-lg bg-deep-50/50">
                            <p className="text-2xl font-bold text-deep-700">
                              {stats.total}
                            </p>
                            <p className="text-xs text-deep-400">异常总数</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-red-50">
                            <p className="text-2xl font-bold text-red-600">
                              {stats.pending}
                            </p>
                            <p className="text-xs text-red-400">待处理</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-green-50">
                            <p className="text-2xl font-bold text-green-600">
                              {stats.resolved}
                            </p>
                            <p className="text-xs text-green-400">已解决</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-deep-500">已处理率</span>
                            <span className="text-xs font-semibold text-deep-700">
                              {(stats.resolvedRate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-deep-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${stats.resolvedRate * 100}%`,
                                backgroundColor: stats.resolvedRate >= 0.8 ? '#22c55e' : stats.resolvedRate >= 0.5 ? '#f97316' : '#ef4444',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 异常趋势柱状图 */}
                  <div className="border-t border-deep-50 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-deep-700">近6个月异常趋势</h4>
                        <p className="text-xs text-deep-400">
                          各车辆异常总数与已解决数月度对比
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={anomalyTrendData}
                          margin={{ top: 20, right: 24, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#E8EEF7"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fill: '#A3B9DD', fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: '#E8EEF7' }}
                            dy={8}
                            tickFormatter={(value) => monthLabel(value).replace("年", "/").replace("月", "")}
                          />
                          <YAxis
                            tick={{ fill: '#A3B9DD', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            width={48}
                            allowDecimals={false}
                          />
                          <Tooltip content={<BarChartTooltip />} cursor={{ fill: '#F5F7FA', opacity: 0.5 }} />
                          <Legend content={<BarChartLegend />} />
                          {selectedVehicles.map((vehicleId, index) => {
                            const vehicle = getVehicleById(vehicleId);
                            const color = VEHICLE_COLORS[index];
                            return (
                              <Fragment key={vehicleId}>
                                <Bar
                                  dataKey={`${vehicleId}_count`}
                                  name={`${vehicle?.plateNumber || ''} - 异常总数`}
                                  fill={color}
                                  radius={[4, 4, 0, 0]}
                                  barSize={16}
                                />
                                <Bar
                                  dataKey={`${vehicleId}_resolved`}
                                  name={`${vehicle?.plateNumber || ''} - 已解决`}
                                  fill={`${color}66`}
                                  radius={[4, 4, 0, 0]}
                                  barSize={16}
                                />
                              </Fragment>
                            );
                          })}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
