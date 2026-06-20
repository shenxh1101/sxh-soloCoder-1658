import { X, User, Phone, Calendar } from "lucide-react";
import { useStore } from "@/store";
import type { DriverChangeRecord } from "@/types";
import { formatDate } from "@/utils/formatters";

interface DriverChangeHistoryProps {
  vehicleId: string;
  vehiclePlate: string;
  open: boolean;
  onClose: () => void;
}

export default function DriverChangeHistory({
  vehicleId,
  vehiclePlate,
  open,
  onClose,
}: DriverChangeHistoryProps) {
  const { getDriverChangesByVehicle } = useStore();
  const records = getDriverChangesByVehicle(vehicleId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-deep-100">
          <div>
            <h2 className="text-lg font-semibold text-deep-700">司机变更历史</h2>
            <p className="text-sm text-deep-400 mt-0.5">{vehiclePlate}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-deep-100 text-deep-400 hover:text-deep-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-deep-50 flex items-center justify-center">
                <User className="w-8 h-8 text-deep-300" />
              </div>
              <p className="text-deep-400">暂无司机变更记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record, index) => (
                <DriverChangeItem
                  key={record.id}
                  record={record}
                  isFirst={index === 0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverChangeItem({
  record,
  isFirst,
}: {
  record: DriverChangeRecord;
  isFirst: boolean;
}) {
  return (
    <div className="relative pl-8">
      {!isFirst && (
        <div className="absolute left-[15px] top-0 bottom-[52px] w-0.5 bg-deep-100" />
      )}
      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="text-xs font-semibold text-orange-600">
          {record.oldDriverName.charAt(0)}
        </span>
      </div>
      <div className="absolute left-0 top-10 w-8 h-8 rounded-full bg-deep-100 flex items-center justify-center">
        <span className="text-xs font-semibold text-deep-600">
          {record.newDriverName.charAt(0)}
        </span>
      </div>
      <div className="bg-deep-50 rounded-lg p-4 ml-2">
        <div className="flex items-center gap-2 text-xs text-deep-400 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(record.changeDate)}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-deep-400 w-10 shrink-0">原司机</span>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-deep-400" />
              <span className="text-deep-600 font-medium">
                {record.oldDriverName}
              </span>
              <Phone className="w-3.5 h-3.5 text-deep-400 ml-2" />
              <span className="text-deep-500">{record.oldDriverPhone}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-deep-400 w-10 shrink-0">新司机</span>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-deep-400" />
              <span className="text-deep-600 font-medium">
                {record.newDriverName}
              </span>
              <Phone className="w-3.5 h-3.5 text-deep-400 ml-2" />
              <span className="text-deep-500">{record.newDriverPhone}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
