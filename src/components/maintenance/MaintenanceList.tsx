import { useState, useMemo } from "react";
import {
  Search,
  Wrench,
  Truck,
  Filter,
  CheckCircle2,
  X,
  Clock,
  DollarSign,
  MapPin,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Send,
} from "lucide-react";
import { useStore } from "@/store";
import type { MaintenanceType, MaintenanceStatus } from "@/types";
import {
  formatDate,
  formatCurrency,
  formatKm,
  maintenanceTypeLabel,
  maintenanceStatusLabel,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";
import MaintenanceForm from "./MaintenanceForm";

interface MaintenanceListProps {
  vehicleId?: string;
}

/**
 * 维修记录列表组件
 * - 表格展示所有维修记录
 * - 支持按类型、车牌、状态筛选
 * - pending 状态提供"完成维修"按钮
 */
export default function MaintenanceList({ vehicleId }: MaintenanceListProps) {
  const { maintenanceRecords, vehicles, getVehicleById } = useStore();

  // 筛选状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterType, setFilterType] = useState<MaintenanceType | "all">("all");
  const [filterStatus, setFilterStatus] =
    useState<MaintenanceStatus | "all">("all");
  const [filterVehicle, setFilterVehicle] = useState<string>(vehicleId || "all");

  // 弹窗状态
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<
    string | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");

  // 过滤和排序记录
  const filteredRecords = useMemo(() => {
    let records = [...maintenanceRecords];

    // 按车辆过滤（prop 优先）
    if (vehicleId) {
      records = records.filter((r) => r.vehicleId === vehicleId);
    } else if (filterVehicle !== "all") {
      records = records.filter((r) => r.vehicleId === filterVehicle);
    }

    // 类型筛选
    if (filterType !== "all") {
      records = records.filter((r) => r.type === filterType);
    }

    // 状态筛选
    if (filterStatus !== "all") {
      records = records.filter((r) => r.status === filterStatus);
    }

    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      records = records.filter((r) => {
        const vehicle = getVehicleById(r.vehicleId);
        return (
          vehicle?.plateNumber.toLowerCase().includes(keyword) ||
          vehicle?.model.toLowerCase().includes(keyword) ||
          r.description.toLowerCase().includes(keyword) ||
          r.workshop.toLowerCase().includes(keyword)
        );
      });
    }

    // 按状态优先级和日期排序
    const statusOrder: Record<string, number> = {
      pending_approval: 0,
      pending: 1,
      rejected: 2,
      completed: 3,
    };
    return records.sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;

      const dateA = a.status === "completed" ? a.finishDate : a.applyDate;
      const dateB = b.status === "completed" ? b.finishDate : b.applyDate;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [
    maintenanceRecords,
    vehicleId,
    filterVehicle,
    filterType,
    filterStatus,
    searchKeyword,
    getVehicleById,
  ]);

  // 类型徽章颜色
  const typeBadgeClass: Record<MaintenanceType, string> = {
    routine: "bg-fuel-50 text-fuel-600 border-fuel-200",
    fault: "bg-alert-red/10 text-alert-red border-alert-red/20",
    overhaul: "bg-repair-50 text-repair-600 border-repair-200",
  };

  // 打开完成维修弹窗
  const handleOpenComplete = (id: string) => {
    setSelectedMaintenanceId(id);
    setShowCompleteModal(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setShowCompleteModal(false);
    setSelectedMaintenanceId(null);
  };

  // 完成成功回调
  const handleCompleteSuccess = () => {
    handleCloseModal();
  };

  // 审批通过
  const handleApprove = (id: string) => {
    const confirmed = window.confirm("确认通过此维修申请？通过后将进入待处理状态。");
    if (!confirmed) return;
    useStore.getState().approveMaintenance(id);
  };

  // 打开驳回弹窗
  const handleOpenReject = (id: string) => {
    setSelectedMaintenanceId(id);
    setRejectReason("");
    setShowRejectModal(true);
  };

  // 关闭驳回弹窗
  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setSelectedMaintenanceId(null);
    setRejectReason("");
  };

  // 执行驳回
  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert("请填写驳回原因");
      return;
    }
    if (selectedMaintenanceId) {
      useStore.getState().rejectMaintenance(selectedMaintenanceId, rejectReason.trim());
      handleCloseRejectModal();
    }
  };

  // 汇总统计更新：包含待审批和已驳回
  const summary = useMemo(() => {
    const pendingApproval = filteredRecords.filter((r) => r.status === "pending_approval").length;
    const rejected = filteredRecords.filter((r) => r.status === "rejected").length;
    const pending = filteredRecords.filter((r) => r.status === "pending").length;
    const completed = filteredRecords.filter(
      (r) => r.status === "completed"
    ).length;
    const totalCost = filteredRecords
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + r.cost, 0);
    return { pendingApproval, rejected, pending, completed, totalCost, total: filteredRecords.length };
  }, [filteredRecords]);

  return (
    <div className="card rounded-[12px] overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="p-5 border-b border-deep-50/80 space-y-4">
        {/* 标题和搜索 */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-repair-50 flex items-center justify-center">
              <Wrench className="w-4.5 h-4.5 text-repair-500" />
            </div>
            <div>
              <h3 className="section-title !mb-0">维修记录</h3>
              <p className="text-xs text-deep-400 mt-0.5">
                共 {summary.total} 条 ·{" "}
                <span className="text-deep-500 font-medium">
                  待审批 {summary.pendingApproval}
                </span>{" "}
                ·{" "}
                <span className="text-alert-red font-medium">
                  已驳回 {summary.rejected}
                </span>{" "}
                ·{" "}
                <span className="text-alert-yellow font-medium">
                  待处理 {summary.pending}
                </span>{" "}
                ·{" "}
                <span className="text-fuel-600 font-medium">
                  已完成 {summary.completed}
                </span>
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
              placeholder="搜索车牌、维修厂、描述..."
              className="input pl-10 pr-4"
            />
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-deep-400 shrink-0" />

          {/* 车牌筛选（非指定车辆时显示） */}
          {!vehicleId && (
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className="input !w-auto !py-2 text-sm min-w-[160px]"
            >
              <option value="all">全部车辆</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber}
                </option>
              ))}
            </select>
          )}

          {/* 类型筛选 */}
          <div className="flex items-center gap-1.5 bg-deep-50/60 p-1 rounded-lg">
            {(
              [
                { value: "all", label: "全部类型" },
                { value: "routine", label: "常规保养" },
                { value: "fault", label: "故障维修" },
                { value: "overhaul", label: "大修" },
              ] as { value: MaintenanceType | "all"; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  filterType === opt.value
                    ? "bg-white text-deep-700 shadow-sm"
                    : "text-deep-500 hover:text-deep-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-1.5 bg-deep-50/60 p-1 rounded-lg">
            {(
              [
                { value: "all", label: "全部状态" },
                { value: "pending", label: "待处理" },
                { value: "completed", label: "已完成" },
              ] as { value: MaintenanceStatus | "all"; label: string }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  filterStatus === opt.value
                    ? "bg-white text-deep-700 shadow-sm"
                    : "text-deep-500 hover:text-deep-700"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 总费用 */}
          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50">
            <DollarSign className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-deep-600">累计费用</span>
            <span className="num text-lg font-bold text-orange-600">
              {formatCurrency(summary.totalCost, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-deep-50/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                日期
              </th>
              {!vehicleId && (
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    车牌
                  </span>
                </th>
              )}
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                类型
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider">
                描述
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  维修厂
                </span>
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                费用
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                里程
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                状态
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-deep-50">
            {filteredRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={vehicleId ? 8 : 9}
                  className="px-5 py-16 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center">
                      <Filter className="w-8 h-8 text-deep-300" />
                    </div>
                    <p className="text-deep-500 font-medium">暂无维修记录</p>
                    <p className="text-sm text-deep-400">
                      {searchKeyword ||
                      filterType !== "all" ||
                      filterStatus !== "all" ||
                      filterVehicle !== "all"
                        ? "请尝试其他筛选条件"
                        : "新增一条维修申请吧"}
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
                      record.status === "pending" && "bg-alert-yellow/5",
                      index % 2 === 1 &&
                        record.status !== "pending" &&
                        "bg-deep-50/20"
                    )}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-deep-700">
                        {formatDate(
                          record.status === "completed"
                            ? record.finishDate || record.applyDate
                            : record.applyDate
                        )}
                      </p>
                      {record.status === "completed" && record.applyDate !== record.finishDate && (
                        <p className="text-xs text-deep-400 mt-0.5">
                          申请 {formatDate(record.applyDate)}
                        </p>
                      )}
                    </td>
                    {!vehicleId && (
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-deep-50 text-deep-700 text-sm font-medium tracking-wider">
                          {vehicle?.plateNumber || "--"}
                        </span>
                      </td>
                    )}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "badge border",
                          typeBadgeClass[record.type]
                        )}
                      >
                        {maintenanceTypeLabel(record.type)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-deep-700 line-clamp-2 max-w-[240px]">
                        {record.description}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-deep-600">
                        <MapPin className="w-3.5 h-3.5 text-deep-400 shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {record.workshop}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {record.status === "completed" ? (
                        <span className="num text-sm font-semibold text-orange-600">
                          {formatCurrency(record.cost, 0)}
                        </span>
                      ) : (
                        <span className="text-sm text-deep-400">待结算</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {record.status === "completed" && record.mileageAfter > 0 ? (
                        <span className="num text-sm text-deep-700">
                          {formatKm(record.mileageAfter)}
                        </span>
                      ) : (
                        <span className="text-sm text-deep-400">--</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {record.status === "pending_approval" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-deep-50 text-deep-600 text-xs font-medium border border-deep-200">
                          <Clock className="w-3 h-3" />
                          {maintenanceStatusLabel(record.status)}
                        </span>
                      )}
                      {record.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-alert-red/20 text-alert-red text-xs font-medium">
                          <X className="w-3 h-3" />
                          {maintenanceStatusLabel(record.status)}
                        </span>
                      )}
                      {record.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-alert-yellow/20 text-alert-yellow text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          {maintenanceStatusLabel(record.status)}
                        </span>
                      )}
                      {record.status === "completed" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-fuel-50 text-fuel-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          {maintenanceStatusLabel(record.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {record.status === "pending_approval" && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(record.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-fuel-500 text-white text-xs font-medium hover:bg-fuel-600 transition-colors"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            通过
                          </button>
                          <button
                            onClick={() => handleOpenReject(record.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-alert-red text-white text-xs font-medium hover:bg-alert-red/80 transition-colors"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            驳回
                          </button>
                        </div>
                      )}
                      {record.status === "pending" && (
                        <button
                          onClick={() => handleOpenComplete(record.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuel-500 text-white text-xs font-medium hover:bg-fuel-600 transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          完成维修
                        </button>
                      )}
                      {(record.status === "completed" || record.status === "rejected") && (
                        <span className="text-xs text-deep-400">--</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 完成维修弹窗 */}
      {showCompleteModal && selectedMaintenanceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-5 border-b border-deep-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-fuel-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-fuel-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-deep-700">
                    完成维修
                  </h3>
                  <p className="text-xs text-deep-400 mt-0.5">
                    请填写维修完成信息
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-deep-400 hover:text-deep-600 hover:bg-deep-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-5">
              <MaintenanceForm
                mode="complete"
                maintenanceId={selectedMaintenanceId}
                onSuccess={handleCompleteSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* 驳回原因弹窗 */}
      {showRejectModal && selectedMaintenanceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-5 border-b border-deep-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-alert-red/10 flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-alert-red" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-deep-700">
                    驳回维修申请
                  </h3>
                  <p className="text-xs text-deep-400 mt-0.5">
                    请填写驳回原因，司机将能看到
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseRejectModal}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-deep-400 hover:text-deep-600 hover:bg-deep-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单内容 */}
            <div className="p-5 space-y-4">
              <div>
                <label className="label">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-alert-red" />
                  驳回原因 <span className="text-alert-red">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请详细说明驳回原因，例如：建议先检查XXX，无需立即维修..."
                  rows={4}
                  className="input resize-none"
                  autoFocus
                />
                {!rejectReason.trim() && (
                  <p className="mt-1 text-xs text-alert-red">请填写驳回原因</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={handleCloseRejectModal}
                  className="btn-secondary"
                >
                  <X className="w-4 h-4" />
                  取消
                </button>
                <button
                  onClick={handleReject}
                  className="btn-primary bg-alert-red hover:bg-alert-red/90"
                  disabled={!rejectReason.trim()}
                >
                  <Send className="w-4 h-4" />
                  确认驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
