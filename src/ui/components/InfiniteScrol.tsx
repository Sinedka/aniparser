import React, { useCallback, useEffect, useRef, useState } from "react";

type InfiniteScrollProps<T> = {
  fetchFn: (args: T) => Promise<React.ReactNode | null>;
  args: T[];
  pageSize?: number;
};

export function InfiniteScroll<T>({ fetchFn, args, pageSize = 10 }: InfiniteScrollProps<T>) {
  const [items, setItems] = useState<React.ReactNode[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);

    const start = pageSize * page;
    const end = Math.min(pageSize * (page + 1), args.length) 

    const newArr = args.slice(pageSize * page, Math.min(pageSize * (page + 1), args.length));
    const promises = newArr.map(id => fetchFn(id));
    const results = await Promise.all(promises);

    setIsLoading(false);


    setItems((prev) => [...prev, ...results]);
    setPage((prev) => prev + 1);

    if (end >= args.length) {
      setHasMore(false);
    }
  }, [args, page, hasMore, isLoading, fetchFn]);


  useEffect(() => {
    if (!loaderRef.current) return;

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
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



  }, [loadMore]);

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
