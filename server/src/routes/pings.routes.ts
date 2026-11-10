import { Router } from "express";
import { listPings, streamPings } from "../controllers/pings.controller.js";

export const pingsRouter: Router = Router();

pingsRouter.get("/", listPings);
pingsRouter.get("/stream", streamPings);
