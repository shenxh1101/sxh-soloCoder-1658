import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Wrench,
  Fuel,
  MapPin,
  X,
  ArrowRight,
  Send,
  Search,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";
import { useStore } from "@/store";
import type { AnomalyRecord, AnomalyType, AnomalyStatus } from "@/types";
import { formatDate, formatDateTime } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import KpiCard from "@/components/common/KpiCard";
import Badge from "@/components/common/Badge";

const anomalyTypeLabels: Record<AnomalyType, string> = {
  fuel_high: "油耗偏高",
  fuel_mileage: "加油里程异常",
  maintenance_overdue: "维修超期(时间)",
  maintenance_overdue_km: "保养超期(里程)",
  maintenance_super_overdue: "严重超期未保养",
  maintenance_high_cost: "维修费用偏高",
};

const anomalyTypeIcons: Record<AnomalyType, typeof Fuel> = {
  fuel_high: TrendingUp,
  fuel_mileage: Fuel,
  maintenance_overdue: Clock,
  maintenance_overdue_km: Wrench,
  maintenance_super_overdue: AlertTriangle,
  maintenance_high_cost: Wrench,
};

const severityLabels: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const severityColors: Record<string, string> = {
  high: "text-alert-red",
  medium: "text-orange-500",
  low: "text-fuel-500",
};

const severityBgColors: Record<string, string> = {
  high: "bg-alert-red/5",
  medium: "bg-orange-500/5",
  low: "bg-fuel-500/5",
};

const statusLabels: Record<AnomalyStatus, string> = {
  pending: "待处理",
  handling: "处理中",
  resolved: "已解决",
};

const statusBadgeVariants: Record<AnomalyStatus, "danger" | "warning" | "success"> = {
  pending: "danger",
  handling: "warning",
  resolved: "success",
};

