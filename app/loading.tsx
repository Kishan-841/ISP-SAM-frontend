/**
 * Root loading state. Next.js suspends here while a navigation's server
 * components fetch data. Renders an instant skeleton so the click feels
 * snappy even when the SSR fetch to the backend is slow.
 */
export default function Loading() {
  return (
    <div className="px-8 py-6 flex flex-col gap-8 animate-pulse">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <div className="h-7 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-100 rounded" />
      </div>

      {/* Stat-card row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white shadow-sm rounded-lg p-5 border border-gray-100 h-[112px] flex items-start justify-between gap-3"
          >
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="h-7 w-20 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
            <div className="w-9 h-9 rounded-md bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Table-ish second block */}
      <div className="bg-white rounded-lg border border-gray-100 p-5">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-50 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
