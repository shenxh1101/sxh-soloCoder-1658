import { useState, useEffect, useMemo } from "react";
import { Truck, Fuel, DollarSign, MapPin, Calendar, FileText, Save, X, Calculator } from "lucide-react";
import { useStore } from "@/store";
import { formatCurrency, formatLiters } from "@/utils/formatters";
import { formatYMD } from "@/utils/calculations";
import { cn } from "@/lib/utils";
import FuelPreview from "./FuelPreview";

interface FuelFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultVehicleId?: string;
}

/**
 * 加油录入表单组件
 * - 双列布局：左侧表单 + 右侧实时预览
 * - 实时计算单价 = 金额 / 加油量
 */
export default function FuelForm({
  onSuccess,
  onCancel,
  defaultVehicleId,
}: FuelFormProps) {
  const { vehicles, addFuelRecord, getVehicleById } = useStore();

  // 表单状态
  const [formData, setFormData] = useState({
    vehicleId: defaultVehicleId || "",
    fuelAmount: 0,
    fuelCost: 0,
    currentMileage: 0,
    gasStation: "",
    fuelDate: formatYMD(new Date()),
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 设置默认车辆
  useEffect(() => {
    if (defaultVehicleId) {
      const vehicle = getVehicleById(defaultVehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          vehicleId: defaultVehicleId,
          currentMileage: vehicle.currentMileage,
        }));
      }
    }
  }, [defaultVehicleId, getVehicleById]);

  // 切换车辆时，自动填充当前里程
  useEffect(() => {
    if (formData.vehicleId && !formData.currentMileage) {
      const vehicle = getVehicleById(formData.vehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          currentMileage: vehicle.currentMileage,
        }));
      }
    }
  }, [formData.vehicleId, formData.currentMileage, getVehicleById]);

  // 实时计算单价
  const pricePerLiter = useMemo(() => {
    if (formData.fuelAmount > 0 && formData.fuelCost > 0) {
      return +(formData.fuelCost / formData.fuelAmount).toFixed(2);
    }
    return 0;
  }, [formData.fuelAmount, formData.fuelCost]);

  // 表单字段变更
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const numericFields = ["fuelAmount", "fuelCost", "currentMileage"];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) || 0 : value,
    }));
    // 清除对应错误
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
    if (formData.fuelAmount <= 0) {
      newErrors.fuelAmount = "加油量必须大于0";
    }
    if (formData.fuelCost <= 0) {
      newErrors.fuelCost = "加油金额必须大于0";
    }
    if (formData.currentMileage <= 0) {
      newErrors.currentMileage = "请输入当前里程";
    }
    if (!formData.gasStation.trim()) {
      newErrors.gasStation = "请输入加油站名称";
    }
    if (!formData.fuelDate) {
      newErrors.fuelDate = "请选择加油日期";
    }

    // 检查里程是否合理
    if (formData.vehicleId && formData.currentMileage > 0) {
      const vehicle = getVehicleById(formData.vehicleId);
      if (
        vehicle &&
        formData.currentMileage < vehicle.initialMileage &&
        formData.currentMileage < vehicle.currentMileage
      ) {
        newErrors.currentMileage = "里程不能低于初始或当前里程";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addFuelRecord({
      vehicleId: formData.vehicleId,
      fuelAmount: formData.fuelAmount,
      fuelCost: formData.fuelCost,
      pricePerLiter,
      currentMileage: formData.currentMileage,
      gasStation: formData.gasStation,
      fuelDate: new Date(formData.fuelDate).toISOString(),
      notes: formData.notes,
    });

    onSuccess?.();
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 左侧表单 */}
      <form onSubmit={handleSubmit} className="card p-6 rounded-[12px] space-y-5">
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
            className={cn("input", errors.vehicleId && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
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

        {/* 加油量 + 加油金额 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              <Fuel className="w-4 h-4 inline mr-1 text-fuel-500" />
              加油量 (L) <span className="text-alert-red">*</span>
            </label>
            <input
              type="number"
              name="fuelAmount"
              value={formData.fuelAmount || ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={cn("input num", errors.fuelAmount && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
            />
            {errors.fuelAmount && (
              <p className="mt-1 text-xs text-alert-red">{errors.fuelAmount}</p>
            )}
          </div>

          <div>
            <label className="label">
              <DollarSign className="w-4 h-4 inline mr-1 text-orange-500" />
              加油金额 (¥) <span className="text-alert-red">*</span>
            </label>
            <input
              type="number"
              name="fuelCost"
              value={formData.fuelCost || ""}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={cn("input num", errors.fuelCost && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
            />
            {errors.fuelCost && (
              <p className="mt-1 text-xs text-alert-red">{errors.fuelCost}</p>
            )}
          </div>
        </div>

        {/* 实时单价显示 */}
        <div className="p-3 rounded-lg bg-deep-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-deep-500">
            <Calculator className="w-4 h-4" />
            实时计算单价
          </div>
          <span className="num text-lg font-bold text-orange-600">
            {pricePerLiter > 0 ? formatCurrency(pricePerLiter, 2) : "--"}
            <span className="text-sm font-normal ml-0.5 text-deep-400">
              / L
            </span>
          </span>
        </div>

        {/* 当前里程 + 加油站 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              <MapPin className="w-4 h-4 inline mr-1 text-deep-400" />
              当前里程 (km) <span className="text-alert-red">*</span>
            </label>
            <input
              type="number"
              name="currentMileage"
              value={formData.currentMileage || ""}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={cn("input num", errors.currentMileage && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
            />
            {errors.currentMileage && (
              <p className="mt-1 text-xs text-alert-red">{errors.currentMileage}</p>
            )}
          </div>

          <div>
            <label className="label">
              <MapPin className="w-4 h-4 inline mr-1 text-deep-400" />
              加油站 <span className="text-alert-red">*</span>
            </label>
            <input
              type="text"
              name="gasStation"
              value={formData.gasStation}
              onChange={handleChange}
              placeholder="例如：中石化XX站"
              className={cn("input", errors.gasStation && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
            />
            {errors.gasStation && (
              <p className="mt-1 text-xs text-alert-red">{errors.gasStation}</p>
            )}
          </div>
        </div>

        {/* 加油日期 */}
        <div>
          <label className="label">
            <Calendar className="w-4 h-4 inline mr-1 text-deep-400" />
            加油日期 <span className="text-alert-red">*</span>
          </label>
          <input
            type="date"
            name="fuelDate"
            value={formData.fuelDate}
            onChange={handleChange}
            className={cn("input", errors.fuelDate && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.fuelDate && (
            <p className="mt-1 text-xs text-alert-red">{errors.fuelDate}</p>
          )}
        </div>

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
            placeholder="可填写油品标号、优惠信息等..."
            rows={3}
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
            确认录入
          </button>
        </div>
      </form>

      {/* 右侧实时预览 */}
      <FuelPreview
        vehicleId={formData.vehicleId}
        fuelAmount={formData.fuelAmount}
        currentMileage={formData.currentMileage}
      />
    </div>
  );
}
