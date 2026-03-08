export default function AppLoading() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-9 w-28 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
      {/* Content skeleton — card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-36 bg-zinc-800/60 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 75}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
