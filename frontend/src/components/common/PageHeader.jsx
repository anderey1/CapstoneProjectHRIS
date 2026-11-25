export default function PageHeader({ icon: Icon, title, subtitle, badge, children }) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-primary">
            <Icon size={20} aria-hidden="true" />
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {badge && (
              <span className="badge badge-sm border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-slate-600">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  );
}
