import { useState, useEffect } from "react";

export function useUpdates() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreUpdates, setHasMoreUpdates] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUpdates = async (page: number, showLoading = true) => {
    if (showLoading) setUpdatesLoading(true);
    try {
      const res = await fetch(`/api/updates?page=${page}`);
      const data = await res.json();
      if (data.commits) {
        if (page === 1) {
          setUpdates(data.commits);
        } else {
          setUpdates((prev) => [...prev, ...data.commits]);
        }
        setHasMoreUpdates(data.hasMore || false);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error("Failed to fetch updates:", err);
    } finally {
      setUpdatesLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchUpdates(1);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUpdates(1, false).finally(() => setTimeout(() => setIsRefreshing(false), 1500));
  };

  const loadMoreUpdates = async () => {
    if (loadingMore || !hasMoreUpdates) return;
    setLoadingMore(true);
    await fetchUpdates(currentPage + 1, false);
  };

  return {
    updates,
    updatesLoading,
    hasMoreUpdates,
    loadingMore,
    isRefreshing,
    handleRefresh,
    loadMoreUpdates,
  };
}



