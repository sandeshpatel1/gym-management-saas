export default function CompanyLogo({ company, size = 36 }) {
  const initials = (company?.name || 'Gym')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (company?.branding?.logoUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl overflow-hidden border border-black/[0.06] dark:border-white/[0.1] bg-white dark:bg-zinc-50 shrink-0 flex items-center justify-center p-1"
      >
        {/* object-contain (not cover) so the full logo is always visible, never
            cropped — a neutral near-white chip keeps it legible in dark mode too */}
        <img
          src={company.branding.logoUrl}
          alt={company.name}
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, background: 'var(--brand-color)' }}
      className="rounded-xl flex items-center justify-center text-white font-semibold text-[13px] shrink-0"
    >
      {initials}
    </div>
  );
}