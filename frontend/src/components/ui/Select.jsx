import { forwardRef } from 'react';

const Select = forwardRef(({ label, error, children, className = '', ...props }, ref) => (
  <label className="block">
    {label && (
      <span className="block text-[13px] font-medium text-ink-secondary dark:text-zinc-400 mb-1.5">
        {label}
      </span>
    )}
    <select
      ref={ref}
      className={`w-full px-3.5 py-2.5 rounded-xl border text-[14px] bg-white dark:bg-zinc-900 text-ink dark:text-zinc-100 outline-none transition-colors
        ${
          error
            ? 'border-red-400 focus:border-red-500'
            : 'border-black/10 dark:border-white/10 focus:border-brand'
        }
        ${className}`}
      {...props}
    >
      {children}
    </select>
    {error && <span className="block text-[12px] text-red-500 mt-1">{error}</span>}
  </label>
));
Select.displayName = 'Select';
export default Select;
