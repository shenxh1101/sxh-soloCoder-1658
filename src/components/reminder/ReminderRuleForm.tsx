import { useState, useEffect } from "react";
import {
  Truck,
  Route,
  AlertTriangle,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Clock,
} from "lucide-react";
import { useStore } from "@/store";
import { formatKm } from "@/utils/formatters";
import { calcRemainingKm } from "@/utils/calculations";
import { cn } from "@/lib/utils";

interface ReminderRuleFormProps {
  vehicleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 保养提醒规则表单组件
 * - 配置保养间隔里程、预警阈值、上次保养里程、是否启用
 */
export default function ReminderRuleForm({
  vehicleId,
  onSuccess,
  onCancel,
}: ReminderRuleFormProps) {
  const {
    getVehicleById,
    maintenanceRules,
    updateMaintenanceRule,
  } = useStore();

  const vehicle = getVehicleById(vehicleId);

  // 查找现有规则
  const existingRule = maintenanceRules.find((r) => r.vehicleId === vehicleId);

  // 表单状态
  const [formData, setFormData] = useState({
    intervalKm: 5000,
    warningThreshold: 1000,
    lastMaintenanceKm: 0,
    enabled: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 加载现有规则
  useEffect(() => {
    if (existingRule) {
      setFormData({
        intervalKm: existingRule.intervalKm,
        warningThreshold: existingRule.warningThreshold,
        lastMaintenanceKm: existingRule.lastMaintenanceKm,
        enabled: existingRule.enabled,
      });
    } else if (vehicle) {
      setFormData((prev) => ({
        ...prev,
        lastMaintenanceKm: vehicle.initialMileage,
      }));
    }
  }, [existingRule, vehicle]);

  // 预览计算
  const preview = {
    nextKm: formData.lastMaintenanceKm + formData.intervalKm,
    remaining: vehicle
      ? formData.lastMaintenanceKm + formData.intervalKm - vehicle.currentMileage
      : 0,
  };

  // 根据剩余里程判断预警级别
  const getPreviewLevel = () => {
    if (!formData.enabled || !vehicle) return "safe";
    const { level } = calcRemainingKm(
      vehicle.currentMileage,
      formData.lastMaintenanceKm,
      formData.intervalKm,
      formData.warningThreshold
    );
    return level;
  };

  const previewLevel = getPreviewLevel();

  // 字段变更
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? Number(value) || 0
          : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // 快速设置间隔
  const quickIntervals = [5000, 8000, 10000, 15000, 20000];

  // 校验
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.intervalKm <= 0) {
      newErrors.intervalKm = "保养间隔必须大于0";
    }
    if (formData.warningThreshold < 0) {
      newErrors.warningThreshold = "预警阈值不能为负数";
    }
    if (formData.warningThreshold >= formData.intervalKm) {
      newErrors.warningThreshold = "预警阈值必须小于保养间隔";
    }
    if (formData.lastMaintenanceKm < 0) {
      newErrors.lastMaintenanceKm = "上次保养里程不能为负数";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateMaintenanceRule(vehicleId, {
      intervalKm: formData.intervalKm,
      warningThreshold: formData.warningThreshold,
      lastMaintenanceKm: formData.lastMaintenanceKm,
      enabled: formData.enabled,
    });

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 车辆信息 */}
      {vehicle && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-deep-600 to-deep-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-2xl">
                🚚
              </div>
              <div>
                <p className="text-lg font-bold tracking-wider">
                  {vehicle.plateNumber}
                </p>
                <p className="text-sm text-white/70">{vehicle.model}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 mb-1">当前里程</p>
              <p className="num text-xl font-bold">
                {formatKm(vehicle.currentMileage)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 启用开关 */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-deep-50/60">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
              formData.enabled ? "bg-fuel-50" : "bg-deep-100"
            )}
          >
            <Clock
              className={cn(
                "w-4.5 h-4.5",
                formData.enabled ? "text-fuel-500" : "text-deep-400"
              )}
            />
          </div>
          <div>
            <p
              className={cn(
                "font-semibold",
                formData.enabled ? "text-deep-700" : "text-deep-400"
              )}
            >
              启用保养提醒
            </p>
            <p className="text-xs text-deep-500 mt-0.5">
              {formData.enabled
                ? "系统将根据里程自动提醒保养"
                : "关闭后该车辆将不会产生保养提醒"}
            </p>
          </div>
        </div>
        <label className="cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            className="sr-only"
          />
          <div className="text-3xl">
            {formData.enabled ? (
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
          保养间隔里程 (km) <span className="text-alert-red">*</span>
        </label>
        <div className="space-y-3">
          <input
            type="number"
            name="intervalKm"
            value={formData.intervalKm}
            onChange={handleChange}
            placeholder="5000"
            min="1000"
            step="1000"
            className={cn(
              "input num",
              errors.intervalKm &&
                "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
            )}
          />
          {/* 快捷选项 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-deep-400">快速设置：</span>
            {quickIntervals.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, intervalKm: km }))
                }
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-all",
                  formData.intervalKm === km
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-deep-50 text-deep-600 hover:bg-deep-100"
                )}
              >
                {formatKm(km)}
              </button>
            ))}
          </div>
        </div>
        {errors.intervalKm && (
          <p className="mt-1 text-xs text-alert-red">{errors.intervalKm}</p>
        )}
      </div>

      {/* 预警阈值 */}
      <div>
        <label className="label">
          <AlertTriangle className="w-4 h-4 inline mr-1 text-alert-yellow" />
          预警阈值 (km) <span className="text-alert-red">*</span>
        </label>
        <input
          type="number"
          name="warningThreshold"
          value={formData.warningThreshold}
          onChange={handleChange}
          placeholder="1000"
          min="0"
          step="100"
          className={cn(
            "input num",
            errors.warningThreshold &&
              "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
          )}
        />
        <p className="text-xs text-deep-400 mt-1.5">
          距离下次保养小于此时程时将显示黄色预警，小于一半时显示红色警报
        </p>
        {errors.warningThreshold && (
          <p className="mt-1 text-xs text-alert-red">{errors.warningThreshold}</p>
        )}
      </div>

      {/* 上次保养里程 */}
      <div>
        <label className="label">
          <MapPin className="w-4 h-4 inline mr-1 text-deep-400" />
          上次保养里程 (km)
        </label>
        <input
          type="number"
          name="lastMaintenanceKm"
          value={formData.lastMaintenanceKm}
          onChange={handleChange}
          placeholder="0"
          min="0"
          step="100"
          className={cn(
            "input num",
            errors.lastMaintenanceKm &&
              "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
          )}
        />
        {errors.lastMaintenanceKm && (
          <p className="mt-1 text-xs text-alert-red">
            {errors.lastMaintenanceKm}
          </p>
        )}
      </div>

      {/* 预览卡片 */}
      {vehicle && formData.enabled && (
        <div className="p-5 rounded-xl bg-deep-50/60 border border-deep-100">
          <p className="text-sm font-semibold text-deep-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-deep-500" />
            规则预览
          </p>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-white">
              <p className="text-xs text-deep-400 mb-1">下次保养里程</p>
              <p className="num text-lg font-bold text-deep-700">
                {formatKm(preview.nextKm)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white">
              <p className="text-xs text-deep-400 mb-1">当前里程</p>
              <p className="num text-lg font-bold text-deep-700">
                {formatKm(vehicle.currentMileage)}
              </p>
            </div>
            <div
              className={cn(
                "p-3 rounded-lg",
                previewLevel === "danger"
                  ? "bg-alert-red/10"
                  : previewLevel === "warning"
                  ? "bg-alert-yellow/10"
                  : "bg-fuel-50"
              )}
            >
              <p className="text-xs text-deep-400 mb-1">剩余里程</p>
              <p
                className={cn(
                  "num text-lg font-bold",
                  previewLevel === "danger"
                    ? "text-alert-red"
                    : previewLevel === "warning"
                    ? "text-alert-yellow"
                    : "text-fuel-600"
                )}
              >
                {preview.remaining >= 0
                  ? formatKm(preview.remaining)
                  : `超期 ${formatKm(Math.abs(preview.remaining))}`}
              </p>
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-deep-500">上次保养</span>
              <span className="text-deep-500">下次保养</span>
            </div>
            <div className="relative h-3 rounded-full bg-deep-100 overflow-hidden">
              {/* 区间填充 */}
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all",
                  previewLevel === "danger"
                    ? "bg-alert-red"
                    : previewLevel === "warning"
                    ? "bg-alert-yellow"
                    : "bg-fuel-500"
                )}
                style={{
                  width: `${Math.min(
                    Math.max(
                      ((vehicle.currentMileage - formData.lastMaintenanceKm) /
                        formData.intervalKm) *
                        100,
                      0
                    ),
                    100
                  )}%`,
                }}
              />
              {/* 当前位置标记 */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-md transition-all"
                style={{
                  left: `${Math.min(
                    Math.max(
                      ((vehicle.currentMileage - formData.lastMaintenanceKm) /
                        formData.intervalKm) *
                        100,
                      0
                    ),
                    100
                  )}%`,
                  transform: "translate(-50%, -50%)",
                  borderColor:
                    previewLevel === "danger"
                      ? "#E74C3C"
                      : previewLevel === "warning"
                      ? "#F1C40F"
                      : "#2ECC71",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-deep-400">
              <span>{formatKm(formData.lastMaintenanceKm)}</span>
              <span>{formatKm(preview.nextKm)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-deep-50">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            <X className="w-4 h-4" />
            取消
          </button>
        )}
        <button type="submit" className="btn-primary">
          <Save className="w-4 h-4" />
          保存规则
        </button>
      </div>
    </form>
  );
}
