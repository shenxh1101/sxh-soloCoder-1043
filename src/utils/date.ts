import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isThisWeek,
  isPast,
  differenceInDays,
  parseISO,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd', { locale: zhCN });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm', { locale: zhCN });
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
};

export const getDateLabel = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(d)) {
    return '今天';
  } else if (isTomorrow(d)) {
    return '明天';
  } else if (isThisWeek(d, { weekStartsOn: 1 })) {
    return format(d, 'EEEE', { locale: zhCN });
  } else {
    return formatDate(d);
  }
};

export const isOverdue = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(d);
};

export const getDaysUntil = (date: string | Date): number => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(d, new Date());
};

export const getWeekDates = (): Date[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

export const getMonthDates = (year: number, month: number): (Date | null)[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay() || 7;
  
  const dates: (Date | null)[] = [];
  
  for (let i = 1; i < startDayOfWeek; i++) {
    dates.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(new Date(year, month, i));
  }
  
  while (dates.length % 7 !== 0) {
    dates.push(null);
  }
  
  return dates;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};
