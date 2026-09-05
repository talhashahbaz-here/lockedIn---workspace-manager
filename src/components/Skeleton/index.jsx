/* Skeleton — loading shimmer for fake-async operations. */

export function SkeletonLine({ w = '100%', h = 14 }) {
  return <span className="skel" style={{ width: w, height: h }} />;
}

export function SkeletonCard() {
  return (
    <div className="skel-card">
      <SkeletonLine w="70%" />
      <SkeletonLine w="45%" h={10} />
      <div className="row-gap-6">
        <SkeletonLine w={54} h={18} />
        <SkeletonLine w={70} h={18} />
      </div>
    </div>
  );
}

export default function Skeleton({ kind = 'list', count = 4 }) {
  if (kind === 'board') {
    return (
      <div className="board skeleton-board">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="board-col">
            <SkeletonLine w="55%" h={18} />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="stack-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
