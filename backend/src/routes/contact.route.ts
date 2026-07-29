import express from "express";
import contactRequestRoutes from "./contactRequest.route";
import { protectRoute } from "../middleware/routeAuth.middleware";
import { remove, list, presence } from "../controllers/contact.controller";

const router = express.Router();

router.use(protectRoute);

//contact
router.use("/request", contactRequestRoutes);
router.post("/:id/remove", remove);
router.get("/list", list);
router.get("/presence", presence);

export default router;
