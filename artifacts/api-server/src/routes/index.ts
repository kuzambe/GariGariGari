import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cargptRouter from "./cargpt";
import vinRouter from "./vin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cargptRouter);
router.use(vinRouter);

export default router;
