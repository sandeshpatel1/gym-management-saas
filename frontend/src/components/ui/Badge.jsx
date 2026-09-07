const styles = {
  active: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  expired: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  frozen: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  refunded: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400',
};

export default function Badge({ status, children }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[12px] font-medium capitalize ${
        styles[status] || 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-zinc-400'
      }`}
    >
      {children || status}
    </span>
  );
}
