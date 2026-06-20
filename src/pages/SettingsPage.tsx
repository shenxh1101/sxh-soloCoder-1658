import { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Truck,
  Fuel,
  Wrench,
} from "lucide-react";
import { useStore } from "@/store";
import {
  exportVehiclesToCSV,
  exportFuelToCSV,
  exportMaintenanceToCSV,
  downloadCSV,
} from "@/utils/csv";
import type { ImportResult, ImportEntityType } from "@/types";
import { cn } from "@/lib/utils";

type ImportResultWithType = ImportResult & {
  entityType: ImportEntityType;
  timestamp: string;
};

export default function SettingsPage() {
  const { vehicles, fuelRecords, maintenanceRecords, importFromCSV } = useStore();

  const [importResults, setImportResults] = useState<ImportResultWithType | null>(
    null
  );
  const [showErrorList, setShowErrorList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const vehicleInputRef = useRef<HTMLInputElement>(null);
  const fuelInputRef = useRef<HTMLInputElement>(null);
  const maintenanceInputRef = useRef<HTMLInputElement>(null);

  const vehicleMap = vehicles.reduce<Record<string, string>>((acc, v) => {
    acc[v.id] = v.plateNumber;
    return acc;
  }, {});

  const handleExportVehicles = () => {
    const csv = exportVehiclesToCSV(vehicles);
    downloadCSV(csv, `车辆档案_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportFuel = () => {
    const csv = exportFuelToCSV(fuelRecords, vehicleMap);
    downloadCSV(csv, `加油记录_${new Date().toISOString().split("T")[0]}.csv`);
  };

  const handleExportMaintenance = () => {
    const csv = exportMaintenanceToCSV(maintenanceRecords, vehicleMap);
    downloadCSV(
      csv,
      `维修记录_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const handleDownloadTemplate = (type: ImportEntityType) => {
    let content = "";
    let filename = "";

    if (type === "vehicle") {
      content =
        "车牌号,车型,初始里程,当前里程,司机姓名,司机电话,购车日期,备注\n京A12345,丰田凯美瑞,0,0,张三,13800138000,2023-01-01,示例数据";
      filename = "车辆档案导入模板.csv";
    } else if (type === "fuel") {
      content =
        "车牌号,加油日期,加油量(L),金额(元),单价(元/L),当前里程,百公里油耗(L),加油站,来源,备注\n京A12345,2024-01-15,50,350,7,10000,8.5,中石化,正常,示例数据";
      filename = "加油记录导入模板.csv";
    } else if (type === "maintenance") {
      content =
        "车牌号,维修类型,故障描述,维修厂,费用(元),维修后里程,申请日期,完成日期,状态,备注\n京A12345,常规保养,定期保养,4S店,500,10500,2024-01-10,2024-01-10,已完成,示例数据";
      filename = "维修记录导入模板.csv";
    }

    downloadCSV(content, filename);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    entityType: ImportEntityType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const result = importFromCSV(entityType, csvText);

        setImportResults({
          ...result,
          entityType,
          timestamp: new Date().toLocaleString("zh-CN"),
        });
        setShowErrorList(result.errors.length > 0);
      } catch (error) {
        setImportResults({
          success: 0,
          failed: 1,
          skipped: 0,
          total: 0,
          errors: [
            {
              row: 0,
              message:
                error instanceof Error ? error.message : "文件解析失败",
            },
          ],
          entityType,
          timestamp: new Date().toLocaleString("zh-CN"),
        });
        setShowErrorList(true);
      } finally {
        setIsImporting(false);
        if (e.target) {
          e.target.value = "";
        }
      }
    };

    reader.onerror = () => {
      setImportResults({
        success: 0,
        failed: 1,
        skipped: 0,
        total: 0,
        errors: [{ row: 0, message: "文件读取失败" }],
        entityType,
        timestamp: new Date().toLocaleString("zh-CN"),
      });
      setShowErrorList(true);
      setIsImporting(false);
    };

    reader.readAsText(file, "UTF-8");
  };

  const entityTypeLabels: Record<ImportEntityType, string> = {
    vehicle: "车辆档案",
    fuel: "加油记录",
    maintenance: "维修记录",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="page-title">系统设置</h1>
            <p className="text-deep-400 mt-1 text-sm">
              数据导入导出与系统配置管理
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card rounded-[12px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-fuel-50 flex items-center justify-center">
              <Download className="w-4 h-4 text-fuel-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-deep-700">
                数据导出
              </h2>
              <p className="text-xs text-deep-400">将系统数据导出为CSV格式</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleExportVehicles}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-deep-100 bg-white hover:bg-deep-50/50 hover:border-orange-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-deep-700">导出车辆档案</p>
                  <p className="text-xs text-deep-400">
                    共 {vehicles.length} 条记录
                  </p>
                </div>
              </div>
              <Download className="w-5 h-5 text-deep-400 group-hover:text-orange-500 transition-colors" />
            </button>

            <button
              onClick={handleExportFuel}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-deep-100 bg-white hover:bg-deep-50/50 hover:border-orange-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <Fuel className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-deep-700">导出加油记录</p>
                  <p className="text-xs text-deep-400">
                    共 {fuelRecords.length} 条记录
                  </p>
                </div>
              </div>
              <Download className="w-5 h-5 text-deep-400 group-hover:text-orange-500 transition-colors" />
            </button>

            <button
              onClick={handleExportMaintenance}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-deep-100 bg-white hover:bg-deep-50/50 hover:border-orange-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-deep-700">导出维修记录</p>
                  <p className="text-xs text-deep-400">
                    共 {maintenanceRecords.length} 条记录
                  </p>
                </div>
              </div>
              <Download className="w-5 h-5 text-deep-400 group-hover:text-orange-500 transition-colors" />
            </button>
          </div>
        </div>

        <div className="card rounded-[12px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
              <Upload className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-deep-700">
                数据导入
              </h2>
              <p className="text-xs text-deep-400">从CSV文件批量导入数据</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="file"
                ref={vehicleInputRef}
                accept=".csv"
                onChange={(e) => handleFileSelect(e, "vehicle")}
                className="hidden"
                disabled={isImporting}
              />
              <button
                onClick={() => vehicleInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-deep-200 bg-deep-50/30 hover:bg-deep-50 hover:border-orange-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-deep-700">导入车辆档案</p>
                    <p className="text-xs text-deep-400">
                      选择CSV文件导入车辆数据
                    </p>
                  </div>
                </div>
                <Upload className="w-5 h-5 text-deep-400 group-hover:text-orange-500 transition-colors" />
              </button>
            </div>

            <div className="relative">
              <input
                type="file"
                ref={fuelInputRef}
                accept=".csv"
                onChange={(e) => handleFileSelect(e, "fuel")}
                className="hidden"
                disabled={isImporting}
              />
              <button
                onClick={() => fuelInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-deep-200 bg-deep-50/30 hover:bg-deep-50 hover:border-orange-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <Fuel className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-deep-700">导入加油记录</p>
                    <p className="text-xs text-deep-400">
                      选择CSV文件导入加油数据
                    </p>
                  </div>
                </div>
                <Upload className="w-5 h-5 text-deep-400 group-hover:text-orange-500 transition-colors" />
              </button>
            </div>

            <div className="relative">
              <input
                type="file"
                ref={maintenanceInputRef}
                accept=".csv"
                onChange={(e) => handleFileSelect(e, "maintenance")}
                className="hidden"
                disabled={isImporting}
              />
              <button
                onClick={() => maintenanceInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-deep-200 bg-deep-50/30 hover:bg-deep-50 hover:border-orange-300 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <Wrench className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-deep-700">导入维修记录</p>
                    <p className="text-xs text-deep-400">
                      选择CSV文件导入维修数据
                    </p>
                  </div>
                </div>
                <Upload className="w-5 h-5 text-deep-400 group-hover:text-orange-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {importResults && (
        <div className="card rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-deep-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-deep-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-deep-700">
                  导入结果
                </h2>
                <p className="text-xs text-deep-400">
                  {entityTypeLabels[importResults.entityType]} ·{" "}
                  {importResults.timestamp}
                </p>
              </div>
            </div>
            <div className="text-xs text-deep-400">
              共处理 {importResults.total} 条数据
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">成功</span>
              </div>
              <p className="text-2xl font-bold text-green-600 num">
                {importResults.success}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-700">失败</span>
              </div>
              <p className="text-2xl font-bold text-red-600 num">
                {importResults.failed}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">跳过</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600 num">
                {importResults.skipped}
              </p>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="border border-deep-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowErrorList(!showErrorList)}
                className="w-full flex items-center justify-between p-4 bg-deep-50/50 hover:bg-deep-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-deep-500" />
                  <span className="text-sm font-medium text-deep-700">
                    错误详情 ({importResults.errors.length} 条)
                  </span>
                </div>
                {showErrorList ? (
                  <ChevronUp className="w-4 h-4 text-deep-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-deep-400" />
                )}
              </button>
              {showErrorList && (
                <div className="max-h-60 overflow-y-auto">
                  <div className="divide-y divide-deep-50">
                    {importResults.errors.map((error, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 flex items-start gap-3 hover:bg-deep-50/30 transition-colors"
                      >
                        <span className="text-xs font-mono text-deep-400 bg-deep-100 px-2 py-0.5 rounded shrink-0 mt-0.5">
                          {error.row > 0 ? `第 ${error.row} 行` : "系统"}
                        </span>
                        <span className="text-sm text-deep-600">
                          {error.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card rounded-[12px] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-deep-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-deep-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-deep-700">模板下载</h2>
            <p className="text-xs text-deep-400">
              下载CSV导入模板，按照格式填写数据后导入
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleDownloadTemplate("vehicle")}
            className="flex items-center gap-3 p-4 rounded-xl border border-deep-100 bg-white hover:bg-blue-50/50 hover:border-blue-200 transition-all group text-left"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-blue-50 group-hover:bg-blue-100 transition-colors"
              )}
            >
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-deep-700 text-sm">车辆档案模板</p>
              <p className="text-xs text-deep-400 truncate">包含车牌号、车型等字段</p>
            </div>
            <Download className="w-4 h-4 text-deep-400 group-hover:text-blue-500 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => handleDownloadTemplate("fuel")}
            className="flex items-center gap-3 p-4 rounded-xl border border-deep-100 bg-white hover:bg-green-50/50 hover:border-green-200 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Fuel className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-deep-700 text-sm">加油记录模板</p>
              <p className="text-xs text-deep-400 truncate">包含加油量、金额等字段</p>
            </div>
            <Download className="w-4 h-4 text-deep-400 group-hover:text-green-500 transition-colors shrink-0" />
          </button>

          <button
            onClick={() => handleDownloadTemplate("maintenance")}
            className="flex items-center gap-3 p-4 rounded-xl border border-deep-100 bg-white hover:bg-purple-50/50 hover:border-purple-200 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Wrench className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-deep-700 text-sm">维修记录模板</p>
              <p className="text-xs text-deep-400 truncate">包含维修类型、费用等字段</p>
            </div>
            <Download className="w-4 h-4 text-deep-400 group-hover:text-purple-500 transition-colors shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
