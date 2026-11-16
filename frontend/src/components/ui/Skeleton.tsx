/** Yüklenirken: gölgeli kutular yerine çizgili boş satırlar (defter sayfası gibi). */
export function ListSkeleton({ rows = 3, label = "Yükleniyor" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="animate-fade">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden className="grid gap-6 border-b border-rule py-6 md:grid-cols-12">
          <div className="aspect-[4/3] bg-card md:col-span-4" />
          <div className="space-y-3 md:col-span-5">
            <div className="h-8 w-40 border border-rule bg-card" />
            <div className="h-5 w-56 bg-card" />
            <div className="h-12 w-full border border-rule" />
          </div>
          <div className="h-16 bg-card md:col-span-3" />
        </div>
      ))}
    </div>
  );
}

export function BlockSkeleton({ className = "h-40" }: { className?: string }) {
  return <div aria-hidden className={`animate-fade border border-dashed border-rule bg-card/60 ${className}`} />;
}
