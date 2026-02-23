export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-surface-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-48 bg-surface-100 rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-surface-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="h-12 w-full bg-surface-100 rounded-xl animate-pulse mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white border border-surface-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-white border border-surface-100 rounded-2xl animate-pulse" />
    </div>
  );
}
