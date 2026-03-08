export default function RootLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Pulsing logo placeholder */}
        <div className="h-10 w-10 rounded-full bg-zinc-800 animate-pulse" />
        {/* Skeleton content blocks */}
        <div className="space-y-3 w-72">
          <div className="h-4 bg-zinc-800 rounded animate-pulse" />
          <div className="h-4 bg-zinc-800 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-zinc-800 rounded animate-pulse w-4/6" />
        </div>
      </div>
    </div>
  );
}
