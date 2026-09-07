export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="h-12 w-12 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4 text-ink-tertiary dark:text-zinc-500">
          <Icon size={22} />
        </div>
      )}
      <h4 className="text-[15px] font-semibold text-ink dark:text-zinc-100 mb-1">{title}</h4>
      {description && (
        <p className="text-[13px] text-ink-secondary dark:text-zinc-400 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
