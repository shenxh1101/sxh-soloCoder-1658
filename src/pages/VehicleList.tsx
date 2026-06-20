import { useState, useMemo } from "react";
import { Plus, Search, Package, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/store";
import VehicleCard from "@/components/vehicle/VehicleCard";
import VehicleForm from "@/components/vehicle/VehicleForm";
import EmptyState from "@/components/common/EmptyState";

/**
 * 车辆档案列表页面
 * - 展示所有车辆卡片网格
 * - 支持按车牌号/司机名搜索过滤
 * - 提供新增车辆入口
 * - 路由 /vehicles/new 显示新增表单
 * - 路由 /vehicles/:id/edit 显示编辑表单
 */
export default function VehicleList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vehicles, getVehicleById } = useStore();

  const pathMatch = useMemo(() => {
    const path = location.pathname;
    const newMatch = path === "/vehicles/new";
    const editMatch = path.match(/^\/vehicles\/([^/]+)\/edit$/);
    return {
      isNewPage: newMatch,
      isEditPage: !!editMatch,
      editVehicleId: editMatch ? editMatch[1] : null,
    };
  }, [location.pathname]);

  const { isNewPage, isEditPage, editVehicleId } = pathMatch;

  const [keyword, setKeyword] = useState("");

  const filteredVehicles = useMemo(() => {
    if (!keyword.trim()) return vehicles;
    const kw = keyword.trim().toLowerCase();
    return vehicles.filter(
      (v) =>
        v.plateNumber.toLowerCase().includes(kw) ||
        v.driverName.toLowerCase().includes(kw)
    );
  }, [vehicles, keyword]);

  const handleAddVehicle = () => {
    navigate("/vehicles/new");
  };

  const handleBack = () => {
    navigate("/vehicles");
  };

  const handleFormSuccess = () => {
    navigate("/vehicles");
  };

  if (isNewPage) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
            <div>
              <h1 className="page-title">新增车辆档案</h1>
              <p className="text-deep-400 mt-1 text-sm">填写车辆基本信息创建车辆档案</p>
            </div>
          </div>
        </div>
        <div className="card p-6 rounded-[12px] max-w-3xl">
          <VehicleForm onSuccess={handleFormSuccess} onCancel={handleBack} />
        </div>
      </div>
    );
  }

  if (isEditPage && editVehicleId) {
    const vehicle = getVehicleById(editVehicleId);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </button>
            <div>
              <h1 className="page-title">编辑车辆档案</h1>
              <p className="text-deep-400 mt-1 text-sm">
                {vehicle ? `修改 ${vehicle.plateNumber} 的车辆信息` : "车辆不存在或已被删除"}
              </p>
            </div>
          </div>
        </div>
        {vehicle ? (
          <div className="card p-6 rounded-[12px] max-w-3xl">
            <VehicleForm
              vehicleId={editVehicleId}
              onSuccess={handleFormSuccess}
              onCancel={handleBack}
              onDelete={handleBack}
            />
          </div>
        ) : (
          <div className="card p-12 rounded-[12px] text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-deep-200" />
            <p className="text-deep-400 mb-4">车辆不存在或已被删除</p>
            <button onClick={handleBack} className="btn-primary">
              返回列表
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">车辆档案</h1>
          <p className="text-deep-400 mt-1 text-sm">
            共 {vehicles.length} 辆车
            {keyword && ` · 已筛选 ${filteredVehicles.length} 辆`}
          </p>
        </div>
        <button onClick={handleAddVehicle} className="btn-primary">
          <Plus className="w-4 h-4" />
          新增车辆
        </button>
      </div>

      <div className="card p-4 rounded-[12px]">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-300" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索车牌号或司机姓名..."
            className="input !pl-10"
          />
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <EmptyState
          icon={Package}
          title={keyword ? "未找到匹配的车辆" : "暂无车辆档案"}
          description={
            keyword
              ? "请尝试调整搜索关键词或清除筛选条件"
              : "点击右上角「新增车辆」按钮添加第一辆车"
          }
          action={
            !keyword && (
              <button onClick={handleAddVehicle} className="btn-primary">
                <Plus className="w-4 h-4" />
                新增车辆
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
