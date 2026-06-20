import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Wrench,
  DollarSign,
  ListPlus,
  ArrowLeft,
  Clock,
  BarChart3,
} from "lucide-react";
import { useStore } from "@/store";
import { isSameMonth } from "@/utils/calculations";
import {
  formatCurrency,
  monthLabel,
} from "@/utils/formatters";
import KpiCard from "@/components/common/KpiCard";
import MaintenanceForm from "@/components/maintenance/MaintenanceForm";
import MaintenanceList from "@/components/maintenance/MaintenanceList";

/**
 * 维修管理页面
 * - 路由 /maintenance：维修管理主页（统计 + 列表）
 * - 路由 /maintenance/new：新增维修申请表单
 */
export default function MaintenancePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { maintenanceRecords, filters } = useStore();

  // 判断当前是否为新增页面
  const isNewPage = location.pathname === "/maintenance/new";

  // 统计数据
  const stats = useMemo(() => {
    const month = filters.month;

    // 累计维修次数（已完成）
    const totalCompleted = maintenanceRecords.filter(
      (r) => r.status === "completed"
    ).length;

    // 本月维修费用（已完成）
    const monthlyCost = maintenanceRecords
      .filter(
        (r) => r.status === "completed" && isSameMonth(r.finishDate, month)
      )
      .reduce((sum, r) => sum + r.cost, 0);

    // 待处理申请数
    const pendingCount = maintenanceRecords.filter(
      (r) => r.status === "pending"
    ).length;

    // 平均单次费用（已完成）
    const completedRecords = maintenanceRecords.filter(
      (r) => r.status === "completed"
    );
    const avgCost =
      completedRecords.length > 0
        ? completedRecords.reduce((sum, r) => sum + r.cost, 0) /
          completedRecords.length
        : 0;

    return { totalCompleted, monthlyCost, pendingCount, avgCost };
  }, [maintenanceRecords, filters.month]);

  // 新增成功回调
  const handleFormSuccess = () => {
    navigate("/maintenance");
  };

  // 返回列表页
  const handleBack = () => {
    navigate("/maintenance");
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
              <h1 className="text-xl font-bold text-deep-700">新增维修申请</h1>
              <p className="text-sm text-deep-400 mt-0.5">
                提交维修申请，完成后请回填维修信息
              </p>
            </div>
          </div>
        </div>

        {/* 表单 */}
        <div className="card p-6 rounded-[12px]">
          <MaintenanceForm
            mode="apply"
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
          />
        </div>
      </div>
    );
  }

  // 维修管理主页
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-deep-700">维修管理</h1>
          <p className="text-sm text-deep-400 mt-0.5">
            {monthLabel(filters.month)} 维修记录统计
          </p>
        </div>
        <button
          onClick={() => navigate("/maintenance/new")}
          className="btn-primary"
        >
          <ListPlus className="w-4 h-4" />
          新增维修
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 累计维修次数 */}
        <KpiCard
          icon={Wrench}
          title="累计维修次数"
          value={`${stats.totalCompleted} 次`}
          color="purple"
        />

        {/* 本月维修费用 */}
        <KpiCard
          icon={DollarSign}
          title="本月维修费用"
          value={formatCurrency(stats.monthlyCost, 0)}
          color="orange"
        />

        {/* 待处理申请数 */}
        <KpiCard
          icon={Clock}
          title="待处理申请数"
          value={`${stats.pendingCount} 单`}
          color="red"
        />

        {/* 平均单次费用 */}
        <KpiCard
          icon={BarChart3}
          title="平均单次费用"
          value={formatCurrency(stats.avgCost, 0)}
          color="blue"
        />
      </div>

      {/* 维修记录列表 */}
      <MaintenanceList />
    </div>
  );
}
