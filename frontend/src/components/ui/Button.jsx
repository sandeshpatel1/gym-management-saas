const variants = {
  primary: 'bg-brand text-white hover:brightness-105',
  secondary:
    'bg-surface-subtle dark:bg-white/[0.08] text-ink dark:text-zinc-100 hover:bg-black/[0.06] dark:hover:bg-white/[0.14]',
  danger: 'bg-red-500 text-white hover:brightness-105',
  ghost: 'bg-transparent text-ink dark:text-zinc-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08]',
};

const sizes = {
  sm: 'text-[13px] px-3 py-1.5 rounded-lg',
  md: 'text-[14px] px-4 py-2.5 rounded-xl',
  lg: 'text-[15px] px-5 py-3 rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`press-feedback font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
