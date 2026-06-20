import { useMemo } from "react";
import {
  Wrench,
  AlertTriangle,
  Settings,
  DollarSign,
  MapPin,
  Clock,
  History,
} from "lucide-react";
import { useStore } from "@/store";
import type { MaintenanceType } from "@/types";
import {
  formatDate,
  formatCurrency,
  formatKm,
  maintenanceTypeLabel,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface MaintenanceTimelineProps {
  vehicleId: string;
}

/**
 * 维修历史时间线组件
 * - 垂直时间线展示，按时间倒序排列
 * - 节点圆点按维修类型变色
 */
export default function MaintenanceTimeline({
  vehicleId,
}: MaintenanceTimelineProps) {
  const { getMaintenanceRecordsByVehicle } = useStore();

  const records = useMemo(
    () => getMaintenanceRecordsByVehicle(vehicleId),
    [getMaintenanceRecordsByVehicle, vehicleId]
  );

  // 类型颜色映射
  const typeConfig: Record<
    MaintenanceType,
    { dot: string; badge: string; icon: React.ReactNode; label: string }
  > = {
    routine: {
      dot: "bg-fuel-500",
      badge: "bg-fuel-50 text-fuel-600 border-fuel-200",
      icon: <Wrench className="w-3.5 h-3.5" />,
      label: "常规保养",
    },
    fault: {
      dot: "bg-alert-red",
      badge: "bg-alert-red/10 text-alert-red border-alert-red/20",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      label: "故障维修",
    },
    overhaul: {
      dot: "bg-repair-500",
      badge: "bg-repair-50 text-repair-600 border-repair-200",
      icon: <Settings className="w-3.5 h-3.5" />,
      label: "大修",
    },
  };

  if (records.length === 0) {
    return (
      <div className="card p-10 rounded-[12px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-deep-50 flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-deep-300" />
        </div>
        <p className="text-deep-500 font-medium mb-1">暂无维修记录</p>
        <p className="text-sm text-deep-400">该车辆还没有维修或保养记录</p>
      </div>
    );
  }

  return (
    <div className="card p-6 rounded-[12px]">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-repair-50 flex items-center justify-center">
            <History className="w-4.5 h-4.5 text-repair-500" />
          </div>
          <div>
            <h3 className="section-title !mb-0">维修历史</h3>
            <p className="text-xs text-deep-400 mt-0.5">
              共 {records.length} 条记录，按时间倒序
            </p>
          </div>
        </div>
      </div>

      {/* 时间线 */}
      <div className="relative">
        {/* 左侧时间线竖线 */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-deep-100" />

        <div className="space-y-6">
          {records.map((record, index) => {
            const config = typeConfig[record.type];
            const isLast = index === records.length - 1;

            return (
              <div key={record.id} className="relative pl-12">
                {/* 时间节点圆点 */}
                <div
                  className={cn(
                    "absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-md z-10",
                    config.dot
                  )}
                >
                  <div className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white">
                      {config.icon}
                    </span>
                  </div>
                </div>

                {/* 节点内容卡片 */}
                <div
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    record.status === "completed"
                      ? "bg-white border-deep-100"
                      : "bg-alert-yellow/5 border-alert-yellow/30",
                    !isLast && ""
                  )}
                >
                  {/* 头部：类型徽章 + 日期 + 状态 */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "badge border",
                          config.badge
                        )}
                      >
                        {config.icon}
                        {maintenanceTypeLabel(record.type)}
                      </span>

                      {record.status === "pending" ? (
                        <span className="badge bg-alert-yellow/20 text-alert-yellow border border-alert-yellow/30">
                          <Clock className="w-3 h-3 mr-1" />
                          待处理
                        </span>
                      ) : (
                        <span className="badge bg-fuel-50 text-fuel-600 border border-fuel-100">
                          已完成
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-deep-700">
                        {record.status === "completed"
                          ? formatDate(record.finishDate || record.applyDate)
                          : formatDate(record.applyDate)}
                      </p>
                      {record.status === "completed" && record.applyDate && (
                        <p className="text-xs text-deep-400 mt-0.5">
                          申请：{formatDate(record.applyDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 描述 */}
                  <p className="text-sm text-deep-600 mb-3 leading-relaxed">
                    {record.description}
                  </p>

                  {/* 详细信息 */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-deep-50">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-deep-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-deep-400">维修厂</p>
                        <p className="text-sm font-medium text-deep-700 truncate">
                          {record.workshop}
                        </p>
                      </div>
                    </div>

                    {record.status === "completed" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <div>
                            <p className="text-xs text-deep-400">维修费用</p>
                            <p className="num text-sm font-semibold text-orange-600">
                              {formatCurrency(record.cost, 0)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-repair-500 shrink-0" />
                          <div>
                            <p className="text-xs text-deep-400">维修后里程</p>
                            <p className="num text-sm font-semibold text-repair-600">
                              {record.mileageAfter > 0
                                ? formatKm(record.mileageAfter)
                                : "--"}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 col-span-2">
                          <Clock className="w-3.5 h-3.5 text-alert-yellow shrink-0" />
                          <div>
                            <p className="text-xs text-deep-400">等待完成</p>
                            <p className="text-sm font-medium text-alert-yellow">
                              维修完成后请回填费用和里程信息
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 备注 */}
                  {record.notes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-deep-50/60">
                      <p className="text-xs text-deep-500 mb-0.5">备注</p>
                      <p className="text-sm text-deep-600">{record.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
