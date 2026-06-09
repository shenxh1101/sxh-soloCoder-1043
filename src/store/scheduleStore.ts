import { create } from 'zustand';
import type { Task, FollowUp, Audition, Customer } from '../types';
import { getData } from '../data/mockData';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export interface ScheduleItem {
  id: string;
  type: 'task' | 'followUp' | 'audition';
  title: string;
  time: string;
  date: string;
  priority?: 'high' | 'medium' | 'low';
  customerName?: string;
  customerId?: string;
  status?: string;
  content?: string;
}

interface ScheduleState {
  tasks: Task[];
  followUps: FollowUp[];
  auditions: Audition[];
  customers: Customer[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  loadScheduleData: () => void;
  getTodayTodos: () => ScheduleItem[];
  getWeekTasks: () => ScheduleItem[];
  getCalendarTasks: (year: number, month: number) => Record<string, ScheduleItem[]>;
  getTaskStats: () => {
    total: number;
    completed: number;
    pending: number;
    highPriority: number;
  };
}

const isToday = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isThisWeek = (dateString: string) => {
  const date = new Date(dateString);
  const weekStart = startOfWeek(new Date(), { locale: zhCN, weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { locale: zhCN, weekStartsOn: 1 });
  return isWithinInterval(date, { start: weekStart, end: weekEnd });
};

const getCustomerName = (customers: Customer[], customerId: string) => {
  const customer = customers.find((c) => c.id === customerId);
  return customer?.name || '未知客户';
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  tasks: [],
  followUps: [],
  auditions: [],
  customers: [],
  loading: false,
  error: null,
  selectedDate: new Date(),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  loadScheduleData: () => {
    set({ loading: true });
    try {
      const tasks = getData<Task>('crm_tasks');
      const followUps = getData<FollowUp>('crm_followups');
      const auditions = getData<Audition>('crm_auditions');
      const customers = getData<Customer>('crm_customers');

      set({
        tasks,
        followUps,
        auditions,
        customers,
        loading: false,
      });
    } catch (error) {
      set({ error: '日程数据加载失败', loading: false });
    }
  },

  getTodayTodos: () => {
    const { tasks, followUps, auditions, customers } = get();
    const todos: ScheduleItem[] = [];

    tasks
      .filter((t) => isToday(t.dueDate))
      .forEach((t) => {
        todos.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          time: format(new Date(t.dueDate), 'HH:mm'),
          date: format(new Date(t.dueDate), 'yyyy-MM-dd'),
          priority: t.priority,
          customerName: getCustomerName(customers, t.customerId),
          customerId: t.customerId,
          status: t.status,
          content: t.description,
        });
      });

    followUps
      .filter((f) => isToday(f.remindAt) && !f.completed)
      .forEach((f) => {
        todos.push({
          id: `followup-${f.id}`,
          type: 'followUp',
          title: f.content,
          time: format(new Date(f.remindAt), 'HH:mm'),
          date: format(new Date(f.remindAt), 'yyyy-MM-dd'),
          priority: f.priority,
          customerName: getCustomerName(customers, f.customerId),
          customerId: f.customerId,
        });
      });

    auditions
      .filter((a) => isToday(a.auditionAt))
      .forEach((a) => {
        todos.push({
          id: `audition-${a.id}`,
          type: 'audition',
          title: `${a.course} - 试听`,
          time: format(new Date(a.auditionAt), 'HH:mm'),
          date: format(new Date(a.auditionAt), 'yyyy-MM-dd'),
          priority: 'high',
          customerName: getCustomerName(customers, a.customerId),
          customerId: a.customerId,
          status: a.status,
          content: `讲师：${a.teacher}`,
        });
      });

    return todos.sort((a, b) => a.time.localeCompare(b.time));
  },

