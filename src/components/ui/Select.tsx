import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<T = string>
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption<T>[];
  placeholder?: string;
  wrapperClassName?: string;
  onChange?: (value: T) => void;
}

const Select = React.forwardRef(function Select<T extends string>(
  {
    className,
    label,
    error,
    options,
    placeholder = '请选择',
    wrapperClassName,
    onChange,
    value,
    id,
    ...props
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLSelectElement>
) {
  const selectId = id || React.useId();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value as T;
    onChange?.(selectedValue);
  };

  const baseStyles =
    'w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

  const errorStyles = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-300';

  const placeholderStyles = !value ? 'text-gray-400' : 'text-gray-900';

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block mb-1.5 text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          value={value || ''}
          onChange={handleChange}
          className={cn(baseStyles, errorStyles, placeholderStyles, 'pr-10', className)}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={String(option.value)}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export { Select };
