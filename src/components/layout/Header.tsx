import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search, Bell, User, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 路径与面包屑名称的映射关系
const breadcrumbMap: Record<string, string> = {
  "/": "仪表盘",
  "/vehicles": "车辆档案",
  "/vehicles/new": "新增车辆",
  "/fuel": "加油管理",
  "/fuel/new": "新增加油记录",
  "/fuel/backfill": "历史加油补录",
  "/maintenance": "维修管理",
  "/maintenance/new": "新增维修记录",
  "/reports": "报表中心",
  "/reminders": "保养提醒",
  "/settings": "系统设置",
};

// 月份选项数据
const monthOptions = [
  { value: "2026-01", label: "2026年1月" },
  { value: "2026-02", label: "2026年2月" },
  { value: "2026-03", label: "2026年3月" },
  { value: "2026-04", label: "2026年4月" },
  { value: "2026-05", label: "2026年5月" },
  { value: "2026-06", label: "2026年6月" },
];

// Header 组件属性
interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const location = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("2026-06");

    // 获取当前路径对应的面包屑文本
  const getBreadcrumb = (pathname: string): string => {
    if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
    if (/^\/vehicles\/[^/]+\/edit$/.test(pathname)) return "编辑车辆";
    if (/^\/vehicles\/[^/]+$/.test(pathname)) return "车辆详情";
    return "未知页面";
  };
  const currentBreadcrumb = getBreadcrumb(location.pathname);

  // 未读通知数量
  const unreadCount = 5;

  return (
    <header className="h-16 bg-white border-b border-deep-50/60 flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* 左侧区域：菜单按钮 + 面包屑 */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* 移动端菜单切换按钮 */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-deep-50 transition-colors"
        >
          <Menu className="w-5 h-5 text-deep-600" />
        </button>

        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm">
          {/* 首页链接 */}
          <span className="text-deep-400 hover:text-deep-600 transition-colors cursor-pointer">
            首页
          </span>
          {/* 分隔符 */}
          <ChevronRight className="w-4 h-4 text-deep-300 shrink-0" />
          {/* 当前页面 */}
          <span className="text-deep-700 font-medium truncate max-w-[160px] md:max-w-none">
            {currentBreadcrumb}
          </span>
        </nav>
      </div>

      {/* 右侧区域：月份选择 + 搜索 + 通知 + 头像 */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* 月份选择器（在中等屏幕以上显示） */}
        <div className="hidden sm:block">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={cn(
              // 基础样式
              "h-9 px-3 pr-8 rounded-lg text-sm font-medium",
              // 边框与背景
              "bg-deep-50/50 border border-deep-100 text-deep-700",
              // 聚焦状态
              "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400",
              // 下拉箭头
              "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%230F2540%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22M6%208l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_8px_center] bg-[16px_16px]",
              "transition-all cursor-pointer"
            )}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 搜索框（在大屏幕以上显示） */}
        <div className="hidden lg:block relative">
          {/* 搜索图标 */}
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-deep-300 pointer-events-none" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="搜索车辆、司机..."
            className={cn(
              // 基础尺寸与内边距
              "w-64 h-9 pl-9 pr-4 rounded-lg text-sm",
              // 背景边框
              "bg-deep-50/50 border border-deep-100 text-deep-700 placeholder:text-deep-300",
              // 聚焦状态
              "focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400",
              "transition-all"
            )}
          />
        </div>

        {/* 移动端搜索按钮 */}
        <button className="lg:hidden p-2 rounded-lg hover:bg-deep-50 transition-colors">
          <Search className="w-5 h-5 text-deep-500" />
        </button>

        {/* 通知徽章按钮 */}
        <button className="relative p-2 rounded-lg hover:bg-deep-50 transition-colors">
          <Bell className="w-5 h-5 text-deep-500" />
          {/* 未读消息红点 */}
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-alert-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* 用户头像 */}
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-deep-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {/* 用户名（中等屏幕以上显示） */}
          <span className="hidden md:block text-sm font-medium text-deep-700">
            管理员
          </span>
        </button>
      </div>
    </header>
  );
}
