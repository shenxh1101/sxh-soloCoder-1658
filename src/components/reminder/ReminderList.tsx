import { useState } from "react";
import {
  Truck,
  User,
  Phone,
  MapPin,
  Route,
  AlertTriangle,
  CheckCircle2,
  Edit,
  X,
  Bell,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { MaintenanceAlert } from "@/types";
import { useStore } from "@/store";
import { formatKm } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import ReminderRuleForm from "./ReminderRuleForm";

interface ReminderListProps {
  alerts: MaintenanceAlert[];
}

/**
 * 待保养车辆列表组件
 * - 展示保养提醒警报列表
 * - 剩余里程根据阈值显示不同颜色背景
 * - 提供"已完成保养"和"编辑规则"操作
 */
export default function ReminderList({ alerts }: ReminderListProps) {
  const { getVehicleById, markMaintenanceDone } = useStore();

  // 弹窗状态
  const [showEditModal, setShowEditModal] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<string | null>(null);

  // 打开编辑规则弹窗
  const handleOpenEdit = (vehicleId: string) => {
    setEditVehicleId(vehicleId);
    setShowEditModal(true);
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditVehicleId(null);
  };

  // 标记保养已完成
  const handleMarkDone = (alert: MaintenanceAlert) => {
    const confirmed = window.confirm(
      `确认 ${alert.plate} 已完成保养？\n\n将更新上次保养里程为：${formatKm(alert.currentMileage)}`
    );
    if (confirmed) {
      markMaintenanceDone(alert.vehicleId, alert.currentMileage);
    }
  };

  // 级别配置
  const levelConfig = {
    safe: {
      rowBg: "bg-fuel-500/5 hover:bg-fuel-500/10",
      cellBg: "bg-fuel-500/10 text-fuel-600",
      badge: "bg-fuel-50 text-fuel-600 border-fuel-200",
      icon: <Clock className="w-4 h-4" />,
      label: "正常",
    },
    warning: {
      rowBg: "bg-alert-yellow/5 hover:bg-alert-yellow/10",
      cellBg: "bg-alert-yellow/15 text-alert-yellow",
      badge: "bg-alert-yellow/15 text-alert-yellow border-alert-yellow/30",
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "预警",
    },
    danger: {
      rowBg: "bg-alert-red/5 hover:bg-alert-red/10",
      cellBg: "bg-alert-red/15 text-alert-red",
      badge: "bg-alert-red/10 text-alert-red border-alert-red/20",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "警报",
    },
  };

  // 按级别分组统计
  const stats = {
    danger: alerts.filter((a) => a.level === "danger").length,
    warning: alerts.filter((a) => a.level === "warning").length,
    safe: alerts.filter((a) => a.level === "safe").length,
  };

  return (
    <div className="card rounded-[12px] overflow-hidden">
      {/* 顶部 */}
      <div className="p-5 border-b border-deep-50/80">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <h3 className="section-title !mb-0">保养提醒</h3>
              <p className="text-xs text-deep-400 mt-0.5">
                共 {alerts.length} 辆车需要关注
              </p>
            </div>
          </div>

          {/* 统计徽章 */}
          <div className="flex items-center gap-2">
            {stats.danger > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-alert-red/10 text-alert-red text-sm font-medium border border-alert-red/20">
                <AlertCircle className="w-4 h-4" />
                警报 {stats.danger}
              </span>
            )}
            {stats.warning > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-alert-yellow/15 text-alert-yellow text-sm font-medium border border-alert-yellow/30">
                <AlertTriangle className="w-4 h-4" />
                预警 {stats.warning}
              </span>
            )}
            {stats.safe > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fuel-50 text-fuel-600 text-sm font-medium border border-fuel-200">
                <Clock className="w-4 h-4" />
                正常 {stats.safe}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-deep-50/40">
              <th className="px-5 py-3 text-left text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                状态
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
                  <MapPin className="w-3.5 h-3.5" />
                  当前里程
                </span>
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1 justify-end">
                  <Route className="w-3.5 h-3.5" />
                  下次保养
                </span>
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                <span className="flex items-center gap-1 justify-center">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  剩余里程
                </span>
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-deep-500 uppercase tracking-wider whitespace-nowrap">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-deep-50">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-fuel-50 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-fuel-400" />
                    </div>
                    <p className="text-deep-500 font-medium">暂无保养提醒</p>
                    <p className="text-sm text-deep-400">
                      所有车辆保养状态良好
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              alerts.map((alert) => {
                const config = levelConfig[alert.level];
                const vehicle = getVehicleById(alert.vehicleId);
                const isOverdue = alert.remaining < 0;

                return (
                  <tr
                    key={alert.vehicleId}
                    className={cn("transition-colors", config.rowBg)}
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={cn("badge border", config.badge)}
                      >
                        {config.icon}
                        {isOverdue ? "超期" : config.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-deep-500 to-deep-600 flex items-center justify-center text-xl shrink-0">
                          🚚
                        </div>
                        <div>
                          <p className="text-sm font-bold text-deep-700 tracking-wider">
                            {alert.plate}
                          </p>
                          {vehicle && (
                            <p className="text-xs text-deep-400 mt-0.5 truncate max-w-[120px]">
                              {vehicle.model}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {alert.driverName?.charAt(0) || "司"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-deep-700">
                            {alert.driverName || "--"}
                          </p>
                          {vehicle && (
                            <a
                              href={`tel:${vehicle.driverPhone}`}
                              className="text-xs text-deep-400 hover:text-orange-500 flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3" />
                              {vehicle.driverPhone || "--"}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="num text-sm font-semibold text-deep-700">
                        {formatKm(alert.currentMileage)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="num text-sm font-medium text-deep-600">
                        {formatKm(alert.nextKm)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg num text-sm font-bold",
                          config.cellBg
                        )}
                      >
                        {isOverdue ? (
                          <>
                            <span>超期</span>
                            <span>{formatKm(Math.abs(alert.remaining))}</span>
                          </>
                        ) : alert.remaining < 500 ? (
                          <>
                            <span className="animate-pulse">!</span>
                            <span>{formatKm(alert.remaining)}</span>
                          </>
                        ) : (
                          <span>{formatKm(alert.remaining)}</span>
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleMarkDone(alert)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-sm",
                            "bg-fuel-500 text-white hover:bg-fuel-600"
                          )}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          已完成保养
                        </button>
                        <button
                          onClick={() => handleOpenEdit(alert.vehicleId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-deep-600 border border-deep-100 hover:bg-deep-50 transition-colors shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          编辑规则
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 编辑规则弹窗 */}
      {showEditModal && editVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-5 border-b border-deep-50 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-deep-700">
                    编辑保养规则
                  </h3>
                  <p className="text-xs text-deep-400 mt-0.5">
                    调整保养间隔和预警参数
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
              <ReminderRuleForm
                vehicleId={editVehicleId}
                onSuccess={handleCloseModal}
                onCancel={handleCloseModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
