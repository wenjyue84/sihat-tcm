import { RefreshCw, History, GitCommit, GitBranch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdates } from "@/hooks/useUpdates";

export function UpdatesTab() {
  const {
    updates,
    updatesLoading,
    hasMoreUpdates,
    loadingMore,
    isRefreshing,
    handleRefresh,
    loadMoreUpdates,
  } = useUpdates();

  return (
    <div className="animate-in fade-in-50">
      <Card className="bg-[#0f0f11] border-white/10 text-white">
        <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-5 px-6">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">Version History</CardTitle>
            <CardDescription>Commit log</CardDescription>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <GitBranch className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-mono text-gray-400">master</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {updatesLoading ? (
              <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                <span className="text-sm italic">Syncing with repository...</span>
              </div>
            ) : (
              updates.map((commit, i) => (
                <div
                  key={i}
                  className="p-6 hover:bg-white/[0.02] transition-colors flex gap-6 group"
                >
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-600 ring-4 ring-[#0f0f11] z-10"></div>
                    <div className="w-px h-full bg-white/10 group-last:hidden min-h-[40px]"></div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-200 font-medium group-hover:text-violet-300 transition-colors leading-relaxed">
                        {commit.message}
                      </p>
                      <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded border border-white/5 ml-4 shrink-0">
                        {commit.hash}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <GitCommit className="w-3 h-3" />
                        {commit.author}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(commit.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More Button */}
          {!updatesLoading && hasMoreUpdates && (
            <div className="p-6 border-t border-white/5">
              <Button
                variant="outline"
                className="w-full bg-white/5 border-white/10 text-gray-300 hover:bg-violet-600/20 hover:border-violet-500/30 hover:text-violet-300"
                onClick={loadMoreUpdates}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <History className="w-4 h-4 mr-2" />
                    Load More Commits
                  </>
                )}
              </Button>
            </div>
          )}

          {/* End of history indicator */}
          {!updatesLoading && !hasMoreUpdates && updates.length > 0 && (
            <div className="p-4 text-center text-xs text-gray-600 border-t border-white/5">
              End of commit history
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
