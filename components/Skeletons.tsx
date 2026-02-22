export function SkeletonKPIGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 border border-gray-200 bg-white animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-52 bg-gray-100 rounded" />
    </div>
  );
}

export default function Skeletons() { return null; }
