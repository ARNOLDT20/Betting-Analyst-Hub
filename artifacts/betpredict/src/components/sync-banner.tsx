import { useGetSyncStatus, useTriggerSync, getGetSyncStatusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export function SyncBanner() {
  const { data: status, refetch } = useGetSyncStatus({ query: { refetchInterval: 8000 } });
  const triggerSync = useTriggerSync();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const wasInProgress = useRef(false);

  useEffect(() => {
    if (wasInProgress.current && !status?.inProgress) {
      queryClient.invalidateQueries();
      toast({ title: "Sync complete", description: "Real fixtures are now loaded." });
    }
    wasInProgress.current = status?.inProgress ?? false;
  }, [status?.inProgress]);

  function handleSync() {
    triggerSync.mutate(undefined, {
      onSuccess: () => {
        refetch();
        toast({ title: "Syncing real fixtures…", description: "Fetching from football-data.org across all leagues." });
      },
    });
  }

  const lastSync = status?.lastSyncAt ? new Date(status.lastSyncAt) : null;
  const minsAgo = lastSync ? Math.round((Date.now() - lastSync.getTime()) / 60000) : null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-card-border text-xs">
      <div className="flex items-center gap-2">
        {status?.inProgress ? (
          <>
            <RefreshCw className="w-3 h-3 text-primary animate-spin" />
            <span className="text-primary font-medium">Syncing real fixtures from football-data.org…</span>
          </>
        ) : lastSync ? (
          <>
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            <span className="text-muted-foreground">
              Real data · Updated {minsAgo === 0 ? "just now" : `${minsAgo}m ago`}
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span className="text-amber-400 font-medium">No real data yet — click Sync to load live fixtures</span>
          </>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSync}
        disabled={status?.inProgress || triggerSync.isPending}
        className="h-6 text-xs text-primary hover:text-primary gap-1 px-2"
        data-testid="button-sync"
      >
        <RefreshCw className={`w-3 h-3 ${status?.inProgress ? "animate-spin" : ""}`} />
        {status?.inProgress ? "Syncing…" : "Sync Now"}
      </Button>
    </div>
  );
}
