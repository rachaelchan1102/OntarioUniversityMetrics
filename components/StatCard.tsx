interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
}

export default function StatCard({ label, value, sub, highlight }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${
      highlight
        ? 'bg-indigo-600 text-white border-indigo-700'
        : 'bg-white border-gray-200 dark:bg-[#2a2a2a] dark:border-white/10'
    }`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${
        highlight ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-300'
      }`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${
        highlight ? 'text-white' : 'text-gray-900 dark:text-white'
      }`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${
        highlight ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-400'
      }`}>{sub}</p>}
    </div>
  );
}
