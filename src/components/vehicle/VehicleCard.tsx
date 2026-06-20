import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Fuel, Wrench, DollarSign, Edit2, Trash2, History, AlertTriangle } from "lucide-react";
import type { Vehicle } from "@/types";
import { useStore } from "@/store";
import { formatKm, formatConsumption, formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import DriverChangeHistory from "./DriverChangeHistory";

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
}

/**
 * 车辆卡片组件
 * 展示车辆概览信息，包含车牌号、车型、司机、里程进度和统计标签
 */
export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const navigate = useNavigate();
  const { getFuelRecordsByVehicle, getMaintenanceRecordsByVehicle, deleteVehicle } = useStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 计算车辆统计数据
  const fuelRecords = getFuelRecordsByVehicle(vehicle.id);
  const maintenanceRecords = getMaintenanceRecordsByVehicle(vehicle.id);

  // 平均油耗
  const consumptions = fuelRecords
    .map((r) => r.fuelConsumption)
    .filter((c): c is number => c !== null && c !== undefined);
  const avgConsumption =
    consumptions.length > 0
      ? consumptions.reduce((s, n) => s + n, 0) / consumptions.length
      : 0;

  // 累计费用（加油+维修）
  const totalFuelCost = fuelRecords.reduce((s, r) => s + r.fuelCost, 0);
  const totalMaintenanceCost = maintenanceRecords
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + r.cost, 0);
  const totalCost = totalFuelCost + totalMaintenanceCost;

  // 维修次数
  const maintenanceCount = maintenanceRecords.filter(
    (r) => r.status === "completed"
  ).length;

  // 里程进度（相对于初始里程，假设每10万公里一个周期）
  const maxMileage = 100000;
  const mileageProgress = Math.min(
    ((vehicle.currentMileage - vehicle.initialMileage) / maxMileage) * 100,
    100
  );

  // 司机首字
  const driverInitial = vehicle.driverName?.charAt(0) || "司";

  // 环形进度参数
  const strokeDasharray = 2 * Math.PI * 28;
  const strokeDashoffset = strokeDasharray * (1 - mileageProgress / 100);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/vehicles/${vehicle.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/vehicles/${vehicle.id}/edit`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowHistory(true);
  };

  const confirmDelete = () => {
    deleteVehicle(vehicle.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-alert-red/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-alert-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-deep-700">确认删除</h3>
                <p className="text-sm text-deep-400 mt-0.5">{vehicle.plateNumber}</p>
              </div>
            </div>
            <p className="text-sm text-deep-500 mb-6">
              删除后将同时清除该车辆的所有加油记录、维修记录和司机变更历史，此操作不可恢复。
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="btn-danger"
              >
                <Trash2 className="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <DriverChangeHistory
        vehicleId={vehicle.id}
        vehiclePlate={vehicle.plateNumber}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    <div
      onClick={handleClick}
      className={cn(
        "card p-5 cursor-pointer group",
        "rounded-[12px]"
      )}
    >
      {/* 顶部区域 */}
      <div className="flex items-start gap-4 mb-4">
        {/* 车型 emoji 头图 */}
        <div className="w-16 h-16 flex items-center justify-center bg-deep-50 rounded-xl text-4xl shrink-0 group-hover:scale-105 transition-transform">
          🚚
        </div>

        {/* 车牌号和车型 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-deep-700 tracking-wider truncate">
            {vehicle.plateNumber}
          </h3>
          <p className="text-sm text-deep-400 mt-0.5 truncate">
            {vehicle.model}
          </p>
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-deep-100 text-deep-400 hover:text-deep-600 transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-alert-red/10 text-deep-400 hover:text-alert-red transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleHistory}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-orange-50 text-deep-400 hover:text-orange-500 transition-colors"
            title="司机变更历史"
          >
            <History className="w-4 h-4" />
          </button>
        </div>

        {/* 司机头像 */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white font-semibold shrink-0">
          {driverInitial}
        </div>
      </div>

      {/* 中间区域：里程环形进度 */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex flex-col">
          <span className="text-xs text-deep-400 mb-1">当前里程</span>
          <span className="num text-lg font-semibold text-deep-600">
            {formatKm(vehicle.currentMileage)}
          </span>
        </div>

        {/* 环形进度条 */}
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#E8EEF7"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke={mileageProgress > 80 ? "#E74C3C" : "#FF6B35"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="num text-xs font-bold text-deep-600">
              {Math.round(mileageProgress)}%
            </span>
          </div>
        </div>
      </div>

      {/* 底部统计标签 */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-deep-50">
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-8 h-8 rounded-lg bg-fuel-50 flex items-center justify-center mb-1.5">
            <Fuel className="w-4 h-4 text-fuel-500" />
          </div>
          <span className="text-xs text-deep-400 mb-0.5">油耗均值</span>
          <span className="num text-sm font-semibold text-fuel-600">
            {formatConsumption(avgConsumption || null)}
          </span>
        </div>

        <div className="flex flex-col items-center text-center p-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mb-1.5">
            <DollarSign className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-xs text-deep-400 mb-0.5">累计费用</span>
          <span className="num text-sm font-semibold text-orange-600">
            {formatCurrency(totalCost, 0)}
          </span>
        </div>

        <div className="flex flex-col items-center text-center p-2">
          <div className="w-8 h-8 rounded-lg bg-repair-50 flex items-center justify-center mb-1.5">
            <Wrench className="w-4 h-4 text-repair-500" />
          </div>
          <span className="text-xs text-deep-400 mb-0.5">维修次数</span>
          <span className="num text-sm font-semibold text-repair-600">
            {maintenanceCount} 次
          </span>
        </div>
      </div>
    </div>
    </>
  );
}
