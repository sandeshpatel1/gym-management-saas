export default function Card({ children, className = '', hover = false, glass = false }) {
  return (
    <div
      className={`${
        glass ? 'bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl' : 'bg-white dark:bg-zinc-900'
      } rounded-xl2 border border-black/[0.06] dark:border-white/[0.08] shadow-card transition-colors duration-300 ${
        hover ? 'transition-shadow hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
