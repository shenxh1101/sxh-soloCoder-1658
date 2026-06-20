import { useState, useEffect } from "react";
import { Truck, User, Phone, Calendar, FileText, Save, X } from "lucide-react";
import { useStore } from "@/store";
import { formatDate } from "@/utils/formatters";
import { formatYMD } from "@/utils/calculations";
import { cn } from "@/lib/utils";

interface VehicleFormProps {
  vehicleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * 车辆新增/编辑表单组件
 * - vehicleId 存在时为编辑模式，否则为新增模式
 * - 支持回调通知外部操作完成
 */
export default function VehicleForm({
  vehicleId,
  onSuccess,
  onCancel,
}: VehicleFormProps) {
  const { addVehicle, updateVehicle, getVehicleById } = useStore();
  const isEdit = !!vehicleId;

  // 表单状态
  const [formData, setFormData] = useState({
    plateNumber: "",
    model: "",
    initialMileage: 0,
    currentMileage: 0,
    driverName: "",
    driverPhone: "",
    purchaseDate: formatYMD(new Date()),
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 编辑模式：加载现有数据
  useEffect(() => {
    if (isEdit && vehicleId) {
      const vehicle = getVehicleById(vehicleId);
      if (vehicle) {
        setFormData({
          plateNumber: vehicle.plateNumber,
          model: vehicle.model,
          initialMileage: vehicle.initialMileage,
          currentMileage: vehicle.currentMileage,
          driverName: vehicle.driverName,
          driverPhone: vehicle.driverPhone,
          purchaseDate: formatDate(vehicle.purchaseDate),
          notes: vehicle.notes || "",
        });
      }
    }
  }, [isEdit, vehicleId, getVehicleById]);

  // 表单字段变更
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Mileage") ? Number(value) || 0 : value,
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

  // 表单校验
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = "请输入车牌号";
    }
    if (!formData.model.trim()) {
      newErrors.model = "请输入车型";
    }
    if (formData.initialMileage < 0) {
      newErrors.initialMileage = "初始里程不能为负数";
    }
    if (formData.currentMileage < formData.initialMileage) {
      newErrors.currentMileage = "当前里程不能小于初始里程";
    }
    if (!formData.driverName.trim()) {
      newErrors.driverName = "请输入司机姓名";
    }
    if (!formData.driverPhone.trim()) {
      newErrors.driverPhone = "请输入司机电话";
    }
    if (!/^1[3-9]\d{9}$/.test(formData.driverPhone)) {
      newErrors.driverPhone = "请输入正确的手机号";
    }
    if (!formData.purchaseDate) {
      newErrors.purchaseDate = "请选择购车日期";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit && vehicleId) {
      updateVehicle(vehicleId, {
        ...formData,
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
      });
    } else {
      addVehicle({
        ...formData,
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
      });
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 车牌号 + 车型 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">
            <Truck className="w-4 h-4 inline mr-1 text-orange-500" />
            车牌号 <span className="text-alert-red">*</span>
          </label>
          <input
            type="text"
            name="plateNumber"
            value={formData.plateNumber}
            onChange={handleChange}
            placeholder="例如：沪A12345"
            className={cn("input", errors.plateNumber && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.plateNumber && (
            <p className="mt-1 text-xs text-alert-red">{errors.plateNumber}</p>
          )}
        </div>

        <div>
          <label className="label">
            车型 <span className="text-alert-red">*</span>
          </label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="例如：东风天龙 KL"
            className={cn("input", errors.model && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.model && (
            <p className="mt-1 text-xs text-alert-red">{errors.model}</p>
          )}
        </div>
      </div>

      {/* 初始里程 + 当前里程 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">初始里程 (km)</label>
          <input
            type="number"
            name="initialMileage"
            value={formData.initialMileage}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={cn("input num", errors.initialMileage && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.initialMileage && (
            <p className="mt-1 text-xs text-alert-red">{errors.initialMileage}</p>
          )}
        </div>

        <div>
          <label className="label">
            当前里程 (km) <span className="text-alert-red">*</span>
          </label>
          <input
            type="number"
            name="currentMileage"
            value={formData.currentMileage}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={cn("input num", errors.currentMileage && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.currentMileage && (
            <p className="mt-1 text-xs text-alert-red">{errors.currentMileage}</p>
          )}
        </div>
      </div>

      {/* 司机姓名 + 司机电话 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">
            <User className="w-4 h-4 inline mr-1 text-deep-400" />
            司机姓名 <span className="text-alert-red">*</span>
          </label>
          <input
            type="text"
            name="driverName"
            value={formData.driverName}
            onChange={handleChange}
            placeholder="请输入司机姓名"
            className={cn("input", errors.driverName && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.driverName && (
            <p className="mt-1 text-xs text-alert-red">{errors.driverName}</p>
          )}
        </div>

        <div>
          <label className="label">
            <Phone className="w-4 h-4 inline mr-1 text-deep-400" />
            司机电话 <span className="text-alert-red">*</span>
          </label>
          <input
            type="tel"
            name="driverPhone"
            value={formData.driverPhone}
            onChange={handleChange}
            placeholder="请输入手机号"
            className={cn("input", errors.driverPhone && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
          />
          {errors.driverPhone && (
            <p className="mt-1 text-xs text-alert-red">{errors.driverPhone}</p>
          )}
        </div>
      </div>

      {/* 购车日期 */}
      <div>
        <label className="label">
          <Calendar className="w-4 h-4 inline mr-1 text-deep-400" />
          购车日期 <span className="text-alert-red">*</span>
        </label>
        <input
          type="date"
          name="purchaseDate"
          value={formData.purchaseDate}
          onChange={handleChange}
          className={cn("input", errors.purchaseDate && "border-alert-red focus:ring-alert-red/30 focus:border-alert-red")}
        />
        {errors.purchaseDate && (
          <p className="mt-1 text-xs text-alert-red">{errors.purchaseDate}</p>
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
          placeholder="可填写车辆保险、年检等信息..."
          rows={3}
          className="input resize-none"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            <X className="w-4 h-4" />
            取消
          </button>
        )}
        <button type="submit" className="btn-primary">
          <Save className="w-4 h-4" />
          {isEdit ? "保存修改" : "新增车辆"}
        </button>
      </div>
    </form>
  );
}
