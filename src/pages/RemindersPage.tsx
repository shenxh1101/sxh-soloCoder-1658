import { useMemo, useState } from "react";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Clock,
  Settings,
  Info,
  Save,
  Route,
  MapPin,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { formatKm } from "@/utils/formatters";
import ReminderList from "@/components/reminder/ReminderList";

/**
 * 保养提醒页面
 * - 全局规则设置（批量应用到所有车辆）
 * - 提醒概览统计
 * - 保养提醒列表
 * - 颜色分级说明
 */
export default function RemindersPage() {
  const {
    vehicles,
    getMaintenanceAlerts,
    updateMaintenanceRule,
    maintenanceRules,
  } = useStore();

  // 获取保养提醒数据
  const alerts = useMemo(() => getMaintenanceAlerts(), [getMaintenanceAlerts]);

  // 提醒概览统计
  const overviewStats = useMemo(() => {
    const danger = alerts.filter((a) => a.level === "danger").length;
    const warning = alerts.filter((a) => a.level === "warning").length;
    const safe = alerts.filter((a) => a.level === "safe").length;
    return { danger, warning, safe, total: alerts.length };
  }, [alerts]);

  // 全局规则表单状态
  const [globalRule, setGlobalRule] = useState({
    intervalKm: 5000,
    warningThreshold: 1000,
    enabled: true,
  });

  const [applySuccess, setApplySuccess] = useState(false);

  // 批量应用全局规则到所有车辆
  const handleApplyGlobalRule = () => {
    const confirmed = window.confirm(
      `确认将此规则应用到全部 ${vehicles.length} 辆车？\n\n` +
        `保养间隔：${formatKm(globalRule.intervalKm)}\n` +
        `预警阈值：${formatKm(globalRule.warningThreshold)}\n` +
        `启用提醒：${globalRule.enabled ? "是" : "否"}\n\n` +
        `注意：此操作将覆盖所有车辆的现有规则，上次保养里程将保留不变。`
    );

    if (!confirmed) return;

    vehicles.forEach((v) => {
      const existingRule = maintenanceRules.find(
        (r) => r.vehicleId === v.id
      );
      updateMaintenanceRule(v.id, {
        intervalKm: globalRule.intervalKm,
        warningThreshold: globalRule.warningThreshold,
        enabled: globalRule.enabled,
        // 如果已有规则，保留 lastMaintenanceKm
        ...(existingRule
          ? {}
          : { lastMaintenanceKm: v.initialMileage }),
      });
    });

    // 显示成功提示
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 3000);
  };

  // 快速设置间隔
  const quickIntervals = [5000, 8000, 10000, 15000, 20000];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-md">
            <Bell className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-deep-700">保养提醒</h1>
            <p className="text-sm text-deep-400 mt-0.5">
              根据设置的里程阈值自动推送保养提醒
            </p>
          </div>
        </div>
      </div>

      {/* 第一行：全局规则设置 + 提醒概览 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 全局规则设置卡片 */}
        <div className="lg:col-span-2 card rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-deep-50 flex items-center justify-center">
                <Settings className="w-4.5 h-4.5 text-deep-500" />
              </div>
              <div>
                <h3 className="section-title !mb-0">全局规则设置</h3>
                <p className="text-xs text-deep-400 mt-0.5">
                  设置默认规则后可一键批量应用到所有车辆
                </p>
              </div>
            </div>
            {applySuccess && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-fuel-50 text-fuel-600 text-sm font-medium animate-pulse">
                <Clock className="w-4 h-4" />
                已成功应用
              </span>
            )}
          </div>

          <div className="space-y-5">
            {/* 启用开关 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-deep-50/60">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    globalRule.enabled ? "bg-fuel-50" : "bg-deep-100"
                  )}
                >
                  <Bell
                    className={cn(
                      "w-4.5 h-4.5",
                      globalRule.enabled
                        ? "text-fuel-500"
                        : "text-deep-400"
                    )}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      "font-semibold",
                      globalRule.enabled
                        ? "text-deep-700"
                        : "text-deep-400"
                    )}
                  >
                    启用保养提醒
                  </p>
                  <p className="text-xs text-deep-500 mt-0.5">
                    关闭后批量应用将关闭所有车辆的保养提醒
                  </p>
                </div>
              </div>
              <label className="cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalRule.enabled}
                  onChange={(e) =>
                    setGlobalRule((prev) => ({
                      ...prev,
                      enabled: e.target.checked,
                    }))
                  }
                  className="sr-only"
                />
                <div className="text-3xl">
                  {globalRule.enabled ? (
                    <ToggleRight className="w-12 h-12 text-orange-500" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-deep-300" />
                  )}
                </div>
              </label>
            </div>

            {/* 保养间隔里程 */}
            <div>
              <label className="label">
                <Route className="w-4 h-4 inline mr-1 text-orange-500" />
                保养间隔里程 (km)
              </label>
              <div className="space-y-3">
                <input
                  type="number"
                  value={globalRule.intervalKm}
                  onChange={(e) =>
                    setGlobalRule((prev) => ({
                      ...prev,
                      intervalKm: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="5000"
                  min="1000"
                  step="1000"
                  className="input num"
                />
                {/* 快捷选项 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-deep-400">快速设置：</span>
                  {quickIntervals.map((km) => (
                    <button
                      key={km}
                      type="button"
                      onClick={() =>
                        setGlobalRule((prev) => ({
                          ...prev,
                          intervalKm: km,
                        }))
                      }
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-medium transition-all",
                        globalRule.intervalKm === km
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-deep-50 text-deep-600 hover:bg-deep-100"
                      )}
                    >
                      {formatKm(km)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 预警阈值 */}
            <div>
              <label className="label">
                <AlertTriangle className="w-4 h-4 inline mr-1 text-alert-yellow" />
                预警阈值 (km)
              </label>
              <input
                type="number"
                value={globalRule.warningThreshold}
                onChange={(e) =>
                  setGlobalRule((prev) => ({
                    ...prev,
                    warningThreshold: Number(e.target.value) || 0,
                  }))
                }
                placeholder="1000"
                min="0"
                step="100"
                className="input num"
              />
              <p className="text-xs text-deep-400 mt-1.5">
                距离下次保养小于此时程时显示黄色预警，小于一半时显示红色警报
              </p>
            </div>

            {/* 应用按钮 */}
            <button
              onClick={handleApplyGlobalRule}
              className={cn(
                "w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-md",
                "bg-gradient-to-r from-deep-600 to-deep-500 text-white hover:from-deep-700 hover:to-deep-600"
              )}
            >
              <Save className="w-4.5 h-4.5" />
              批量应用到全部 {vehicles.length} 辆车
            </button>
          </div>
        </div>

        {/* 提醒概览统计卡片 */}
        <div className="card rounded-[12px] p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Bell className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <h3 className="section-title !mb-0">提醒概览</h3>
              <p className="text-xs text-deep-400 mt-0.5">
                共 {overviewStats.total} 辆车
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Danger 数量 */}
            <div className="p-4 rounded-xl bg-alert-red/8 border border-alert-red/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-alert-red/15 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-alert-red" />
                  </div>
                  <div>
                    <p className="font-semibold text-alert-red">警报</p>
                    <p className="text-xs text-alert-red/70 mt-0.5">
                      立即需要保养
                    </p>
                  </div>
                </div>
                <span className="num text-3xl font-bold text-alert-red">
                  {overviewStats.danger}
                </span>
              </div>
            </div>

            {/* Warning 数量 */}
            <div className="p-4 rounded-xl bg-alert-yellow/8 border border-alert-yellow/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-alert-yellow/15 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-alert-yellow" />
                  </div>
                  <div>
                    <p className="font-semibold text-alert-yellow">预警</p>
                    <p className="text-xs text-alert-yellow/70 mt-0.5">
                      临近保养里程
                    </p>
                  </div>
                </div>
                <span className="num text-3xl font-bold text-alert-yellow">
                  {overviewStats.warning}
                </span>
              </div>
            </div>

            {/* Safe 数量 */}
            <div className="p-4 rounded-xl bg-fuel-500/8 border border-fuel-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuel-500/15 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-fuel-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-fuel-600">正常</p>
                    <p className="text-xs text-fuel-600/70 mt-0.5">
                      保养里程充裕
                    </p>
                  </div>
                </div>
                <span className="num text-3xl font-bold text-fuel-600">
                  {overviewStats.safe}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 第二行：保养提醒列表 */}
      <ReminderList alerts={alerts} />

      {/* 底部：规则说明卡片 */}
      <div className="card rounded-[12px] p-6 bg-deep-50/40 border-deep-100">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-deep-100 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4.5 h-4.5 text-deep-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-deep-700 mb-3">颜色分级说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 正常 */}
              <div className="p-4 rounded-xl bg-white border border-deep-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fuel-50 text-fuel-600 text-xs font-medium border border-fuel-200">
                    <Clock className="w-3.5 h-3.5" />
                    正常（绿色）
                  </span>
                </div>
                <p className="text-sm text-deep-500 leading-relaxed">
                  剩余里程大于预警阈值，车辆保养状态良好，无需额外关注。
                </p>
              </div>

              {/* 预警 */}
              <div className="p-4 rounded-xl bg-white border border-deep-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-alert-yellow/15 text-alert-yellow text-xs font-medium border border-alert-yellow/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    预警（黄色）
                  </span>
                </div>
                <p className="text-sm text-deep-500 leading-relaxed">
                  剩余里程在预警阈值的 50%~100% 之间，建议近期安排保养，避免超期。
                </p>
              </div>

              {/* 警报 */}
              <div className="p-4 rounded-xl bg-white border border-deep-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-alert-red/10 text-alert-red text-xs font-medium border border-alert-red/20">
                    <AlertCircle className="w-3.5 h-3.5" />
                    警报（红色）
                  </span>
                </div>
                <p className="text-sm text-deep-500 leading-relaxed">
                  剩余里程小于预警阈值的 50% 或已超期，请尽快安排保养，避免车辆损坏。
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-deep-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-deep-400 shrink-0 mt-0.5" />
                <p className="text-sm text-deep-500 leading-relaxed">
                  <strong>阈值计算规则：</strong>
                  下次保养里程 = 上次保养里程 + 保养间隔；
                  剩余里程 = 下次保养里程 - 当前里程。
                  当剩余里程 ≤ 预警阈值时进入预警状态，
                  当剩余里程 ≤ 预警阈值 / 2 时进入警报状态。
                  建议根据车辆使用频率、路况、载重等因素合理设置保养间隔和预警阈值。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