  getWeekTasks: () => {
    const { tasks, followUps, auditions, customers } = get();
    const todos: ScheduleItem[] = [];

    tasks
      .filter((t) => isThisWeek(t.dueDate))
      .forEach((t) => {
        todos.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          time: format(new Date(t.dueDate), 'HH:mm'),
          date: format(new Date(t.dueDate), 'yyyy-MM-dd'),
          priority: t.priority,
          customerName: getCustomerName(customers, t.customerId),
          customerId: t.customerId,
          status: t.status,
          content: t.description,
        });
      });

    followUps
      .filter((f) => isThisWeek(f.remindAt) && !f.completed)
      .forEach((f) => {
        todos.push({
          id: `followup-${f.id}`,
          type: 'followUp',
          title: f.content,
          time: format(new Date(f.remindAt), 'HH:mm'),
          date: format(new Date(f.remindAt), 'yyyy-MM-dd'),
          priority: f.priority,
          customerName: getCustomerName(customers, f.customerId),
          customerId: f.customerId,
        });
      });

    auditions
      .filter((a) => isThisWeek(a.auditionAt))
      .forEach((a) => {
        todos.push({
          id: `audition-${a.id}`,
          type: 'audition',
          title: `${a.course} - 试听`,
          time: format(new Date(a.auditionAt), 'HH:mm'),
          date: format(new Date(a.auditionAt), 'yyyy-MM-dd'),
          priority: 'high',
          customerName: getCustomerName(customers, a.customerId),
          customerId: a.customerId,
          status: a.status,
          content: `讲师：${a.teacher}`,
        });
      });

    return todos.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  },

  getCalendarTasks: (year, month) => {
    const { tasks, followUps, auditions, customers } = get();
    const calendarTasks: Record<string, ScheduleItem[]> = {};

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      calendarTasks[dateKey] = [];
    });

    const addToCalendar = (item: ScheduleItem) => {
      if (calendarTasks[item.date]) {
        calendarTasks[item.date].push(item);
      }
    };

    tasks.forEach((t) => {
      const date = format(new Date(t.dueDate), 'yyyy-MM-dd');
      if (calendarTasks[date] !== undefined) {
        addToCalendar({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          time: format(new Date(t.dueDate), 'HH:mm'),
          date,
          priority: t.priority,
          customerName: getCustomerName(customers, t.customerId),
          customerId: t.customerId,
          status: t.status,
        });
      }
    });

    followUps
      .filter((f) => !f.completed)
      .forEach((f) => {
        const date = format(new Date(f.remindAt), 'yyyy-MM-dd');
        if (calendarTasks[date] !== undefined) {
          addToCalendar({
            id: `followup-${f.id}`,
            type: 'followUp',
            title: f.content,
            time: format(new Date(f.remindAt), 'HH:mm'),
            date,
            priority: f.priority,
            customerName: getCustomerName(customers, f.customerId),
            customerId: f.customerId,
          });
        }
      });

    auditions.forEach((a) => {
      const date = format(new Date(a.auditionAt), 'yyyy-MM-dd');
      if (calendarTasks[date] !== undefined) {
        addToCalendar({
          id: `audition-${a.id}`,
          type: 'audition',
          title: `${a.course} - 试听`,
          time: format(new Date(a.auditionAt), 'HH:mm'),
          date,
          priority: 'high',
          customerName: getCustomerName(customers, a.customerId),
          customerId: a.customerId,
          status: a.status,
        });
      }
    });

    Object.keys(calendarTasks).forEach((date) => {
      calendarTasks[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return calendarTasks;
  },

  getTaskStats: () => {
    const { tasks, followUps } = get();
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const todayTasks = tasks.filter((t) => {
      const date = new Date(t.dueDate);
      return isWithinInterval(date, { start: todayStart, end: todayEnd });
    });

    const todayFollowUps = followUps.filter((f) => {
      const date = new Date(f.remindAt);
      return isWithinInterval(date, { start: todayStart, end: todayEnd }) && !f.completed;
    });

    const allTodayItems = [...todayTasks, ...todayFollowUps];
    const completed = todayTasks.filter((t) => t.status === 'completed').length;
    const highPriority = allTodayItems.filter((item) => {
      if ('priority' in item) return item.priority === 'high';
      return false;
    }).length;

    return {
      total: allTodayItems.length,
      completed,
      pending: allTodayItems.length - completed,
      highPriority,
    };
  },
}));
