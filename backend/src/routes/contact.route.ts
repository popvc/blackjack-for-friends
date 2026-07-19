import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { accept,  list, reject, add } from "../controllers/contact.controller";

const router = express.Router();

router.use(protectRoute);

router.post("/add/:id", add);
router.post("/:id/accept", accept);
router.post("/:id/reject", reject);
router.get("/list", list);

export default router;
