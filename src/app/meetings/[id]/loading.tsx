export default function MeetingLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-6 w-32 bg-surface-100 rounded-lg animate-pulse" />
          <div className="h-10 w-3/4 bg-surface-100 rounded-xl animate-pulse" />
          <div className="h-24 w-full bg-surface-100 rounded-xl animate-pulse" />
          <div className="h-48 w-full bg-white border border-surface-100 rounded-2xl animate-pulse" />
        </div>
        <div>
          <div className="h-80 bg-white border border-surface-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
