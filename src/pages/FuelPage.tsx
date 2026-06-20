import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Fuel as FuelIcon,
  DollarSign,
  ListPlus,
  ArrowLeft,
  Gauge,
} from "lucide-react";
import { useStore } from "@/store";
import { isSameMonth } from "@/utils/calculations";
import {
  formatCurrency,
  formatLiters,
  monthLabel,
} from "@/utils/formatters";
import KpiCard from "@/components/common/KpiCard";
import FuelForm from "@/components/fuel/FuelForm";
import FuelList from "@/components/fuel/FuelList";

/**
 * 加油管理页面
 * - 路由 /fuel：加油管理主页（统计 + 列表）
 * - 路由 /fuel/new：新增加油表单
 */
export default function FuelPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fuelRecords, filters } = useStore();

  // 判断当前是否为新增页面
  const isNewPage = location.pathname === "/fuel/new";

  // 本月统计数据
  const monthlyStats = useMemo(() => {
    const month = filters.month;
    const monthlyRecords = fuelRecords.filter((r) =>
      isSameMonth(r.fuelDate, month)
    );

    const totalCount = monthlyRecords.length;
    const totalLiters = monthlyRecords.reduce(
      (sum, r) => sum + r.fuelAmount,
      0
    );
    const totalCost = monthlyRecords.reduce((sum, r) => sum + r.fuelCost, 0);

    return { totalCount, totalLiters, totalCost };
  }, [fuelRecords, filters.month]);

  // 新增成功回调
  const handleFormSuccess = () => {
    navigate("/fuel");
  };

  // 返回列表页
  const handleBack = () => {
    navigate("/fuel");
  };

  // 新增表单页面
  if (isNewPage) {
    return (
      <div className="space-y-6">
        {/* 页面头部：返回按钮 + 标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-deep-500 hover:text-deep-700 hover:bg-deep-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-deep-700">新增加油记录</h1>
              <p className="text-sm text-deep-400 mt-0.5">
                填写加油信息，系统自动计算油耗
              </p>
            </div>
          </div>
        </div>

        {/* 表单 */}
        <div className="card p-6 rounded-[12px]">
          <FuelForm onSuccess={handleFormSuccess} onCancel={handleBack} />
        </div>
      </div>
    );
  }

  // 加油管理主页
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-deep-700">加油管理</h1>
          <p className="text-sm text-deep-400 mt-0.5">
            {monthLabel(filters.month)} 加油记录统计
          </p>
        </div>
        <button
          onClick={() => navigate("/fuel/new")}
          className="btn-primary"
        >
          <ListPlus className="w-4 h-4" />
          新增加油
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 本月加油次数 */}
        <KpiCard
          icon={Gauge}
          title="本月加油次数"
          value={`${monthlyStats.totalCount} 次`}
          color="blue"
        />

        {/* 本月加油总量 */}
        <KpiCard
          icon={FuelIcon}
          title="本月加油总量"
          value={formatLiters(monthlyStats.totalLiters)}
          color="green"
        />

        {/* 本月加油总费用 */}
        <KpiCard
          icon={DollarSign}
          title="本月加油总费用"
          value={formatCurrency(monthlyStats.totalCost, 0)}
          color="orange"
        />
      </div>

      {/* 加油记录列表 */}
      <FuelList />
    </div>
  );
}
