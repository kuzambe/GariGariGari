import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cargptRouter from "./cargpt";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cargptRouter);

export default router;
