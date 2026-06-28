import { Router } from "express";
import { syncAllCompetitions, getLastSyncAt, isSyncInProgress } from "../services/sync";

const router = Router();

router.get("/sync/status", (_req, res) => {
  res.json({
    lastSyncAt: getLastSyncAt()?.toISOString() ?? null,
    inProgress: isSyncInProgress(),
  });
});

router.post("/sync", async (req, res) => {
  if (isSyncInProgress()) {
    res.status(409).json({ message: "Sync already running", inProgress: true });
    return;
  }

  res.json({ message: "Sync started — fetching real fixtures from football-data.org" });

  syncAllCompetitions().catch(err => {
    console.error("Background sync failed:", err);
  });
});

router.post("/sync/wait", async (_req, res) => {
  if (isSyncInProgress()) {
    res.status(409).json({ message: "Sync already in progress" });
    return;
  }

  try {
    const result = await syncAllCompetitions();
    res.json({ ...result, lastSyncAt: getLastSyncAt()?.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
