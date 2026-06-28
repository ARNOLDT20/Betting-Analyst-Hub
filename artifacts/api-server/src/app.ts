import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { syncAllCompetitions, getLastSyncAt } from "./services/sync";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const SYNC_INTERVAL_MS = 30 * 60 * 1000;

function scheduleSync() {
  if (!process.env.FOOTBALL_DATA_API_KEY) {
    logger.warn("FOOTBALL_DATA_API_KEY not set — skipping auto-sync");
    return;
  }

  const doSync = () => {
    const last = getLastSyncAt();
    if (!last || Date.now() - last.getTime() > SYNC_INTERVAL_MS) {
      logger.info("Auto-sync: fetching real fixtures from football-data.org");
      syncAllCompetitions().catch(err =>
        logger.error({ err }, "Auto-sync failed")
      );
    }
  };

  setTimeout(doSync, 3000);
  setInterval(doSync, SYNC_INTERVAL_MS);
}

scheduleSync();

export default app;
