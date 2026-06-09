import { NavLink } from 'react-router-dom';
import {
  Users,
  LayoutDashboard,
  CalendarDays,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    path: '/',
    label: '客户列表',
    icon: Users,
  },
  {
    path: '/kanban',
    label: '跟进看板',
    icon: LayoutDashboard,
  },
  {
    path: '/schedule',
    label: '日程提醒',
    icon: CalendarDays,
  },
  {
    path: '/statistics',
    label: '经营统计',
    icon: BarChart3,
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CRM管理系统</h1>
            <p className="text-xs text-gray-500">培训机构客户管理</p>
          </div>
        </div>
      </div>

      <nav className="space-y-1 p-4">
        <p className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          导航菜单
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {item.path === '/schedule' && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                3
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-900">需要帮助？</p>
          <p className="mt-1 text-xs text-gray-500">
            查看使用手册或联系技术支持
          </p>
          <button className="mt-3 w-full rounded-md bg-white px-3 py-2 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors">
            帮助中心
          </button>
        </div>
      </div>
    </aside>
  );
}
