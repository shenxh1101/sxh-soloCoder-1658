import { useState, useRef, useEffect } from "react";
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
  Loader2,
  X,
  RotateCcw,
  Clock,
  User,
  History,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/store";
import {
  exportVehiclesToCSV,
  exportFuelToCSV,
  exportMaintenanceToCSV,
  downloadCSV,
} from "@/utils/csv";
import type {
  ImportResult,
  ImportEntityType,
  ImportPreviewResult,
  ImportPreviewItem,
  ImportBatch,
} from "@/types";
import { cn } from "@/lib/utils";

type ImportResultWithType = ImportResult & {
  entityType: ImportEntityType;
  timestamp: string;
  batchId?: string;
};

type TabType = "export" | "import" | "batches";

export default function SettingsPage() {
  const {
    vehicles,
    fuelRecords,
    maintenanceRecords,
    importFromCSVWithBatch,
    previewImportCSV,
    getImportBatches,
    rollbackImportBatch,
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabType>("export");
  const [importResults, setImportResults] = useState<ImportResultWithType | null>(
    null
  );
  const [showErrorList, setShowErrorList] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewResult, setPreviewResult] =
    useState<ImportPreviewResult | null>(null);
  const [previewEntityType, setPreviewEntityType] =
    useState<ImportEntityType | null>(null);
  const [currentCSVText, setCurrentCSVText] = useState<string>("");
  const [currentFileName, setCurrentFileName] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<{
    add: boolean;
    skip: boolean;
    error: boolean;
  }>({ add: true, skip: true, error: true });
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [rollbackBatch, setRollbackBatch] = useState<ImportBatch | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const vehicleInputRef = useRef<HTMLInputElement>(null);
  const fuelInputRef = useRef<HTMLInputElement>(null);
  const maintenanceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBatches(getImportBatches());
  }, [getImportBatches, importResults]);

  const refreshBatches = () => {
    setBatches(getImportBatches());
  };

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
    setImportResults(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const preview = previewImportCSV(entityType, csvText);

        setCurrentCSVText(csvText);
        setCurrentFileName(file.name);
        setPreviewResult(preview);
        setPreviewEntityType(entityType);
        setExpandedGroups({ add: true, skip: true, error: true });
      } catch (error) {
        setPreviewResult(null);
        setPreviewEntityType(null);
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
      setPreviewResult(null);
      setPreviewEntityType(null);
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

  const handleConfirmImport = () => {
    if (!previewEntityType || !currentCSVText) return;

    setIsImporting(true);
    try {
      const { batch, result } = importFromCSVWithBatch(
        previewEntityType,
        currentCSVText,
        currentFileName
      );

      setImportResults({
        ...result,
        entityType: previewEntityType,
        timestamp: new Date().toLocaleString("zh-CN"),
        batchId: batch.id,
      });
      setShowErrorList(result.errors.length > 0);
      setPreviewResult(null);
      setPreviewEntityType(null);
      setCurrentCSVText("");
      setCurrentFileName("");
      refreshBatches();
    } catch (error) {
      setImportResults({
        success: 0,
        failed: 1,
        skipped: 0,
        total: 0,
        errors: [
          {
            row: 0,
            message: error instanceof Error ? error.message : "导入失败",
          },
        ],
        entityType: previewEntityType,
        timestamp: new Date().toLocaleString("zh-CN"),
      });
      setShowErrorList(true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleRollback = async () => {
    if (!rollbackBatch) return;

    setIsRollingBack(true);
    try {
      const success = rollbackImportBatch(rollbackBatch.id);
      if (success) {
        refreshBatches();
        setRollbackBatch(null);
      }
    } finally {
      setIsRollingBack(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("zh-CN");
  };

  const getRollbackCount = (batch: ImportBatch) => {
    if (batch.entityType === "vehicle") {
      const vehicleIds = batch.recordIds;
      const relatedFuel = fuelRecords.filter((r) =>
        vehicleIds.includes(r.vehicleId)
      ).length;
      const relatedMaintenance = maintenanceRecords.filter((r) =>
        vehicleIds.includes(r.vehicleId)
      ).length;
      return {
        primary: batch.result.success,
        related: relatedFuel + relatedMaintenance,
      };
    }
    return { primary: batch.result.success, related: 0 };
  };

  const handleCancelPreview = () => {
    setPreviewResult(null);
    setPreviewEntityType(null);
    setCurrentCSVText("");
  };

  const toggleGroup = (group: "add" | "skip" | "error") => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const entityTypeLabels: Record<ImportEntityType, string> = {
    vehicle: "车辆档案",
    fuel: "加油记录",
    maintenance: "维修记录",
  };

  const getPreviewItemInfo = (item: ImportPreviewItem) => {
    const { data } = item;
    let plateNumber = "-";
    let keyInfo = "";
    let summary = "";

    if (previewEntityType === "vehicle") {
      plateNumber = data?.plateNumber || data?.[0] || "-";
      keyInfo = data?.model ? `车型：${data.model}` : "";
      const parts: string[] = [];
      if (data?.driverName) parts.push(`司机：${data.driverName}`);
      if (data?.initialMileage !== undefined)
        parts.push(`初始里程：${data.initialMileage}km`);
      summary = parts.join(" | ");
    } else if (previewEntityType === "fuel") {
      plateNumber = data?.plate || data?.[0] || "-";
      keyInfo = data?.fuelAmount ? `加油量：${data.fuelAmount}L` : "";
      const parts: string[] = [];
      if (data?.fuelCost) parts.push(`金额：¥${data.fuelCost}`);
      if (data?.currentMileage) parts.push(`里程：${data.currentMileage}km`);
      summary = parts.join(" | ");
    } else if (previewEntityType === "maintenance") {
      plateNumber = data?.plate || data?.[0] || "-";
      keyInfo = data?.type ? `类型：${data.type}` : "";
      const parts: string[] = [];
      if (data?.description) {
        const desc =
          data.description.length > 20
            ? data.description.slice(0, 20) + "..."
            : data.description;
        parts.push(`描述：${desc}`);
      }
      summary = parts.join(" | ");
    }

    return { plateNumber, keyInfo, summary };
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "export", label: "数据导出", icon: <Download className="w-4 h-4" /> },
    { id: "import", label: "数据导入", icon: <Upload className="w-4 h-4" /> },
    { id: "batches", label: "导入批次记录", icon: <History className="w-4 h-4" /> },
  ];

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

      <div className="flex items-center gap-1 p-1 bg-deep-50 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-white text-orange-600 shadow-sm"
                : "text-deep-500 hover:text-deep-700 hover:bg-deep-100/50"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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
      )}

      {activeTab === "import" && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
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

          {previewResult && previewEntityType && (
        <div className="card rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-deep-700">
                  导入预览
                </h2>
                <p className="text-xs text-deep-400">
                  {entityTypeLabels[previewEntityType]} · 共 {previewResult.total} 条数据
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelPreview}
              className="p-1.5 rounded-lg hover:bg-deep-100 transition-colors"
            >
              <X className="w-4 h-4 text-deep-400" />
            </button>
          </div>

          <div className="space-y-4 mb-6">
            <div className="border border-green-200 rounded-xl overflow-hidden bg-green-50/30">
              <button
                onClick={() => toggleGroup("add")}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-green-700">
                      将新增
                    </span>
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      {previewResult.willAdd.length} 条
                    </span>
                  </div>
                </div>
                {expandedGroups.add ? (
                  <ChevronUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-green-500" />
                )}
              </button>
              {expandedGroups.add && previewResult.willAdd.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <div className="divide-y divide-green-100">
                    {previewResult.willAdd.map((item, idx) => {
                      const info = getPreviewItemInfo(item);
                      return (
                        <div
                          key={idx}
                          className="px-4 py-3 flex items-start gap-3 hover:bg-green-50/50 transition-colors"
                        >
                          <span className="text-xs font-mono text-green-600 bg-green-100 px-2 py-0.5 rounded shrink-0 mt-0.5">
                            第 {item.row} 行
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-green-800">
                                {info.plateNumber}
                              </span>
                              {info.keyInfo && (
                                <span className="text-xs text-green-600">
                                  {info.keyInfo}
                                </span>
                              )}
                            </div>
                            {info.summary && (
                              <p className="text-xs text-green-600">
                                {info.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {expandedGroups.add && previewResult.willAdd.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-green-600">
                  暂无将新增的数据
                </div>
              )}
            </div>

            <div className="border border-yellow-200 rounded-xl overflow-hidden bg-yellow-50/30">
              <button
                onClick={() => toggleGroup("skip")}
                className="w-full flex items-center justify-between p-4 bg-yellow-50 hover:bg-yellow-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-yellow-700">
                      将跳过
                    </span>
                    <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">
                      {previewResult.willSkip.length} 条
                    </span>
                  </div>
                </div>
                {expandedGroups.skip ? (
                  <ChevronUp className="w-4 h-4 text-yellow-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-yellow-500" />
                )}
              </button>
              {expandedGroups.skip && previewResult.willSkip.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <div className="divide-y divide-yellow-100">
                    {previewResult.willSkip.map((item, idx) => {
                      const info = getPreviewItemInfo(item);
                      return (
                        <div
                          key={idx}
                          className="px-4 py-3 flex items-start gap-3 hover:bg-yellow-50/50 transition-colors"
                        >
                          <span className="text-xs font-mono text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded shrink-0 mt-0.5">
                            第 {item.row} 行
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-yellow-800">
                                {info.plateNumber}
                              </span>
                              {info.keyInfo && (
                                <span className="text-xs text-yellow-600">
                                  {info.keyInfo}
                                </span>
                              )}
                            </div>
                            {item.message && (
                              <p className="text-xs text-yellow-600 mb-1">
                                原因：{item.message}
                              </p>
                            )}
                            {info.summary && (
                              <p className="text-xs text-yellow-600/80">
                                {info.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {expandedGroups.skip && previewResult.willSkip.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-yellow-600">
                  暂无将跳过的数据
                </div>
              )}
            </div>

            <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50/30">
              <button
                onClick={() => toggleGroup("error")}
                className="w-full flex items-center justify-between p-4 bg-red-50 hover:bg-red-100/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <div className="text-left">
                    <span className="text-sm font-medium text-red-700">
                      将报错
                    </span>
                    <span className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      {previewResult.willError.length} 条
                    </span>
                  </div>
                </div>
                {expandedGroups.error ? (
                  <ChevronUp className="w-4 h-4 text-red-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-red-500" />
                )}
              </button>
              {expandedGroups.error && previewResult.willError.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  <div className="divide-y divide-red-100">
                    {previewResult.willError.map((item, idx) => {
                      const info = getPreviewItemInfo(item);
                      return (
                        <div
                          key={idx}
                          className="px-4 py-3 flex items-start gap-3 hover:bg-red-50/50 transition-colors"
                        >
                          <span className="text-xs font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded shrink-0 mt-0.5">
                            第 {item.row} 行
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-red-800">
                                {info.plateNumber}
                              </span>
                              {info.keyInfo && (
                                <span className="text-xs text-red-600">
                                  {info.keyInfo}
                                </span>
                              )}
                            </div>
                            {item.message && (
                              <p className="text-xs text-red-600 mb-1">
                                错误：{item.message}
                              </p>
                            )}
                            {info.summary && (
                              <p className="text-xs text-red-600/80">
                                {info.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {expandedGroups.error && previewResult.willError.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-red-600">
                  暂无将报错的数据
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-deep-50 rounded-xl">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-700 font-medium">
                  新增 {previewResult.willAdd.length} 条
                </span>
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-700 font-medium">
                  跳过 {previewResult.willSkip.length} 条
                </span>
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 font-medium">
                  报错 {previewResult.willError.length} 条
                </span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancelPreview}
                disabled={isImporting}
                className="px-4 py-2 text-sm font-medium text-deep-600 bg-white border border-deep-200 rounded-lg hover:bg-deep-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting || previewResult.willAdd.length === 0}
                className="px-5 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    确认导入
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {importResults.batchId && (
                      <p className="text-xs text-orange-600 mt-0.5">
                        批次号：{importResults.batchId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {importResults.batchId && (
                    <button
                      onClick={() => setActiveTab("batches")}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5" />
                      查看批次记录
                    </button>
                  )}
                  <div className="text-xs text-deep-400">
                    共处理 {importResults.total} 条数据
                  </div>
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
        </div>
      )}

      {activeTab === "batches" && (
        <div className="card rounded-[12px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <History className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-deep-700">导入批次记录</h2>
              <p className="text-xs text-deep-400">查看和管理历史导入批次，支持撤回操作</p>
            </div>
          </div>

          {batches.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-deep-300 mx-auto mb-3" />
              <p className="text-deep-500 text-sm">暂无导入批次记录</p>
              <button
                onClick={() => setActiveTab("import")}
                className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                去导入数据
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-deep-100">
                    <th className="text-left py-3 px-4 text-xs font-medium text-deep-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        导入时间
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-deep-500">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        文件名
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-deep-500">
                      数据类型
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-deep-500">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        导入人
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-deep-500">
                      结果
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-deep-500">
                      状态
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-deep-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const isExpanded = expandedBatchId === batch.id;
                    const rollbackInfo = getRollbackCount(batch);
                    return (
                      <>
                        <tr
                          key={batch.id}
                          className={cn(
                            "border-b border-deep-50 hover:bg-deep-50/50 transition-colors",
                            batch.rolledBack && "bg-deep-50/50"
                          )}
                        >
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={cn(
                                batch.rolledBack && "text-deep-400"
                              )}
                            >
                              {formatDateTime(batch.importedAt)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={cn(
                                "font-medium",
                                batch.rolledBack
                                  ? "text-deep-400"
                                  : "text-deep-700"
                              )}
                            >
                              {batch.fileName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                batch.entityType === "vehicle" &&
                                  "bg-blue-50 text-blue-700",
                                batch.entityType === "fuel" &&
                                  "bg-green-50 text-green-700",
                                batch.entityType === "maintenance" &&
                                  "bg-purple-50 text-purple-700",
                                batch.rolledBack &&
                                  "bg-deep-100 text-deep-500"
                              )}
                            >
                              {entityTypeLabels[batch.entityType]}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={cn(
                                batch.rolledBack && "text-deep-400"
                              )}
                            >
                              {batch.importedBy}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                                <span
                                  className={cn(
                                    "font-medium",
                                    batch.rolledBack
                                      ? "text-deep-400"
                                      : "text-green-700"
                                  )}
                                >
                                  {batch.result.success}
                                </span>
                              </span>
                              <span className="text-deep-200">|</span>
                              <span className="inline-flex items-center gap-1 text-xs">
                                <XCircle className="w-3.5 h-3.5 text-red-500" />
                                <span
                                  className={cn(
                                    "font-medium",
                                    batch.rolledBack
                                      ? "text-deep-400"
                                      : "text-red-700"
                                  )}
                                >
                                  {batch.result.failed}
                                </span>
                              </span>
                              <span className="text-deep-200">|</span>
                              <span className="inline-flex items-center gap-1 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                                <span
                                  className={cn(
                                    "font-medium",
                                    batch.rolledBack
                                      ? "text-deep-400"
                                      : "text-yellow-700"
                                  )}
                                >
                                  {batch.result.skipped}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {batch.rolledBack ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-deep-100 text-deep-500">
                                <RotateCcw className="w-3 h-3" />
                                已撤回
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                已导入
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() =>
                                  setExpandedBatchId(
                                    isExpanded ? null : batch.id
                                  )
                                }
                                className="p-1.5 rounded-lg hover:bg-deep-100 transition-colors text-deep-500 hover:text-deep-700"
                                title={isExpanded ? "收起详情" : "展开详情"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              {!batch.rolledBack && (
                                <button
                                  onClick={() => setRollbackBatch(batch)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  撤回
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-deep-50/30">
                            <td colSpan={7} className="py-4 px-6">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-deep-500 mb-1">
                                      批次ID
                                    </p>
                                    <p className="text-sm font-mono text-deep-700">
                                      {batch.id}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-deep-500 mb-1">
                                      导入记录数
                                    </p>
                                    <p className="text-sm text-deep-700">
                                      {batch.recordIds.length} 条
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-deep-500 mb-1">
                                      总处理数
                                    </p>
                                    <p className="text-sm text-deep-700">
                                      {batch.result.total} 条
                                    </p>
                                  </div>
                                  {batch.rolledBack && batch.rolledBackAt && (
                                    <div>
                                      <p className="text-xs text-deep-500 mb-1">
                                        撤回时间
                                      </p>
                                      <p className="text-sm text-deep-700">
                                        {formatDateTime(batch.rolledBackAt)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                {batch.result.errors.length > 0 && (
                                  <div>
                                    <p className="text-xs text-deep-500 mb-2 font-medium">
                                      错误详情 ({batch.result.errors.length} 条)
                                    </p>
                                    <div className="max-h-40 overflow-y-auto border border-deep-100 rounded-lg">
                                      <div className="divide-y divide-deep-50">
                                        {batch.result.errors.map(
                                          (error, idx) => (
                                            <div
                                              key={idx}
                                              className="px-3 py-2 flex items-start gap-2 text-sm"
                                            >
                                              <span className="text-xs font-mono text-deep-400 bg-deep-100 px-1.5 py-0.5 rounded shrink-0">
                                                {error.row > 0
                                                  ? `第 ${error.row} 行`
                                                  : "系统"}
                                              </span>
                                              <span className="text-deep-600">
                                                {error.message}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {!batch.rolledBack && (
                                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                                      <span className="text-sm text-orange-800">
                                        撤回将删除
                                        <span className="font-semibold">
                                          {" "}
                                          {rollbackInfo.primary}{" "}
                                        </span>
                                        条
                                        {entityTypeLabels[batch.entityType]}
                                        记录
                                        {rollbackInfo.related > 0 && (
                                          <>
                                            ，以及关联的{" "}
                                            <span className="font-semibold">
                                              {rollbackInfo.related}
                                            </span>{" "}
                                            条其他数据
                                          </>
                                        )}
                                        ，此操作不可撤销
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => setRollbackBatch(batch)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      撤回此批次
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {rollbackBatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-deep-800">
                  确认撤回批次
                </h3>
                <p className="text-sm text-deep-500">
                  {rollbackBatch.fileName}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm text-red-800 leading-relaxed">
                  此操作将删除该批次导入的所有数据，包括：
                </p>
                <ul className="mt-2 space-y-1.5">
                  <li className="flex items-center gap-2 text-sm text-red-700">
                    <CheckCircle className="w-4 h-4 text-red-500" />
                    <span>
                      <span className="font-semibold">
                        {getRollbackCount(rollbackBatch).primary}
                      </span>{" "}
                      条{entityTypeLabels[rollbackBatch.entityType]}记录
                    </span>
                  </li>
                  {getRollbackCount(rollbackBatch).related > 0 && (
                    <li className="flex items-center gap-2 text-sm text-red-700">
                      <CheckCircle className="w-4 h-4 text-red-500" />
                      <span>
                        <span className="font-semibold">
                          {getRollbackCount(rollbackBatch).related}
                        </span>{" "}
                        条关联数据（加油、维修、规则等）
                      </span>
                    </li>
                  )}
                </ul>
                <p className="mt-3 text-xs text-red-600 font-medium">
                  ⚠️ 此操作不可撤销，请谨慎操作
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-deep-500 mb-1">批次ID</p>
                  <p className="font-mono text-deep-700">{rollbackBatch.id}</p>
                </div>
                <div>
                  <p className="text-deep-500 mb-1">导入时间</p>
                  <p className="text-deep-700">
                    {formatDateTime(rollbackBatch.importedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setRollbackBatch(null)}
                disabled={isRollingBack}
                className="flex-1 px-4 py-2.5 rounded-xl border border-deep-200 text-deep-700 font-medium hover:bg-deep-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleRollback}
                disabled={isRollingBack}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRollingBack ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    撤回中...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    确认撤回
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
