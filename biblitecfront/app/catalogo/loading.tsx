export default function CatalogoLoading() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-64 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded mt-4 md:mt-0"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array(6).fill(0).map((_, index) => (
          <div key={index} className="overflow-hidden h-full flex flex-col rounded-lg border">
            <div className="relative h-64 w-full bg-muted animate-pulse"></div>
            <div className="p-6 flex-1">
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-muted animate-pulse rounded mb-4"></div>
              <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-full bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded mb-4"></div>
              <div className="h-6 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 