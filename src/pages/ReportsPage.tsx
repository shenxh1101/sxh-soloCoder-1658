import { useMemo } from "react";
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
} from "lucide-react";
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
  } = useStore();

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

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
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
    </div>
  );
}
