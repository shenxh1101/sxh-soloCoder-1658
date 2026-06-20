import { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Fuel,
  DollarSign,
  MapPin,
  Calendar,
  FileText,
  Save,
  X,
  Calculator,
  AlertTriangle,
  History,
} from "lucide-react";
import { useStore } from "@/store";
import { formatCurrency, formatLiters } from "@/utils/formatters";
import { formatYMD } from "@/utils/calculations";
import { cn } from "@/lib/utils";
import FuelPreview from "./FuelPreview";

interface FuelFormProps {
  mode?: "normal" | "backfill";
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultVehicleId?: string;
}

export default function FuelForm({
  mode = "normal",
  onSuccess,
  onCancel,
  defaultVehicleId,
}: FuelFormProps) {
  const {
    vehicles,
    addFuelRecord,
    addFuelRecordBackfill,
    getVehicleById,
  } = useStore();

  const isBackfill = mode === "backfill";

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
  const [mileageWarning, setMileageWarning] = useState<string | null>(null);

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

  useEffect(() => {
    if (formData.vehicleId && formData.currentMileage === 0) {
      const vehicle = getVehicleById(formData.vehicleId);
      if (vehicle) {
        setFormData((prev) => ({
          ...prev,
          currentMileage: vehicle.currentMileage,
        }));
      }
    }
  }, [formData.vehicleId, formData.currentMileage, getVehicleById]);

  const pricePerLiter = useMemo(() => {
    if (formData.fuelAmount > 0 && formData.fuelCost > 0) {
      return +(formData.fuelCost / formData.fuelAmount).toFixed(2);
    }
    return 0;
  }, [formData.fuelAmount, formData.fuelCost]);

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
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (name === "currentMileage" || name === "vehicleId") {
      setMileageWarning(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    setMileageWarning(null);

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

    if (formData.vehicleId && formData.currentMileage > 0) {
      const vehicle = getVehicleById(formData.vehicleId);
      if (vehicle) {
        if (formData.currentMileage < vehicle.initialMileage) {
          newErrors.currentMileage = `里程不能低于初始里程 ${formatLiters(vehicle.initialMileage)}`;
        } else if (!isBackfill && formData.currentMileage <= vehicle.currentMileage) {
          setMileageWarning(
            `当前里程（${formatLiters(formData.currentMileage)}）低于或等于车辆当前里程（${formatLiters(vehicle.currentMileage)}）。请使用「历史补录」入口录入旧数据。`
          );
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (mileageWarning && !isBackfill) return;

    const recordData = {
      vehicleId: formData.vehicleId,
      fuelAmount: formData.fuelAmount,
      fuelCost: formData.fuelCost,
      pricePerLiter,
      currentMileage: formData.currentMileage,
      gasStation: formData.gasStation,
      fuelDate: new Date(formData.fuelDate).toISOString(),
      notes: formData.notes,
    };

    if (isBackfill) {
      addFuelRecordBackfill(recordData);
    } else {
      addFuelRecord(recordData);
    }

    onSuccess?.();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-2 mb-2">
          {isBackfill ? (
            <>
              <History className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                历史补录模式
              </span>
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 text-deep-500" />
              <span className="text-sm font-medium text-deep-600 bg-deep-50 px-2 py-1 rounded">
                普通录入模式
              </span>
            </>
          )}
        </div>

        {mileageWarning && !isBackfill && (
          <div className="bg-alert-red/5 border border-alert-red/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-alert-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-alert-red">里程异常</p>
              <p className="text-sm text-alert-red/80 mt-1">{mileageWarning}</p>
            </div>
          </div>
        )}

        {isBackfill && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
            <History className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-700">历史补录说明</p>
              <p className="text-sm text-orange-600 mt-1">
                补录模式不会更新车辆当前里程，适合录入遗漏的历史加油记录。系统会根据加油日期自动查找上次记录计算油耗。
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="label">
            <Truck className="w-4 h-4 inline mr-1 text-orange-500" />
            选择车辆 <span className="text-alert-red">*</span>
          </label>
          <select
            name="vehicleId"
            value={formData.vehicleId}
            onChange={handleChange}
            className={cn(
              "input",
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
              className={cn(
                "input num",
                errors.fuelAmount &&
                  "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
              )}
            />
            {errors.fuelAmount && (
              <p className="mt-1 text-xs text-alert-red">
                {errors.fuelAmount}
              </p>
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
              className={cn(
                "input num",
                errors.fuelCost &&
                  "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
              )}
            />
            {errors.fuelCost && (
              <p className="mt-1 text-xs text-alert-red">{errors.fuelCost}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              <DollarSign className="w-4 h-4 inline mr-1 text-deep-400" />
              计算单价
            </label>
            <div className="input num flex items-center justify-between bg-deep-50 text-deep-600">
              <span className="font-mono">{formatCurrency(pricePerLiter)}</span>
              <span className="text-xs text-deep-400">元 / 升</span>
            </div>
          </div>

          <div>
            <label className="label">
              <MapPin className="w-4 h-4 inline mr-1 text-orange-500" />
              加油站 <span className="text-alert-red">*</span>
            </label>
            <input
              type="text"
              name="gasStation"
              value={formData.gasStation}
              onChange={handleChange}
              placeholder="如：中石化XX加油站"
              className={cn(
                "input",
                errors.gasStation &&
                  "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
              )}
            />
            {errors.gasStation && (
              <p className="mt-1 text-xs text-alert-red">
                {errors.gasStation}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              <Calculator className="w-4 h-4 inline mr-1 text-fuel-500" />
              当前里程 (km) <span className="text-alert-red">*</span>
            </label>
            <input
              type="number"
              name="currentMileage"
              value={formData.currentMileage || ""}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className={cn(
                "input num",
                errors.currentMileage &&
                  "border-alert-red focus:ring-alert-red/30 focus:border-alert-red",
                mileageWarning &&
                  !isBackfill &&
                  "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
              )}
            />
            {errors.currentMileage && (
              <p className="mt-1 text-xs text-alert-red">
                {errors.currentMileage}
              </p>
            )}
          </div>

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
              className={cn(
                "input",
                errors.fuelDate &&
                  "border-alert-red focus:ring-alert-red/30 focus:border-alert-red"
              )}
            />
            {errors.fuelDate && (
              <p className="mt-1 text-xs text-alert-red">{errors.fuelDate}</p>
            )}
          </div>
        </div>

        <div>
          <label className="label">
            <FileText className="w-4 h-4 inline mr-1 text-deep-400" />
            备注
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="选填"
            rows={2}
            className="input resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            <X className="w-4 h-4" />
            取消
          </button>
          <button
            type="submit"
            className={cn(
              "btn-primary",
              mileageWarning && !isBackfill && "opacity-50 cursor-not-allowed"
            )}
            disabled={!!(mileageWarning && !isBackfill)}
          >
            <Save className="w-4 h-4" />
            {isBackfill ? "补录保存" : "保存记录"}
          </button>
        </div>
      </form>

      <FuelPreview
        vehicleId={formData.vehicleId}
        fuelAmount={formData.fuelAmount}
        currentMileage={formData.currentMileage}
        fuelDate={formData.fuelDate}
      />
    </div>
  );
}
