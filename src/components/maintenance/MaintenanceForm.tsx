import { useState, useEffect } from "react";
import {
  Truck,
  Wrench,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Save,
  X,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/store";
import type { MaintenanceType } from "@/types";
import { formatYMD } from "@/utils/calculations";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface MaintenanceFormProps {
  mode?: "apply" | "complete";
  maintenanceId?: string;
  defaultVehicleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 维修申请/完成表单组件
 * - apply 模式：申请维修
 * - complete 模式：完成维修（额外填写完成日期、费用、里程）
 */
export default function MaintenanceForm({
  mode = "apply",
  maintenanceId,
  defaultVehicleId,
  onSuccess,
  onCancel,
}: MaintenanceFormProps) {
  const {
    vehicles,
    getVehicleById,
    addMaintenanceRecord,
    completeMaintenance,
    getMaintenanceRecordsByVehicle,
    maintenanceRecords,
  } = useStore();

  const isCompleteMode = mode === "complete";

  // 表单状态
  const [formData, setFormData] = useState({
    vehicleId: defaultVehicleId || "",
    type: "routine" as MaintenanceType,
    description: "",
    workshop: "",
    applyDate: formatYMD(new Date()),
    // 完成模式字段
    finishDate: formatYMD(new Date()),
    cost: 0,
    mileageAfter: 0,
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 完成模式：加载维修记录原始数据
  useEffect(() => {
    if (isCompleteMode && maintenanceId) {
      const record = maintenanceRecords.find((r) => r.id === maintenanceId);
      if (record) {
        setFormData((prev) => ({
          ...prev,
          vehicleId: record.vehicleId,
          type: record.type,
          description: record.description,
          workshop: record.workshop,
          applyDate: record.applyDate.split("T")[0],
          mileageAfter: getVehicleById(record.vehicleId)?.currentMileage || 0,
        }));
      }
    }
  }, [isCompleteMode, maintenanceId, maintenanceRecords, getVehicleById]);

  // 切换车辆时，自动填充里程
  useEffect(() => {
    if (formData.vehicleId && !formData.mileageAfter) {
      const vehicle = getVehicleById(formData.vehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          mileageAfter: vehicle.currentMileage,
        }));
      }
    }
  }, [formData.vehicleId, formData.mileageAfter, getVehicleById]);

  // 字段变更
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const numericFields = ["cost", "mileageAfter"];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // 校验
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicleId) {
      newErrors.vehicleId = "请选择车辆";
    }
    if (!formData.type) {
      newErrors.type = "请选择维修类型";
    }
    if (!formData.description.trim()) {
      newErrors.description = "请填写故障/维修描述";
    }
    if (!formData.workshop.trim()) {
      newErrors.workshop = "请填写维修厂名称";
    }
    if (!formData.applyDate) {
      newErrors.applyDate = "请选择申请日期";
    }

    // 完成模式额外校验
    if (isCompleteMode) {
      if (!formData.finishDate) {
        newErrors.finishDate = "请选择完成日期";
      }
      if (formData.cost < 0) {
        newErrors.cost = "维修费用不能为负数";
      }
      if (formData.mileageAfter <= 0) {
        newErrors.mileageAfter = "请输入维修后里程";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isCompleteMode && maintenanceId) {
      completeMaintenance(maintenanceId, {
        finishDate: new Date(formData.finishDate).toISOString(),
        cost: formData.cost,
        mileageAfter: formData.mileageAfter,
      });
    } else {
      addMaintenanceRecord({
        vehicleId: formData.vehicleId,
        type: formData.type,
        description: formData.description,
        workshop: formData.workshop,
        cost: 0,
        mileageAfter: 0,
        applyDate: new Date(formData.applyDate).toISOString(),
        finishDate: "",
        status: "pending",
        notes: formData.notes,
      });
    }

    onSuccess?.();
  };

  // 维修类型选项
  const typeOptions: { value: MaintenanceType; label: string; color: string }[] = [
    { value: "routine", label: "常规保养", color: "bg-fuel-50 text-fuel-600 border-fuel-200" },
    { value: "fault", label: "故障维修", color: "bg-alert-red/10 text-alert-red border-alert-red/20" },
    { value: "overhaul", label: "大修", color: "bg-repair-50 text-repair-600 border-repair-200" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 模式标识 */}
      <div
        className={cn(
          "p-4 rounded-xl flex items-center gap-3",
          isCompleteMode
            ? "bg-fuel-50/80 border border-fuel-100"
            : "bg-orange-50/80 border border-orange-100"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            isCompleteMode ? "bg-fuel-100" : "bg-orange-100"
          )}
        >
          {isCompleteMode ? (
            <CheckCircle2 className="w-5 h-5 text-fuel-600" />
          ) : (
            <Wrench className="w-5 h-5 text-orange-500" />
          )}
        </div>
        <div>
          <p className="font-semibold text-deep-700">
            {isCompleteMode ? "完成维修" : "申请维修"}
          </p>
          <p className="text-xs text-deep-500 mt-0.5">
            {isCompleteMode
              ? "填写完成信息，系统将更新车辆里程并记录费用"
              : "提交维修申请，完成后请回填维修信息"}
          </p>
        </div>
      </div>

      {/* 车牌号选择 */}
      <div>
        <label className="label">
          <Truck className="w-4 h-4 inline mr-1 text-orange-500" />
          选择车辆 <span className="text-alert-red">*</span>
        </label>
        <select
          name="vehicleId"
          value={formData.vehicleId}
          onChange={handleChange}
          disabled={isCompleteMode}
          className={cn(
            "input",
            isCompleteMode && "bg-deep-50/60 cursor-not-allowed",
            errors.vehicleId &&
              "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
          )}
        >
          <option value="">请选择车辆</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plateNumber} - {v.model}
            </option>
          ))}
        </select>
        {errors.vehicleId && (
          <p className="mt-1 text-xs text-alert-red">{errors.vehicleId}</p>
        )}
      </div>

      {/* 维修类型 */}
      <div>
        <label className="label">
          <Wrench className="w-4 h-4 inline mr-1 text-deep-400" />
          维修类型 <span className="text-alert-red">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {typeOptions.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all",
                formData.type === opt.value
                  ? opt.color + " border-solid shadow-sm"
                  : "bg-white border-deep-100 border-dashed hover:border-deep-200 text-deep-500",
                isCompleteMode && "cursor-not-allowed opacity-70"
              )}
            >
              <input
                type="radio"
                name="type"
                value={opt.value}
                checked={formData.type === opt.value}
                onChange={handleChange}
                disabled={isCompleteMode}
                className="sr-only"
              />
              {opt.value === "routine" && <Wrench className="w-4 h-4" />}
              {opt.value === "fault" && <AlertTriangle className="w-4 h-4" />}
              {opt.value === "overhaul" && <Wrench className="w-4 h-4" />}
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
        {errors.type && (
          <p className="mt-1 text-xs text-alert-red">{errors.type}</p>
        )}
      </div>

      {/* 描述 */}
      <div>
        <label className="label">
          <AlertTriangle className="w-4 h-4 inline mr-1 text-deep-400" />
          {isCompleteMode ? "维修内容描述" : "故障描述"}{" "}
          <span className="text-alert-red">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          disabled={isCompleteMode}
          placeholder={
            isCompleteMode
              ? "维修项目及内容说明..."
              : "请详细描述故障现象或需要保养的项目..."
          }
          rows={3}
          className={cn(
            "input resize-none",
            isCompleteMode && "bg-deep-50/60 cursor-not-allowed",
            errors.description &&
              "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
          )}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-alert-red">{errors.description}</p>
        )}
      </div>

      {/* 维修厂 + 申请日期 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">
            <MapPin className="w-4 h-4 inline mr-1 text-deep-400" />
            维修厂 <span className="text-alert-red">*</span>
          </label>
          <input
            type="text"
            name="workshop"
            value={formData.workshop}
            onChange={handleChange}
            placeholder="例如：XX汽车服务中心"
            className={cn(
              "input",
              errors.workshop &&
                "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
            )}
          />
          {errors.workshop && (
            <p className="mt-1 text-xs text-alert-red">{errors.workshop}</p>
          )}
        </div>

        <div>
          <label className="label">
            <Calendar className="w-4 h-4 inline mr-1 text-deep-400" />
            申请日期 <span className="text-alert-red">*</span>
          </label>
          <input
            type="date"
            name="applyDate"
            value={formData.applyDate}
            onChange={handleChange}
            disabled={isCompleteMode}
            className={cn(
              "input",
              isCompleteMode && "bg-deep-50/60 cursor-not-allowed",
              errors.applyDate &&
                "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
            )}
          />
          {errors.applyDate && (
            <p className="mt-1 text-xs text-alert-red">{errors.applyDate}</p>
          )}
        </div>
      </div>

      {/* 完成模式：额外字段 */}
      {isCompleteMode && (
        <div className="p-4 rounded-xl bg-fuel-50/50 border border-fuel-100 space-y-4">
          <p className="text-sm font-semibold text-fuel-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            维修完成信息
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">
                <Calendar className="w-4 h-4 inline mr-1 text-deep-400" />
                完成日期 <span className="text-alert-red">*</span>
              </label>
              <input
                type="date"
                name="finishDate"
                value={formData.finishDate}
                onChange={handleChange}
                className={cn(
                  "input",
                  errors.finishDate &&
                    "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
                )}
              />
              {errors.finishDate && (
                <p className="mt-1 text-xs text-alert-red">{errors.finishDate}</p>
              )}
            </div>

            <div>
              <label className="label">
                <DollarSign className="w-4 h-4 inline mr-1 text-orange-500" />
                维修费用 (¥)
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost || ""}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className={cn(
                  "input num",
                  errors.cost &&
                    "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
                )}
              />
              {errors.cost && (
                <p className="mt-1 text-xs text-alert-red">{errors.cost}</p>
              )}
            </div>

            <div>
              <label className="label">
                <MapPin className="w-4 h-4 inline mr-1 text-deep-400" />
                维修后里程 (km)
              </label>
              <input
                type="number"
                name="mileageAfter"
                value={formData.mileageAfter || ""}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className={cn(
                  "input num",
                  errors.mileageAfter &&
                    "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
                )}
              />
              {errors.mileageAfter && (
                <p className="mt-1 text-xs text-alert-red">{errors.mileageAfter}</p>
              )}
            </div>
          </div>

          {/* 费用预览 */}
          {formData.cost > 0 && (
            <div className="p-3 rounded-lg bg-white flex items-center justify-between">
              <span className="text-sm text-deep-500">本次维修费用</span>
              <span className="num text-xl font-bold text-orange-600">
                {formatCurrency(formData.cost, 2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 备注 */}
      <div>
        <label className="label">
          <FileText className="w-4 h-4 inline mr-1 text-deep-400" />
          备注
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="其他补充信息..."
          rows={2}
          className="input resize-none"
        />
      </div>

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
          {isCompleteMode ? "确认完成" : "提交申请"}
        </button>
      </div>
    </form>
  );
}
