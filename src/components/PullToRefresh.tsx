import { useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

/**
 * Touch-driven pull-to-refresh wrapper. Pull down from the top of the page
 * to trigger `onRefresh`.
 */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      // dampen the pull for a natural rubber-band feel
      setPull(Math.min(MAX_PULL, delta * 0.5));
    }
  };

  const handleTouchEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(48);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pull }}
      >
        <RefreshCw
          size={22}
          className={`text-brand-500 ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 2.5}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}
