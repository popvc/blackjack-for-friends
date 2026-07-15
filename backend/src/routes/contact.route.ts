import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { accept, send, list, reject } from "../controllers/contact.controller";

const router = express.Router();

router.use(protectRoute);

router.post("/request/:id", send);
router.post("/:id/accept", accept);
router.post("/:id/reject", reject);
router.get("/list", list);

export default router;
