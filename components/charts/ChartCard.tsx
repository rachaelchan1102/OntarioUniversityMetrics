// Section card wrapper from the /mockups design.
export default function ChartCard({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card border-2 border-line rounded-card p-6 sm:px-[24px] sm:py-7 ${className}`}>
      <h2 className="text-base sm:text-[15px] font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      <div className={subtitle ? 'mt-4' : 'mt-[14px]'}>{children}</div>
    </div>
  );
}
