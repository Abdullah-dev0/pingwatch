import { Router } from "express";
import { apiNotFoundHandler } from "../middleware/errorHandler.js";
import { aiRouter } from "./ai.routes.js";
import { healthRouter } from "./health.routes.js";
import { pingsRouter } from "./pings.routes.js";

export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/pings", pingsRouter);
apiRouter.use(aiRouter);

// keep this last
apiRouter.use(apiNotFoundHandler);
