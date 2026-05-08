import { Router, type IRouter } from "express";
import healthRouter from "./health";
import matchesRouter from "./matches";
import leaguesRouter from "./leagues";
import betOfTheDayRouter from "./bet-of-the-day";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(matchesRouter);
router.use(leaguesRouter);
router.use(betOfTheDayRouter);
router.use(statsRouter);

export default router;
