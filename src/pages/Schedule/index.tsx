import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  ExternalLink,
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
import { useCustomerStore } from '@/store/customerStore';
import { getWeekDates, getMonthDates, isOverdue } from '@/utils/date';
import {
  Priority,
  PRIORITY_OPTIONS,
  COMMUNICATION_TYPE_OPTIONS,
  Task,
  TaskType,
  TASK_TYPE_OPTIONS,
  TASK_SOURCE_LABELS,
  TaskSource,
} from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'calendar';

const STAT_CARDS = [
  { key: 'total', label: '总任务数', color: 'primary', icon: List },
  { key: 'completed', label: '已完成', color: 'success', icon: CheckCircle2 },
  { key: 'pending', label: '待处理', color: 'warning', icon: Clock },
  { key: 'highPriority', label: '高优先级', color: 'danger', icon: AlertCircle },
] as const;

const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function Schedule() {
  const navigate = useNavigate();
  const {
    loadScheduleData,
    getTodayTodos,
    getWeekTasks,
    getCalendarTasks,
    getTaskStats,
    selectedDate,
    setSelectedDate,
  } = useScheduleStore();

  const {
    customers,
    consultants,
    addTask,
    updateTask,
    loadData: loadCustomerData,
  } = useCustomerStore();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    remindAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    priority: 'medium' as Priority,
    communicationType: 'phone' as const,
    customerId: '',
    consultantId: '',
    type: 'general' as TaskType,
  });
  const [formErrors, setFormErrors] = useState<{ title?: string; remindAt?: string }>({});

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadScheduleData();
    loadCustomerData();
  }, [loadScheduleData, loadCustomerData, refreshKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const todayTodos = useMemo(() => getTodayTodos(), [getTodayTodos, refreshKey]);
  const weekTasks = useMemo(() => getWeekTasks(), [getWeekTasks, refreshKey]);
  const stats = useMemo(() => getTaskStats(), [getTaskStats, refreshKey]);

  const customerOptions = [
    { value: '', label: '不关联客户' },
    ...customers.map(c => ({ value: c.id, label: `${c.name} - ${c.phone}` })),
  ];

  const consultantOptions = [
    { value: '', label: '不指定顾问' },
    ...consultants.map(c => ({ value: c.id, label: c.name })),
  ];

  const calendarTasks = useMemo(() => {
    return getCalendarTasks(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [getCalendarTasks, currentMonth, refreshKey]);

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

  const handleToggleComplete = (item: ScheduleItem) => {
    if (item.type === 'task') {
      const taskId = item.id.replace('task-', '');
      const isCompleted = item.status === 'completed';
      updateTask(taskId, { status: isCompleted ? 'pending' : 'completed' });
    } else if (item.type === 'followUp') {
      const followUpId = item.id.replace('followup-', '');
      const isCompleted = completedItems.has(item.id);
      setCompletedItems(prev => {
        const next = new Set(prev);
        if (isCompleted) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
        return next;
      });
      useCustomerStore.getState().updateFollowUp(followUpId, { completed: !isCompleted });
    }
    loadScheduleData();
    setRefreshKey(prev => prev + 1);
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetailModal(true);
  };

  const handleAddTask = () => {
    if (!validateForm()) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      customerId: formData.customerId,
      consultantId: formData.consultantId,
      title: formData.title,
      description: formData.content,
      dueDate: new Date(formData.remindAt).toISOString(),
      priority: formData.priority,
      status: 'pending',
      type: formData.type,
      source: 'manual',
    };

    addTask(newTask);
    loadScheduleData();

    setShowAddModal(false);
    setFormData({
      title: '',
      content: '',
      remindAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      priority: 'medium',
      communicationType: 'phone',
      customerId: '',
      consultantId: '',
      type: 'general',
    });
    setFormErrors({});
  };

  const getPriorityBadge = (priority?: string) => {
    const option = PRIORITY_OPTIONS.find((p) => p.value === priority);
    if (!option) return null;
    const variant = priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'success';
    return <Badge variant={variant} dot>{option.label}</Badge>;
  };

  const getTaskTypeInfo = (type?: string, source?: string) => {
    if (type) {
      const typeInfo = TASK_TYPE_OPTIONS.find((t) => t.value === type);
      if (typeInfo) return typeInfo;
    }
    return TASK_TYPE_OPTIONS[TASK_TYPE_OPTIONS.length - 1];
  };

  const getItemBackgroundColor = (item: ScheduleItem) => {
    const isCompleted = item.status === 'completed' || completedItems.has(item.id);
    if (isCompleted) return 'bg-gray-50';
    if (item.priority === 'high') return 'bg-red-50';
    if (item.priority === 'medium') return 'bg-yellow-50';
    return 'bg-white';
  };

  const isItemCompleted = (item: ScheduleItem) => {
    return item.status === 'completed' || completedItems.has(item.id);
  };

  const getCommunicationIcon = (type: string) => {
    const option = COMMUNICATION_TYPE_OPTIONS.find((o) => o.value === type);
    if (!option) return <Phone className="h-4 w-4" />;
    if (type === 'phone') return <Phone className="h-4 w-4" />;
    if (type === 'wechat') return <MessageSquare className="h-4 w-4" />;
    if (type === 'meeting') return <Users className="h-4 w-4" />;
    return <Video className="h-4 w-4" />;
  };

  const getSourceBadge = (source?: string) => {
    if (!source || source === 'manual') return null;
    const label = TASK_SOURCE_LABELS[source as TaskSource];
    return (
      <Badge variant="secondary" size="sm" className="text-xs">
        {label}
      </Badge>
    );
  };

  const handleGoToCustomer = (customerId?: string) => {
    if (customerId) {
      navigate(`/customers/${customerId}`);
    }
  };

  const validateForm = () => {
    const errors: { title?: string; remindAt?: string } = {};
    if (!formData.title.trim()) {
      errors.title = '请输入任务标题';
    }
    if (!formData.remindAt) {
      errors.remindAt = '请选择提醒时间';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const selectedDateTasks = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const monthTasks = getCalendarTasks(selectedDate.getFullYear(), selectedDate.getMonth());
    return monthTasks[dateKey] || [];
  }, [getCalendarTasks, selectedDate, refreshKey]);

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
                      const isCompleted = isItemCompleted(item);
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
                              onClick={() => handleToggleComplete(item)}
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
                                {(() => {
                                  const typeInfo = getTaskTypeInfo(item.taskType, item.source);
                                  return (
                                    <Tag variant="primary" className="text-xs" style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color, borderColor: `${typeInfo.color}30` }}>
                                      <span className="mr-1">{typeInfo.icon}</span>
                                      {typeInfo.label}
                                    </Tag>
                                  );
                                })()}
                                {getSourceBadge(item.source)}
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
                                <div className="mt-1 flex items-center gap-2">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <p className="text-sm text-gray-500">
                                    {item.customerName}
                                  </p>
                                  {item.customerId && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleGoToCustomer(item.customerId);
                                      }}
                                      className="text-blue-500 hover:text-blue-700 transition-colors"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
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
                        {dayTasks.slice(0, 2).map((task) => {
                          const typeInfo = getTaskTypeInfo(task.taskType, task.source);
                          return (
                            <div
                              key={task.id}
                              className="text-xs truncate px-1 py-0.5 rounded"
                              style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}
                            >
                              <span className="mr-0.5">{typeInfo.icon}</span>
                              {task.time} {task.title}
                            </div>
                          );
                        })}
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
          <div>
            <label className="block mb-1.5 text-sm font-medium text-gray-700">
              任务类型
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TASK_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: option.value })}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                    formData.type === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="任务标题"
            placeholder="请输入任务标题"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
            }}
            error={formErrors.title}
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
              onChange={(e) => {
                setFormData({ ...formData, remindAt: e.target.value });
                if (formErrors.remindAt) setFormErrors({ ...formErrors, remindAt: undefined });
              }}
              error={formErrors.remindAt}
            />
            <Select
              label="优先级"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value as Priority })}
              options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="关联客户"
              value={formData.customerId}
              onChange={(value) => setFormData({ ...formData, customerId: value })}
              options={customerOptions}
            />
            <Select
              label="负责顾问"
              value={formData.consultantId}
              onChange={(value) => setFormData({ ...formData, consultantId: value })}
              options={consultantOptions}
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

      <Modal
        open={showDayDetailModal}
        onClose={() => setShowDayDetailModal(false)}
        title={`${format(selectedDate, 'yyyy年MM月dd日 EEEE', { locale: zhCN })} 安排详情`}
        size="lg"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedDateTasks.length === 0 ? (
            <Empty description="当天暂无安排" />
          ) : (
            <div className="space-y-3">
              {selectedDateTasks.map((item) => {
                const isCompleted = isItemCompleted(item);
                const isItemOverdue = isOverdue(`${item.date}T${item.time}`);
                const typeInfo = getTaskTypeInfo(item.taskType, item.source);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all hover:shadow-md',
                      getItemBackgroundColor(item),
                      isCompleted ? 'border-gray-200' : 'border-gray-200 hover:border-blue-300',
                      isItemOverdue && !isCompleted && 'border-red-300'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className={cn(
                          'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0',
                          isCompleted
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-blue-400'
                        )}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {item.time}
                          </span>
                          <Tag variant="primary" className="text-xs" style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color, borderColor: `${typeInfo.color}30` }}>
                            <span className="mr-1">{typeInfo.icon}</span>
                            {typeInfo.label}
                          </Tag>
                          {getSourceBadge(item.source)}
                          {getPriorityBadge(item.priority)}
                          {isItemOverdue && !isCompleted && (
                            <Badge variant="danger" dot>逾期</Badge>
                          )}
                        </div>
                        <h4 className={cn(
                          'mt-2 text-base font-medium',
                          isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                        )}>
                          {item.title}
                        </h4>
                        {item.customerName && (
                          <div className="mt-2 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-600">
                              {item.customerName}
                            </p>
                            {item.customerId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGoToCustomer(item.customerId)}
                                className="h-7 px-2 text-xs text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                查看客户
                              </Button>
                            )}
                          </div>
                        )}
                        {item.content && (
                          <p className="mt-2 text-sm text-gray-500 whitespace-pre-line">{item.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
