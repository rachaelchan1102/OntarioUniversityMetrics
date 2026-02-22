export default function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 dark:bg-[#2a2a2a] dark:border-white/10 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}
