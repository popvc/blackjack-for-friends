import express from "express";
import contactRequestRoutes from "./contactRequest.route";
import { protectRoute } from "../middleware/auth.middleware";
import { remove, list } from "../controllers/contact.controller";

const router = express.Router();

router.use(protectRoute);

//contact
router.use("/request", contactRequestRoutes);
router.post("/:id/remove", remove);
router.get("/list", list);

export default router;
