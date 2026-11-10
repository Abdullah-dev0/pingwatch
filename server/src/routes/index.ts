import { Router } from "express";
import { apiNotFoundHandler } from "../middleware/errorHandler.js";
import { healthRouter } from "./health.routes.js";
import { pingsRouter } from "./pings.routes.js";

export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/pings", pingsRouter);

// keep this last
apiRouter.use(apiNotFoundHandler);
