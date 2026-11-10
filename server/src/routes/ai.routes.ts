import { Router } from "express";
import { getAiUsage, postChat } from "../controllers/ai.controller.js";
import { getIncidents } from "../controllers/incidents.controller.js";

export const aiRouter: Router = Router();

aiRouter.post("/chat", postChat);
aiRouter.get("/ai/usage", getAiUsage);
aiRouter.get("/incidents", getIncidents);
