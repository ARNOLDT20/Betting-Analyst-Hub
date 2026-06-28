import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import leaguesRouter from "./leagues";
import betOfTheDayRouter from "./bet-of-the-day";
import statsRouter from "./stats";
import syncRouter from "./sync";

const router: IRouter = Router();

router.use(healthRouter);
router.use(matchesRouter);
router.use(leaguesRouter);
router.use(betOfTheDayRouter);
router.use(statsRouter);
router.use(syncRouter);

export default router;
