import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { add } from "../controllers/contact.controller";

const router = express.Router();

router.use(protectRoute);

router.post("/add/:id", add);

export default router;
