import { useState, useMemo } from "react";
import { Search, Fuel as FuelIcon, DollarSign, Calendar, MapPin, TrendingUp, Truck, Filter } from "lucide-react";
import { useStore } from "@/store";
import {
  formatDate,
  formatLiters,
  formatCurrency,
  formatConsumption,
  formatKm,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface FuelListProps {
  vehicleId?: string;
}

/**
 * 加油记录列表组件
 * - 支持按车辆过滤（vehicleId prop）
 * - 支持关键词搜索过滤
 * - 表格展示所有加油记录
 */
export default function FuelList({ vehicleId }: FuelListProps) {
  const { fuelRecords, vehicles, getVehicleById } = useStore();
  const [searchKeyword, setSearchKeyword] = useState("");

  // 过滤和排序记录
  const filteredRecords = useMemo(() => {
    let records = [...fuelRecords];

    // 按车辆过滤
    if (vehicleId) {
      records = records.filter((r) => r.vehicleId === vehicleId);
    }

    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      records = records.filter((r) => {
        const vehicle = getVehicleById(r.vehicleId);
        return (
          vehicle?.plateNumber.toLowerCase().includes(keyword) ||
          vehicle?.model.toLowerCase().includes(keyword) ||
          r.gasStation.toLowerCase().includes(keyword) ||
          r.notes?.toLowerCase().includes(keyword)
        );
      });
    }

    // 按日期倒序
    return records.sort(
      (a, b) => new Date(b.fuelDate).getTime() - new Date(a.fuelDate).getTime()
    );
  }, [fuelRecords, vehicleId, searchKeyword, getVehicleById]);

  // 汇总统计
  const summary = useMemo(() => {
    const totalLiters = filteredRecords.reduce((s, r) => s + r.fuelAmount, 0);
    const totalCost = filteredRecords.reduce((s, r) => s + r.fuelCost, 0);
    const consumptions = filteredRecords
      .map((r) => r.fuelConsumption)
      .filter((c): c is number => c !== null && c !== undefined);
    const avgConsumption =
      consumptions.length > 0
        ? consumptions.reduce((s, n) => s + n, 0) / consumptions.length
        : null;
    return { totalLiters, totalCost, avgConsumption, count: filteredRecords.length };
  }, [filteredRecords]);

  return (
    <div className="card rounded-[12px] overflow-hidden">
      {/* 搜索栏和汇总 */}
      <div className="p-5 border-b border-deep-50/80">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-fuel-50 flex items-center justify-center">
              <FuelIcon className="w-4.5 h-4.5 text-fuel-500" />
            </div>
            <div>
              <h3 className="section-title !mb-0">加油记录</h3>
              <p className="text-xs text-deep-400 mt-0.5">
                共 {summary.count} 条记录
              </p>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索车牌、加油站..."
              className="input pl-10 pr-4"
            />
          </div>
        </div>

        {/* 汇总卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-deep-50/60">
            <div className="flex items-center gap-2 mb-1.5">
              <FuelIcon className="w-4 h-4 text-fuel-500" />
              <span className="text-xs text-deep-500">总加油量</span>
            </div>
            <p className="num text-xl font-bold text-fuel-600">
              {formatLiters(summary.totalLiters)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-orange-50/60">
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-deep-500">总金额</span>
            </div>
            <p className="num text-xl font-bold text-orange-600">
              {formatCurrency(summary.totalCost, 0)}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-deep-100/40">
            <div className="flex items-center gap-2 mb-1.5">
              <DollarSign className="w-4 h-4 text-deep-500" />
              <span className="text-xs text-deep-500">平均单价</span>
            </div>
            <p className="num text-xl font-bold text-deep-600">
              {summary.totalLiters > 0
                ? formatCurrency(summary.totalCost / summary.totalLiters, 2)
                : "--"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-repair-50/60">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-repair-500" />
              <span className="text-xs text-deep-500">平均油耗</span>
            </div>
            <p className="num text-xl font-bold text-repair-600">
              {formatConsumption(summary.avgConsumption)}
            </p>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-deep-50/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  日期
                </span>
              </th>
              {!vehicleId && (
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    车牌
                  </span>
                </th>
              )}
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1 justify-end">
                  <FuelIcon className="w-3.5 h-3.5" />
                  加油量 (L)
                </span>
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1 justify-end">
                  <DollarSign className="w-3.5 h-3.5" />
                  金额 (¥)
                </span>
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                单价 (¥/L)
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1 justify-end">
                  <MapPin className="w-3.5 h-3.5" />
                  里程
                </span>
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3.5 h-3.5" />
                  油耗 (L/100km)
                </span>
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                加油站
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-deep-50">
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={vehicleId ? 7 : 8}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center">
                      <Filter className="w-8 h-8 text-deep-300" />
                    </div>
                    <p className="text-deep-500 font-medium">暂无加油记录</p>
                    <p className="text-sm text-deep-400">
                      {searchKeyword ? "请尝试其他搜索条件" : "新增一条加油记录吧"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record, index) => {
                const vehicle = getVehicleById(record.vehicleId);
                return (
                  <tr
                    key={record.id}
                    className={cn(
                      "hover:bg-deep-50/40 transition-colors",
                      index % 2 === 1 && "bg-deep-50/20"
                    )}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-deep-700">
                        {formatDate(record.fuelDate)}
                      </p>
                    </td>
                    {!vehicleId && (
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-deep-50 text-deep-700 text-sm font-medium tracking-wider">
                          {vehicle?.plateNumber || "--"}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="num text-sm font-semibold text-fuel-600">
                        {formatLiters(record.fuelAmount)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="num text-sm font-semibold text-orange-600">
                        {formatCurrency(record.fuelCost, 0)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="num text-sm text-deep-600">
                        {formatCurrency(record.pricePerLiter, 2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="num text-sm text-deep-700">
                        {formatKm(record.currentMileage)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          "num text-sm font-semibold",
                          record.fuelConsumption !== null
                            ? "text-repair-600"
                            : "text-deep-400"
                        )}
                      >
                        {formatConsumption(record.fuelConsumption)}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-deep-600">
                        <MapPin className="w-3.5 h-3.5 text-deep-400 shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {record.gasStation}
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
    </div>
  );
}
