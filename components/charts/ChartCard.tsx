export default function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 dark:bg-[#1e2a3a] dark:border-slate-700 rounded-2xl shadow-sm px-5 py-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}