export default function AnomaliesPage() {
  const navigate = useNavigate();
  const {
    anomalyRecords,
    vehicles,
    detectAnomalies,
    getAnomalies,
    handleAnomaly,
  } = useStore();

  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<AnomalyStatus | "all">("all");
  const [filterType, setFilterType] = useState<AnomalyType | "all">("all");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyRecord | null>(null);
  const [handleNote, setHandleNote] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    handleDetectAnomalies();
  }, []);

  const handleDetectAnomalies = async () => {
    setIsDetecting(true);
    try {
      detectAnomalies();
    } finally {
      setTimeout(() => setIsDetecting(false), 500);
    }
  };

  const stats = useMemo(() => {
    const pending = anomalyRecords.filter((r) => r.status === "pending").length;
    const handling = anomalyRecords.filter((r) => r.status === "handling").length;
    const resolved = anomalyRecords.filter((r) => r.status === "resolved").length;
    const total = anomalyRecords.length;
    return { pending, handling, resolved, total };
  }, [anomalyRecords]);

  const filteredRecords = useMemo(() => {
    const filters: { vehicleId?: string; status?: AnomalyStatus; type?: AnomalyType } = {};
    if (filterVehicle !== "all") filters.vehicleId = filterVehicle;
    if (filterStatus !== "all") filters.status = filterStatus;
    if (filterType !== "all") filters.type = filterType;

    let records = getAnomalies(filters);

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      records = records.filter(
        (r) =>
          r.plateNumber.toLowerCase().includes(keyword) ||
          r.title.toLowerCase().includes(keyword) ||
          r.description.toLowerCase().includes(keyword)
      );
    }

    return records;
  }, [getAnomalies, filterVehicle, filterStatus, filterType, searchKeyword]);

  const handleViewDetail = (anomaly: AnomalyRecord) => {
    setSelectedAnomaly(anomaly);
    setHandleNote(anomaly.handleNote || "");
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedAnomaly(null);
    setHandleNote("");
  };

  const handleMarkHandling = (id: string) => {
    const confirmed = window.confirm("确认标记为处理中？");
    if (confirmed) {
      handleAnomaly(id, "handling");
    }
  };

  const handleMarkResolved = () => {
    if (!selectedAnomaly) return;
    if (!handleNote.trim()) {
      alert("请填写处理备注");
      return;
    }
    const confirmed = window.confirm("确认标记为已解决？");
    if (confirmed) {
      handleAnomaly(selectedAnomaly.id, "resolved", handleNote.trim());
      handleCloseModal();
    }
  };

  const handleMarkResolvedDirect = (id: string) => {
    const note = prompt("请输入处理备注：");
    if (note === null) return;
    if (!note.trim()) {
      alert("请填写处理备注");
      return;
    }
    handleAnomaly(id, "resolved", note.trim());
  };

  const handleNavigateToRelated = (anomaly: AnomalyRecord) => {
    if (anomaly.relatedRecordType === "fuel") {
      navigate("/fuel");
    } else if (anomaly.relatedRecordType === "maintenance") {
      navigate("/maintenance");
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colorClass = severityColors[severity];
    return (
      <span className={cn("inline-flex items-center gap-1", colorClass)}>
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            severity === "high" && "bg-alert-red",
            severity === "medium" && "bg-orange-500",
            severity === "low" && "bg-fuel-500"
          )}
        />
        <span className="text-sm font-medium">{severityLabels[severity]}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-deep-700">异常中心</h1>
          <p className="text-sm text-deep-400 mt-0.5">
            集中展示车辆运营异常，支持快速追踪和处理
          </p>
        </div>
        <button onClick={handleDetectAnomalies} className="btn-primary" disabled={isDetecting}>
          <RefreshCw className={cn("w-4 h-4", isDetecting && "animate-spin")} />
          检测异常
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={AlertCircle} title="待处理" value={`${stats.pending} 条`} color="red" />
        <KpiCard icon={Clock} title="处理中" value={`${stats.handling} 条`} color="orange" />
        <KpiCard icon={CheckCircle} title="已解决" value={`${stats.resolved} 条`} color="green" />
        <KpiCard icon={AlertTriangle} title="总数" value={`${stats.total} 条`} color="purple" />
      </div>

      <div className="card rounded-[12px] overflow-hidden">
        <div className="p-5 border-b border-deep-50/80 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-alert-red/10 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5 text-alert-red" />
              </div>
              <div>
                <h3 className="section-title !mb-0">异常列表</h3>
                <p className="text-xs text-deep-400 mt-0.5">共 {filteredRecords.length} 条记录</p>
              </div>
            </div>

            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-deep-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索车牌、异常类型、描述..."
                className="input pl-10 pr-4"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-deep-400 shrink-0" />

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

            <div className="flex items-center gap-1.5 bg-deep-50/60 p-1 rounded-lg">
              {(
                [
                  { value: "all", label: "全部状态" },
                  { value: "pending", label: "待处理" },
                  { value: "handling", label: "处理中" },
                  { value: "resolved", label: "已解决" },
                ] as { value: AnomalyStatus | "all"; label: string }[]
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

            <div className="flex items-center gap-1.5 bg-deep-50/60 p-1 rounded-lg">
              {(
                [
                  { value: "all", label: "全部类型" },
                  { value: "fuel_high", label: "油耗偏高" },
                  { value: "fuel_mileage", label: "加油里程异常" },
                  { value: "maintenance_overdue", label: "维修超期(时间)" },
                  { value: "maintenance_overdue_km", label: "保养超期(里程)" },
                  { value: "maintenance_super_overdue", label: "严重超期未保养" },
                  { value: "maintenance_high_cost", label: "维修费用偏高" },
                ] as { value: AnomalyType | "all"; label: string }[]
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-deep-50/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  检测时间
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  车牌
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  异常类型
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  严重程度
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  状态
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider">
                  描述
                </th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-deep-50">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center">
                        <Filter className="w-8 h-8 text-deep-300" />
                      </div>
                      <p className="text-deep-500 font-medium">暂无异常记录</p>
                      <p className="text-sm text-deep-400">
                        {searchKeyword ||
                        filterType !== "all" ||
                        filterStatus !== "all" ||
                        filterVehicle !== "all"
                          ? "请尝试其他筛选条件"
                          : "点击上方检测异常按钮开始检测"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const TypeIcon = anomalyTypeIcons[record.type];
                  return (
                    <tr
                      key={record.id}
                      className={cn(
                        "hover:bg-deep-50/40 transition-colors cursor-pointer",
                        severityBgColors[record.severity]
                      )}
                      onClick={() => handleViewDetail(record)}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-deep-700">
                          {formatDate(record.detectedAt)}
                        </p>
                        <p className="text-xs text-deep-400 mt-0.5">
                          {formatDateTime(record.detectedAt).split(" ")[1]}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-deep-50 text-deep-700 text-sm font-medium tracking-wider">
                          {record.plateNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <TypeIcon
                            className={cn(
                              "w-4 h-4",
                              record.severity === "high" && "text-alert-red",
                              record.severity === "medium" && "text-orange-500",
                              record.severity === "low" && "text-fuel-500"
                            )}
                          />
                          <span className="text-sm font-medium text-deep-700">
                            {anomalyTypeLabels[record.type]}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getSeverityBadge(record.severity)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant={statusBadgeVariants[record.status]}>
                          {statusLabels[record.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-deep-700 line-clamp-2 max-w-[300px]">
                          {record.description}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleViewDetail(record)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-deep-500/10 text-deep-600 text-xs font-medium hover:bg-deep-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            详情
                          </button>
                          {record.status === "pending" && (
                            <button
                              onClick={() => handleMarkHandling(record.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-medium hover:bg-orange-500/20 transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              处理中
                            </button>
                          )}
                          {record.status !== "resolved" && (
                            <button
                              onClick={() => handleMarkResolvedDirect(record.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-fuel-500/10 text-fuel-600 text-xs font-medium hover:bg-fuel-500/20 transition-colors"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              已解决
                            </button>
                          )}
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

      {showDetailModal && selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-deep-50">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    selectedAnomaly.severity === "high" && "bg-alert-red/10",
                    selectedAnomaly.severity === "medium" && "bg-orange-500/10",
                    selectedAnomaly.severity === "low" && "bg-fuel-500/10"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "w-5 h-5",
                      selectedAnomaly.severity === "high" && "text-alert-red",
                      selectedAnomaly.severity === "medium" && "text-orange-500",
                      selectedAnomaly.severity === "low" && "text-fuel-500"
                    )}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-deep-700">异常详情</h3>
                  <p className="text-xs text-deep-400 mt-0.5">
                    {selectedAnomaly.plateNumber}
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

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-deep-50/60">
                  <p className="text-xs text-deep-500 mb-1">异常类型</p>
                  <p className="text-sm font-medium text-deep-700">
                    {anomalyTypeLabels[selectedAnomaly.type]}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-deep-50/60">
                  <p className="text-xs text-deep-500 mb-1">严重程度</p>
                  {getSeverityBadge(selectedAnomaly.severity)}
                </div>
                <div className="p-4 rounded-xl bg-deep-50/60">
                  <p className="text-xs text-deep-500 mb-1">状态</p>
                  <Badge variant={statusBadgeVariants[selectedAnomaly.status]}>
                    {statusLabels[selectedAnomaly.status]}
                  </Badge>
                </div>
                <div className="p-4 rounded-xl bg-deep-50/60">
                  <p className="text-xs text-deep-500 mb-1">检测时间</p>
                  <p className="text-sm font-medium text-deep-700">
                    {formatDateTime(selectedAnomaly.detectedAt)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-deep-50/60">
                <p className="text-xs text-deep-500 mb-2">异常描述</p>
                <p className="text-sm text-deep-700">{selectedAnomaly.description}</p>
              </div>

              {selectedAnomaly.value !== undefined &&
                selectedAnomaly.threshold !== undefined && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-deep-50/60">
                      <p className="text-xs text-deep-500 mb-1">当前值</p>
                      <p className="text-sm font-medium text-deep-700">
                        {selectedAnomaly.value.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-deep-50/60">
                      <p className="text-xs text-deep-500 mb-1">阈值</p>
                      <p className="text-sm font-medium text-deep-700">
                        {selectedAnomaly.threshold.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

              {selectedAnomaly.relatedRecordId && (
                <div className="p-4 rounded-xl bg-orange-50/60">
                  <p className="text-xs text-deep-500 mb-2">关联记录</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedAnomaly.relatedRecordType === "fuel" ? (
                        <Fuel className="w-4 h-4 text-fuel-500" />
                      ) : (
                        <Wrench className="w-4 h-4 text-repair-500" />
                      )}
                      <span className="text-sm text-deep-700">
                        {selectedAnomaly.relatedRecordType === "fuel"
                          ? "加油记录"
                          : "维修记录"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleNavigateToRelated(selectedAnomaly)}
                      className="inline-flex items-center gap-1 text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
                    >
                      查看
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {selectedAnomaly.handledAt && (
                <div className="p-4 rounded-xl bg-fuel-50/60">
                  <p className="text-xs text-deep-500 mb-2">处理信息</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-deep-500">处理人</span>
                      <span className="text-sm font-medium text-deep-700">
                        {selectedAnomaly.handledBy}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-deep-500">处理时间</span>
                      <span className="text-sm font-medium text-deep-700">
                        {formatDateTime(selectedAnomaly.handledAt)}
                      </span>
                    </div>
                    {selectedAnomaly.handleNote && (
                      <div>
                        <span className="text-sm text-deep-500">处理备注</span>
                        <p className="text-sm text-deep-700 mt-1">
                          {selectedAnomaly.handleNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedAnomaly.status !== "resolved" && (
                <div>
                  <label className="label">处理备注</label>
                  <textarea
                    value={handleNote}
                    onChange={(e) => setHandleNote(e.target.value)}
                    placeholder="请填写处理备注..."
                    rows={4}
                    className="input resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={handleCloseModal} className="btn-secondary">
                  <X className="w-4 h-4" />
                  关闭
                </button>
                {selectedAnomaly.status === "pending" && (
                  <button
                    onClick={() => {
                      handleMarkHandling(selectedAnomaly.id);
                      handleCloseModal();
                    }}
                    className="btn-secondary"
                  >
                    <Clock className="w-4 h-4" />
                    标记处理中
                  </button>
                )}
                {selectedAnomaly.status !== "resolved" && (
                  <button
                    onClick={handleMarkResolved}
                    className="btn-primary"
                    disabled={!handleNote.trim()}
                  >
                    <Send className="w-4 h-4" />
                    标记已解决
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
