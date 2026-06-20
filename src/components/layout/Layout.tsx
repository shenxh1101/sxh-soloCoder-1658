import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

// Layout 组件属性
interface LayoutProps {
  // 子组件内容（页面内容）
  children: ReactNode;
}

// 整体布局组件
export default function Layout({ children }: LayoutProps) {
  // 侧边栏展开/折叠状态（用于移动端）
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 切换侧边栏显示状态
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // 关闭侧边栏
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    // 外层容器：flex 横向布局，最小高度全屏
    <div className="flex min-h-screen bg-bg-main">
      {/* 左侧：侧边栏 */}
      <Sidebar isOpen={sidebarOpen} onToggle={closeSidebar} />

      {/* 右侧：主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部：Header 导航栏 */}
        <Header onMenuToggle={toggleSidebar} />

        {/* 内容区域：带内边距，可滚动 */}
        <main className="flex-1 overflow-x-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
