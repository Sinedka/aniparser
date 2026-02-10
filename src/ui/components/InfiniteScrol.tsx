import React, { useEffect, useRef } from "react";

type InfiniteScrollProps = {
  items: React.ReactNode[];
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
};

export function InfiniteScroll({
  items,
  loadMore,
  hasMore,
  isLoading,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loaderRef.current) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { 
        root: loaderRef.current.parentElement,
        threshold: 1 
      }
    );

    observerRef.current.observe(loaderRef.current);

    return () => {
      if (loaderRef.current) observerRef.current?.unobserve(loaderRef.current);
    };



  }, [hasMore, isLoading, loadMore]);

  return (
    <div>
      {items.map((item, i) => (
        <React.Fragment key={i}>{item}</React.Fragment>
      ))}

      {hasMore && (
        <div ref={loaderRef} style={{ padding: "20px", textAlign: "center" }}>
          {isLoading ? "Загружаем..." : ""}
        </div>
      )}
    </div>
  );
}
