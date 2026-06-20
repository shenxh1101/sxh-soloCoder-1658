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
  Calendar,
  CheckCircle,
  CalendarDays,
} from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";
import { formatKm } from "@/utils/formatters";
import type { MaintenancePlanItem } from "@/types";
import ReminderList from "@/components/reminder/ReminderList";

/**
 * 保养提醒页面
 * - 全局规则设置（批量应用到所有车辆）
 * - 提醒概览统计
 * - 保养提醒列表
 * - 颜色分级说明
 */
type TabType = "alerts" | "plan";

export default function RemindersPage() {
  const {
    vehicles,
    getMaintenanceAlerts,
    updateMaintenanceRule,
    maintenanceRules,
    getMaintenancePlan,
    markMaintenanceDone,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabType>("alerts");

  // 获取保养提醒数据
  const alerts = useMemo(() => getMaintenanceAlerts(), [getMaintenanceAlerts]);

  // 获取保养计划数据
  const plan = useMemo(() => getMaintenancePlan(30), [getMaintenancePlan]);

  // 保养计划统计
  const planStats = useMemo(() => {
    const in7Days = plan.filter((p) => p.estimatedDays <= 7).length;
    const in15Days = plan.filter((p) => p.estimatedDays <= 15).length;
    const in30Days = plan.length;
    return { in7Days, in15Days, in30Days };
  }, [plan]);

  // 按日期分组保养计划
  const groupedPlan = useMemo(() => {
    const groups: Record<string, MaintenancePlanItem[]> = {};
    plan.forEach((item) => {
      const date = item.estimatedDate;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    return groups;
  }, [plan]);

  // 预警级别配置
  const levelConfig = {
    safe: {
      borderColor: "border-fuel-500/30",
      bgColor: "bg-fuel-500/5",
      textColor: "text-fuel-600",
      badgeBg: "bg-fuel-50",
      badgeBorder: "border-fuel-200",
      icon: <CheckCircle className="w-4 h-4" />,
      label: "正常",
      dotColor: "bg-fuel-500",
    },
    warning: {
      borderColor: "border-alert-yellow/30",
      bgColor: "bg-alert-yellow/5",
      textColor: "text-alert-yellow",
      badgeBg: "bg-alert-yellow/15",
      badgeBorder: "border-alert-yellow/30",
      icon: <AlertTriangle className="w-4 h-4" />,
      label: "预警",
      dotColor: "bg-alert-yellow",
    },
    danger: {
      borderColor: "border-alert-red/30",
      bgColor: "bg-alert-red/5",
      textColor: "text-alert-red",
      badgeBg: "bg-alert-red/10",
      badgeBorder: "border-alert-red/20",
      icon: <AlertCircle className="w-4 h-4" />,
      label: "警报",
      dotColor: "bg-alert-red",
    },
  };

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

      {/* Tab 切换 */}
      <div className="card rounded-[12px] p-1.5 inline-flex gap-1">
        <button
          onClick={() => setActiveTab("alerts")}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeTab === "alerts"
              ? "bg-orange-500 text-white shadow-md"
              : "text-deep-600 hover:bg-deep-50"
          )}
        >
          <Bell className="w-4 h-4" />
          预警列表
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={cn(
            "px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
            activeTab === "plan"
              ? "bg-orange-500 text-white shadow-md"
              : "text-deep-600 hover:bg-deep-50"
          )}
        >
          <CalendarDays className="w-4 h-4" />
          保养计划
        </button>
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

      {/* 第二行：Tab 内容 */}
      {activeTab === "alerts" ? (
        <ReminderList alerts={alerts} />
      ) : (
        <div className="space-y-6">
          {/* 保养计划统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card rounded-[12px] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-alert-red/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-alert-red" />
                  </div>
                  <div>
                    <p className="text-xs text-deep-400">未来7天内</p>
                    <p className="num text-2xl font-bold text-deep-700">{planStats.in7Days} 辆</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card rounded-[12px] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-alert-yellow/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-alert-yellow" />
                  </div>
                  <div>
                    <p className="text-xs text-deep-400">未来15天内</p>
                    <p className="num text-2xl font-bold text-deep-700">{planStats.in15Days} 辆</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="card rounded-[12px] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fuel-500/10 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-fuel-600" />
                  </div>
                  <div>
                    <p className="text-xs text-deep-400">未来30天内</p>
                    <p className="num text-2xl font-bold text-deep-700">{planStats.in30Days} 辆</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 保养计划时间轴 */}
          <div className="card rounded-[12px] p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <CalendarDays className="w-4.5 h-4.5 text-orange-500" />
              </div>
              <div>
                <h3 className="section-title !mb-0">保养计划时间轴</h3>
                <p className="text-xs text-deep-400 mt-0.5">
                  未来30天内需要保养的车辆
                </p>
              </div>
            </div>

            {plan.length === 0 ? (
              <div className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-fuel-50 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-fuel-400" />
                  </div>
                  <p className="text-deep-500 font-medium">暂无保养计划</p>
                  <p className="text-sm text-deep-400">
                    未来30天内所有车辆无需保养
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {Object.entries(groupedPlan).map(([date, items], dateIndex) => {
                  const dateObj = new Date(date);
                  const isToday = dateObj.toDateString() === new Date().toDateString();
                  const isLastGroup = dateIndex === Object.keys(groupedPlan).length - 1;
                  
                  return (
                    <div key={date} className="relative flex gap-6">
                      {/* 时间轴左侧：日期 */}
                      <div className="w-28 shrink-0 pt-1">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex flex-col items-center justify-center",
                            isToday ? "bg-orange-500 text-white" : "bg-deep-50 text-deep-600"
                          )}>
                            <span className="text-xs font-medium">{dateObj.getMonth() + 1}月</span>
                            <span className="text-lg font-bold leading-none">{dateObj.getDate()}</span>
                          </div>
                          <p className={cn(
                            "text-xs mt-2 font-medium",
                            isToday ? "text-orange-500" : "text-deep-500"
                          )}>
                            {isToday ? "今天" : `${["日", "一", "二", "三", "四", "五", "六"][dateObj.getDay()]}`}
                          </p>
                        </div>
                      </div>

                      {/* 时间轴连接线和圆点 */}
                      <div className="relative flex flex-col items-center">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-4 border-white z-10",
                          levelConfig[items[0].level].dotColor
                        )} />
                        {!isLastGroup && (
                          <div className="w-0.5 flex-1 bg-deep-100 border-l border-dashed border-deep-200 mt-2" />
                        )}
                      </div>

                      {/* 时间轴右侧：车辆卡片列表 */}
                      <div className="flex-1 pb-8 space-y-4">
                        {items.map((item) => {
                          const config = levelConfig[item.level];
                          const isOverdue = item.remainingKm < 0;
                          
                          return (
                            <div
                              key={item.vehicleId}
                              className={cn(
                                "p-5 rounded-xl border transition-all hover:shadow-md",
                                config.borderColor,
                                config.bgColor
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                {/* 左侧：车辆信息 */}
                                <div className="flex items-start gap-4 flex-1">
                                  {/* 车辆图标 */}
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-deep-500 to-deep-600 flex items-center justify-center text-xl shrink-0">
                                    🚚
                                  </div>
                                  
                                  {/* 车辆详情 */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap mb-3">
                                      <h4 className="text-base font-bold text-deep-700 tracking-wider">
                                        {item.plate}
                                      </h4>
                                      <span className={cn(
                                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border",
                                        config.badgeBg,
                                        config.textColor,
                                        config.badgeBorder
                                      )}>
                                        {config.icon}
                                        {isOverdue ? "超期" : config.label}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-deep-400 shrink-0">司机：</span>
                                        <span className="text-sm font-medium text-deep-600">
                                          {item.driverName || "--"}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-deep-400 shrink-0">当前里程：</span>
                                        <span className="num text-sm font-semibold text-deep-600">
                                          {formatKm(item.currentMileage)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-deep-400 shrink-0">上次保养：</span>
                                        <span className="num text-sm font-medium text-deep-500">
                                          {formatKm(item.lastMaintenanceKm)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-deep-400 shrink-0">下次保养：</span>
                                        <span className="num text-sm font-semibold text-deep-700">
                                          {formatKm(item.nextKm)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-deep-400 shrink-0">剩余里程：</span>
                                        <span className={cn(
                                          "num text-sm font-bold",
                                          config.textColor
                                        )}>
                                          {isOverdue ? `超期 ${formatKm(Math.abs(item.remainingKm))}` : formatKm(item.remainingKm)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-deep-400 shrink-0" />
                                        <span className="text-xs text-deep-400">
                                          预估：{item.estimatedDate}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* 右侧：距离天数和操作按钮 */}
                                <div className="flex flex-col items-end gap-3 shrink-0">
                                  <div className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold",
                                    item.estimatedDays <= 7 ? "bg-alert-red/10 text-alert-red" :
                                    item.estimatedDays <= 15 ? "bg-alert-yellow/10 text-alert-yellow" :
                                    "bg-fuel-50 text-fuel-600"
                                  )}>
                                    <Clock className="w-4 h-4" />
                                    {item.estimatedDays <= 0 ? "今天" : `${item.estimatedDays} 天后`}
                                  </div>
                                  
                                  <button
                                    onClick={() => {
                                      const confirmed = window.confirm(
                                        `确认 ${item.plate} 已完成保养？\n\n将更新上次保养里程为：${formatKm(item.currentMileage)}`
                                      );
                                      if (confirmed) {
                                        markMaintenanceDone(item.vehicleId, item.currentMileage);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-fuel-500 text-white hover:bg-fuel-600 transition-colors shadow-sm"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    已完成保养
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
