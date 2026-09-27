import express from "express";
import contactRequestRoutes from "./contactRequest.route";
import { remove, list, presence } from "../controllers/contact.controller";

const router = express.Router();

//contact
router.use("/request", contactRequestRoutes);
router.post("/:id/remove", remove);
router.get("/list", list);
router.get("/presence", presence);

export default router;
