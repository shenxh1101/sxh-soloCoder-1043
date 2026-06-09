import * as React from 'react';
import { format, getYear, getMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMonthDates, isSameDay } from '@/utils/date';

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  wrapperClassName?: string;
}

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function DatePicker({
  value,
  onChange,
  placeholder = '请选择日期',
  label,
  error,
  disabled = false,
  minDate,
  maxDate,
  className,
  wrapperClassName,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(getYear(value || new Date()));
  const [viewMonth, setViewMonth] = React.useState(getMonth(value || new Date()));
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (value) {
      setViewYear(getYear(value));
      setViewMonth(getMonth(value));
    }
  }, [value]);

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;
    onChange?.(date);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDateDisabled = (date: Date | null) => {
    if (!date) return true;
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    return false;
  };

  const dates = getMonthDates(viewYear, viewMonth);
  const today = new Date();

  return (
    <div ref={containerRef} className={cn('relative w-full', wrapperClassName)}>
      {label && (
        <label className="block mb-1.5 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300',
          className
        )}
      >
        <span className={cn('flex items-center gap-2', !value && 'text-gray-400')}>
          <Calendar className="h-4 w-4" />
          {value ? format(value, 'yyyy-MM-dd', { locale: zhCN }) : placeholder}
        </span>
        {value && !disabled && (
          <X
            className="h-4 w-4 text-gray-400 hover:text-gray-600"
            onClick={handleClear}
          />
        )}
      </button>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <span className="font-medium text-gray-900">
              {format(new Date(viewYear, viewMonth), 'yyyy年MM月', { locale: zhCN })}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dates.map((date, index) => {
              const isDisabled = isDateDisabled(date);
              const isSelected = value && date && isSameDay(value, date);
              const isTodayDate = date && isSameDay(today, date);

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateClick(date)}
                  className={cn(
                    'h-9 w-9 flex items-center justify-center text-sm rounded-lg transition-colors',
                    !date && 'invisible',
                    date && !isDisabled && !isSelected && !isTodayDate && 'hover:bg-gray-100',
                    isTodayDate && !isSelected && 'bg-blue-50 text-blue-600 font-medium',
                    isSelected && 'bg-blue-600 text-white font-medium',
                    isDisabled && 'text-gray-300 cursor-not-allowed'
                  )}
                >
                  {date?.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
