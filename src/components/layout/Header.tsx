import { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'task' | 'followup' | 'system';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: '待办任务提醒',
    content: '您有3个今日待办任务需要处理',
    time: '10分钟前',
    read: false,
    type: 'task',
  },
  {
    id: '2',
    title: '客户跟进提醒',
    content: '客户张伟的跟进时间已到，请及时联系',
    time: '30分钟前',
    read: false,
    type: 'followup',
  },
  {
    id: '3',
    title: '试听课程提醒',
    content: '李娜的试听课程将于下午2点开始',
    time: '1小时前',
    read: false,
    type: 'task',
  },
  {
    id: '4',
    title: '系统更新通知',
    content: 'CRM系统已完成版本更新，请查看新功能',
    time: '2小时前',
    read: true,
    type: 'system',
  },
  {
    id: '5',
    title: '业绩统计报告',
    content: '本月业绩统计报告已生成，请查看',
    time: '昨天',
    read: true,
    type: 'system',
  },
];

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户姓名、手机号..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="h-9 w-80 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                showNotifications
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    通知消息
                  </h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700">
                    全部已读
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex gap-3 border-b border-gray-50 px-4 py-3 hover:bg-gray-50 cursor-pointer',
                        !notification.read && 'bg-blue-50/30'
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                          notification.type === 'task' && 'bg-orange-100 text-orange-600',
                          notification.type === 'followup' && 'bg-green-100 text-green-600',
                          notification.type === 'system' && 'bg-blue-100 text-blue-600'
                        )}
                      >
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                          {notification.content}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 p-2">
                  <button className="w-full rounded-md py-2 text-sm text-blue-600 hover:bg-gray-50">
                    查看全部通知
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
            >
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
                alt="用户头像"
                className="h-8 w-8 rounded-full bg-gray-200"
              />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  系统管理员
                </p>
                <p className="text-xs text-gray-500">管理员</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="p-2">
                  <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4" />
                    个人中心
                  </button>
                  <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="h-4 w-4" />
                    系统设置
                  </button>
                </div>
                <div className="border-t border-gray-100 p-2">
                  <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </header>
  );
}
