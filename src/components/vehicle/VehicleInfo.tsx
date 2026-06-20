import { Truck, Calendar, Phone, User, Fuel, Wrench, DollarSign, FileText, Edit, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import {
  formatKm,
  formatDate,
  formatCurrency,
  formatLiters,
} from "@/utils/formatters";
import { cn } from "@/lib/utils";

interface VehicleInfoProps {
  vehicleId: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * 车辆信息详情卡组件
 * 展示完整车辆档案信息、累计统计数据和司机联系方式
 */
export default function VehicleInfo({
  vehicleId,
  onEdit,
  onDelete,
}: VehicleInfoProps) {
  const {
    getVehicleById,
    getFuelRecordsByVehicle,
    getMaintenanceRecordsByVehicle,
  } = useStore();

  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    return (
      <div className="card p-8 text-center text-deep-400">
        未找到该车辆信息
      </div>
    );
  }

  // 计算累计统计数据
  const fuelRecords = getFuelRecordsByVehicle(vehicleId);
  const maintenanceRecords = getMaintenanceRecordsByVehicle(vehicleId);
  const completedMaintenances = maintenanceRecords.filter(
    (r) => r.status === "completed"
  );

  // 累计油耗量
  const totalFuelAmount = fuelRecords.reduce((s, r) => s + r.fuelAmount, 0);
  // 累计油耗费用
  const totalFuelCost = fuelRecords.reduce((s, r) => s + r.fuelCost, 0);
  // 累计维修费用
  const totalMaintenanceCost = completedMaintenances.reduce(
    (s, r) => s + r.cost,
    0
  );
  // 累计维修次数
  const maintenanceCount = completedMaintenances.length;

  // 司机首字
  const driverInitial = vehicle.driverName?.charAt(0) || "司";

  // 信息项组件
  const InfoItem = ({
    icon,
    label,
    value,
    highlight,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    highlight?: string;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-deep-50/60 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-deep-50 flex items-center justify-center shrink-0 text-deep-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-deep-400 mb-0.5">{label}</p>
        <p
          className={cn(
            "text-sm font-medium text-deep-700 truncate",
            highlight && highlight
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );

  // 统计卡片组件
  const StatCard = ({
    icon,
    label,
    value,
    iconBg,
    iconColor,
    valueColor,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    iconBg: string;
    iconColor: string;
    valueColor: string;
  }) => (
    <div className="p-4 bg-deep-50/50 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            iconBg
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-xs text-deep-500 font-medium">{label}</span>
      </div>
      <p className={cn("num text-xl font-bold", valueColor)}>{value}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 车辆头部信息 */}
      <div className="card p-6 rounded-[12px]">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-5">
            {/* 车辆图标 */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-deep-500 to-deep-600 flex items-center justify-center text-5xl shrink-0 shadow-lg">
              🚚
            </div>

            {/* 车辆基本信息 */}
            <div>
              <h2 className="text-2xl font-bold text-deep-700 tracking-wider mb-1">
                {vehicle.plateNumber}
              </h2>
              <p className="text-base text-deep-500 mb-2">{vehicle.model}</p>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  购车于 {formatDate(vehicle.purchaseDate)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-deep-50 text-deep-600 text-xs font-medium">
                  <Truck className="w-3.5 h-3.5" />
                  初始里程 {formatKm(vehicle.initialMileage)}
                </span>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="btn-secondary !px-3 !py-2"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete} className="btn-danger">
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              )}
            </div>
          )}
        </div>

        {/* 当前里程大卡片 */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-deep-600 to-deep-500 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70 mb-1">当前里程</p>
              <p className="num text-4xl font-bold">
                {formatKm(vehicle.currentMileage)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/70 mb-1">已行驶</p>
              <p className="num text-2xl font-semibold">
                {formatKm(vehicle.currentMileage - vehicle.initialMileage)}
              </p>
            </div>
          </div>
        </div>

        {/* 累计统计数据 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Fuel className="w-5 h-5" />}
            label="累计油耗量"
            value={formatLiters(totalFuelAmount)}
            iconBg="bg-fuel-50"
            iconColor="text-fuel-500"
            valueColor="text-fuel-600"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="累计油费"
            value={formatCurrency(totalFuelCost, 0)}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            valueColor="text-orange-600"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="累计维修费"
            value={formatCurrency(totalMaintenanceCost, 0)}
            iconBg="bg-repair-50"
            iconColor="text-repair-500"
            valueColor="text-repair-600"
          />
          <StatCard
            icon={<Wrench className="w-5 h-5" />}
            label="维修次数"
            value={`${maintenanceCount} 次`}
            iconBg="bg-deep-50"
            iconColor="text-deep-500"
            valueColor="text-deep-600"
          />
        </div>
      </div>

      {/* 车辆档案 + 司机信息 */}
      <div className="grid grid-cols-2 gap-5">
        {/* 车辆档案 */}
        <div className="card p-5 rounded-[12px]">
          <h3 className="section-title mb-4">
            <div className="w-8 h-8 rounded-lg bg-deep-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-deep-600" />
            </div>
            车辆档案
          </h3>
          <div className="divide-y divide-deep-50/60 -mt-3">
            <InfoItem
              icon={<Truck className="w-4.5 h-4.5" />}
              label="车牌号"
              value={vehicle.plateNumber}
              highlight="tracking-wider"
            />
            <InfoItem
              icon={<Truck className="w-4.5 h-4.5" />}
              label="车型"
              value={vehicle.model}
            />
            <InfoItem
              icon={<Calendar className="w-4.5 h-4.5" />}
              label="购车日期"
              value={formatDate(vehicle.purchaseDate)}
            />
            <InfoItem
              icon={<Truck className="w-4.5 h-4.5" />}
              label="初始里程"
              value={formatKm(vehicle.initialMileage)}
            />
            <InfoItem
              icon={<Truck className="w-4.5 h-4.5" />}
              label="当前里程"
              value={formatKm(vehicle.currentMileage)}
              highlight="text-orange-600 font-semibold"
            />
            {vehicle.notes && (
              <InfoItem
                icon={<FileText className="w-4.5 h-4.5" />}
                label="备注"
                value={vehicle.notes}
              />
            )}
          </div>
        </div>

        {/* 司机信息卡片 */}
        <div className="card p-5 rounded-[12px]">
          <h3 className="section-title mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <User className="w-4 h-4 text-orange-500" />
            </div>
            所属司机
          </h3>

          {/* 司机头像和基本信息 */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-orange-50 to-deep-50 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-md">
              {driverInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-deep-700">
                {vehicle.driverName}
              </p>
              <p className="text-sm text-deep-500 flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5" />
                {vehicle.driverPhone}
              </p>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="space-y-3">
            <a
              href={`tel:${vehicle.driverPhone}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              拨打电话
            </a>
            <div className="p-4 rounded-xl bg-deep-50/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-deep-500">司机姓名</span>
                <span className="text-deep-700 font-medium">
                  {vehicle.driverName}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-deep-500">联系电话</span>
                <span className="num text-deep-700 font-medium">
                  {vehicle.driverPhone}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-deep-500">负责车辆</span>
                <span className="text-deep-700 font-medium tracking-wider">
                  {vehicle.plateNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
