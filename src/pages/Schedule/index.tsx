import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  List,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Video,
  Phone,
  MessageSquare,
  Users,
} from 'lucide-react';
import { format, isToday, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import Empty from '@/components/Empty';
import { useScheduleStore, ScheduleItem } from '@/store/scheduleStore';
import { getWeekDates, getMonthDates, isOverdue } from '@/utils/date';
import { Priority, PRIORITY_OPTIONS, COMMUNICATION_TYPE_OPTIONS } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'calendar';

const STAT_CARDS = [
  { key: 'total', label: '总任务数', color: 'primary', icon: List },
  { key: 'completed', label: '已完成', color: 'success', icon: CheckCircle2 },
  { key: 'pending', label: '待处理', color: 'warning', icon: Clock },
  { key: 'highPriority', label: '高优先级', color: 'danger', icon: AlertCircle },
] as const;

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const TYPE_ICONS: Record<string, typeof Video> = {
  task: CheckCircle2,
  followUp: MessageSquare,
  audition: Video,
};

const TYPE_LABELS: Record<string, string> = {
  task: '任务',
  followUp: '跟进',
  audition: '试听',
};

export default function Schedule() {
  const {
    loadScheduleData,
    getTodayTodos,
    getWeekTasks,
    getCalendarTasks,
    getTaskStats,
    selectedDate,
    setSelectedDate,
  } = useScheduleStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    remindAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: 'medium' as Priority,
    communicationType: 'phone' as const,
  });

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  const todayTodos = useMemo(() => getTodayTodos(), [getTodayTodos]);
  const weekTasks = useMemo(() => getWeekTasks(), [getWeekTasks]);
  const stats = useMemo(() => getTaskStats(), [getTaskStats]);

  const calendarTasks = useMemo(() => {
    return getCalendarTasks(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [getCalendarTasks, currentMonth]);

  const monthDates = useMemo(() => {
    return getMonthDates(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const weekDates = useMemo(() => getWeekDates(), []);

  const weekGroupedTasks = useMemo(() => {
    const grouped: Record<string, ScheduleItem[]> = {};
    weekDates.forEach((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      grouped[dateKey] = [];
    });
    weekTasks.forEach((task) => {
      if (grouped[task.date]) {
        grouped[task.date].push(task);
      }
    });
    return grouped;
  }, [weekTasks, weekDates]);

  const handleToggleComplete = (id: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('list');
  };

  const handleAddTask = () => {
    setShowAddModal(false);
    setFormData({
      title: '',
      content: '',
      remindAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      priority: 'medium',
      communicationType: 'phone',
    });
  };

  const getPriorityBadge = (priority?: string) => {
    const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
    if (!option) return null;
    const variant = priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'success';
    return <Badge variant={variant} dot>{option.label}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_ICONS[type] || CheckCircle2;
    return <Icon className="h-4 w-4" />;
  };

  const getItemBackgroundColor = (item: ScheduleItem) => {
    if (completedItems.has(item.id)) return 'bg-gray-50';
    if (item.priority === 'high') return 'bg-red-50';
    if (item.priority === 'medium') return 'bg-yellow-50';
    return 'bg-white';
  };

  const getCommunicationIcon = (type: string) => {
    const option = COMMUNICATION_TYPE_OPTIONS.find((o) => o.value === type);
    if (!option) return <Phone className="h-4 w-4" />;
    if (type === 'phone') return <Phone className="h-4 w-4" />;
    if (type === 'wechat') return <MessageSquare className="h-4 w-4" />;
    if (type === 'meeting') return <Users className="h-4 w-4" />;
    return <Video className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日程提醒</h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>
          添加任务
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, color, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stats[key]}</p>
                </div>
                <div className={cn(
                  'p-3 rounded-xl',
                  color === 'primary' && 'bg-blue-100 text-blue-600',
                  color === 'success' && 'bg-green-100 text-green-600',
                  color === 'warning' && 'bg-yellow-100 text-yellow-600',
                  color === 'danger' && 'bg-red-100 text-red-600',
                )}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>今日待办</CardTitle>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <List className="h-4 w-4" />
              列表视图
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Calendar className="h-4 w-4" />
              日历视图
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {todayTodos.length === 0 ? (
                <Empty />
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-3">
                    {todayTodos.map((item) => {
                      const isCompleted = completedItems.has(item.id);
                      const isItemOverdue = isOverdue(`${item.date}T${item.time}`);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'relative pl-10 pr-4 py-3 rounded-lg border transition-all hover:shadow-md',
                            getItemBackgroundColor(item),
                            isCompleted ? 'border-gray-200' : 'border-gray-200 hover:border-blue-300',
                            isItemOverdue && !isCompleted && 'border-red-300'
                          )}
                        >
                          <div className="absolute left-2 top-4 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                            <button
                              onClick={() => handleToggleComplete(item.id)}
                              className={cn(
                                'w-full h-full rounded-full flex items-center justify-center transition-colors',
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'hover:bg-gray-100'
                              )}
                            >
                              {isCompleted && <Check className="h-2.5 w-2.5" />}
                            </button>
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">
                                  {item.time}
                                </span>
                                <Tag variant="primary" className="text-xs">
                                  {getTypeIcon(item.type)}
                                  {TYPE_LABELS[item.type]}
                                </Tag>
                                {getPriorityBadge(item.priority)}
                                {isItemOverdue && !isCompleted && (
                                  <Badge variant="danger" dot>逾期</Badge>
                                )}
                              </div>
                              <h4 className={cn(
                                'mt-1 text-base font-medium',
                                isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                              )}>
                                {item.title}
                              </h4>
                              {item.customerName && (
                                <p className="mt-1 text-sm text-gray-500">
                                  客户：{item.customerName}
                                </p>
                              )}
                              {item.content && (
                                <p className="mt-1 text-sm text-gray-500">{item.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
                </h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
                {monthDates.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-24" />;
                  }
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dayTasks = calendarTasks[dateKey] || [];
                  const hasTasks = dayTasks.length > 0;
                  const isTodayDate = isToday(date);
                  const isSelected = isSameDay(date, selectedDate);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        'h-24 p-2 rounded-lg border text-left transition-all hover:border-blue-400 hover:shadow-sm',
                        isTodayDate && 'border-blue-500 bg-blue-50',
                        isSelected && !isTodayDate && 'border-gray-400 bg-gray-50',
                        !isTodayDate && !isSelected && 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'text-sm font-medium',
                          isTodayDate ? 'text-blue-600' : 'text-gray-900'
                        )}>
                          {format(date, 'd')}
                        </span>
                        {hasTasks && (
                          <span className="h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </div>
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={cn(
                              'text-xs truncate px-1 py-0.5 rounded',
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-700'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {task.time} {task.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{dayTasks.length - 2} 更多
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>本周待办</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayTasks = weekGroupedTasks[dateKey] || [];
              const isTodayDate = isToday(date);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    'rounded-lg border p-3',
                    isTodayDate ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  )}
                >
                  <div className="text-center mb-3">
                    <p className={cn(
                      'text-sm font-medium',
                      isTodayDate ? 'text-blue-600' : 'text-gray-900'
                    )}>
                      {format(date, 'EEEE', { locale: zhCN })}
                    </p>
                    <p className={cn(
                      'text-lg font-bold',
                      isTodayDate ? 'text-blue-600' : 'text-gray-900'
                    )}>
                      {format(date, 'd')}
                    </p>
                    {dayTasks.length > 0 && (
                      <Badge variant="primary" size="sm" className="mt-1">
                        {dayTasks.length} 项
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">暂无安排</p>
                    ) : (
                      dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            'text-xs p-2 rounded',
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-700'
                              : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          <div className="font-medium">{task.time}</div>
                          <div className="truncate mt-0.5">{task.title}</div>
                        </div>
                      ))
                    )}
                    {dayTasks.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{dayTasks.length - 3} 更多
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="添加跟进任务"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddTask}>
              确认添加
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="任务标题"
            placeholder="请输入任务标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Textarea
            label="任务内容"
            placeholder="请输入任务内容"
            rows={3}
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="提醒时间"
              type="datetime-local"
              value={formData.remindAt}
              onChange={(e) => setFormData({ ...formData, remindAt: e.target.value })}
            />
            <Select
              label="优先级"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value as Priority })}
              options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              沟通方式
            </label>
            <div className="flex gap-2 flex-wrap">
              {COMMUNICATION_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, communicationType: option.value as any })}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    formData.communicationType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {getCommunicationIcon(option.value)}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
