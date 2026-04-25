'use client';

const ORDERED_STEPS = [
  { key: 'PLACED', label: 'Placed', icon: '🧾' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { key: 'PACKED', label: 'Packed', icon: '📦' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the way', icon: '🚚' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🏠' },
] as const;

type StatusKey = (typeof ORDERED_STEPS)[number]['key'] | 'CANCELLED' | string;

export default function OrderStatusTracker({ status }: { status: StatusKey }) {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
        <p className="text-red-700 font-bold flex items-center justify-center gap-2">
          <span aria-hidden="true">❌</span> This order was cancelled.
        </p>
      </div>
    );
  }

  const currentIndex = ORDERED_STEPS.findIndex((s) => s.key === status);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
      <h2 className="text-lg sm:text-xl font-bold mb-5 text-gray-800 flex items-center gap-2">
        <span className="text-primary-500" aria-hidden="true">🛣️</span>
        Order Progress
      </h2>
      <ol className="flex items-start justify-between gap-1 sm:gap-3">
        {ORDERED_STEPS.map((step, i) => {
          const isDone = i < safeIndex;
          const isCurrent = i === safeIndex;
          const isFuture = i > safeIndex;
          return (
            <li key={step.key} className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="flex items-center w-full">
                {/* Left connector */}
                <div
                  className={`flex-1 h-1 rounded-full ${
                    i === 0 ? 'opacity-0' : isDone || isCurrent ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
                <div
                  className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-12 h-12 bg-primary-500 text-white shadow-lg ring-4 ring-primary-200 animate-pulse'
                      : isDone
                      ? 'w-10 h-10 bg-primary-500 text-white shadow'
                      : 'w-10 h-10 bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="text-base sm:text-lg" aria-hidden="true">{step.icon}</span>
                </div>
                {/* Right connector */}
                <div
                  className={`flex-1 h-1 rounded-full ${
                    i === ORDERED_STEPS.length - 1
                      ? 'opacity-0'
                      : isDone
                      ? 'bg-primary-500'
                      : 'bg-gray-200'
                  }`}
                />
              </div>
              <p
                className={`mt-2 text-[10px] sm:text-xs font-semibold ${
                  isCurrent ? 'text-primary-700' : isDone ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
