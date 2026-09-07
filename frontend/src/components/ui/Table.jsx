export default function Table({ columns, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-black/[0.06] dark:border-white/[0.08]">
            {columns.map((col) => (
              <th
                key={col}
                className="text-[12px] font-medium text-ink-tertiary dark:text-zinc-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
