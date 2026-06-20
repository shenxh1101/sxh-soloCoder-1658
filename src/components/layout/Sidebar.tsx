import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Fuel,
  Wrench,
  BarChart3,
  Bell,
  ChevronRight,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

// 导航菜单配置
const navItems = [
  {
    path: "/",
    label: "仪表盘",
    icon: LayoutDashboard,
  },
  {
    path: "/vehicles",
    label: "车辆档案",
    icon: Truck,
  },
  {
    path: "/fuel",
    label: "加油管理",
    icon: Fuel,
  },
  {
    path: "/maintenance",
    label: "维修管理",
    icon: Wrench,
  },
  {
    path: "/reports",
    label: "报表中心",
    icon: BarChart3,
  },
  {
    path: "/reminders",
    label: "保养提醒",
    icon: Bell,
  },
  {
    path: "/settings",
    label: "系统设置",
    icon: Settings,
  },
];

// 侧边栏组件属性
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-deep-900/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏主容器 */}
      <aside
        className={cn(
          // 固定定位，全屏高度
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col",
          // 固定宽度 260px，深空蓝背景
          "w-[260px] bg-deep-600 text-white",
          // 过渡动画
          "transition-transform duration-300 ease-in-out",
          // 移动端：默认隐藏，展开时显示
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* 顶部 Logo 区域 */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-deep-500/30">
          <div className="flex items-center gap-3">
            {/* Logo 图标 */}
            <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-white" />
            </div>
            {/* Logo 文字 */}
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight">车队管家</span>
              <span className="text-[10px] text-deep-300 leading-tight">FleetOps</span>
            </div>
          </div>

          {/* 移动端折叠按钮 */}
          <button
            onClick={onToggle}
            className="md:hidden p-1.5 rounded-lg hover:bg-deep-500/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-deep-200 rotate-180" />
          </button>
        </div>

        {/* 导航菜单区域 */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onToggle}
                    className={({ isActive }) =>
                      cn(
                        // 基础样式
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                        // 未选中状态
                        !isActive &&
                          "text-deep-200 hover:bg-deep-500/40 hover:text-white",
                        // 选中状态：橙色背景10% + 橙色文字
                        isActive &&
                          "bg-orange-500/10 text-orange-500 border-l-2 border-orange-500 pl-[14px]"
                      )
                    }
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0",
                        isActive ? "text-orange-500" : "text-deep-300"
                      )}
                    />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部用户信息区 */}
        <div className="p-3 border-t border-deep-500/30">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-deep-700/50 hover:bg-deep-700/70 transition-colors cursor-pointer">
            {/* 用户头像 */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            {/* 用户信息 */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">系统管理员</p>
              <p className="text-xs text-deep-300 truncate">admin@fleetops.com</p>
            </div>
            {/* 设置图标 */}
            <button className="p-1.5 rounded-lg hover:bg-deep-500/30 transition-colors shrink-0">
              <Settings className="w-4 h-4 text-deep-300 hover:text-white" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
