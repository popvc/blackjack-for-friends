import express from "express";
import { accept, send, cancel, list, reject } from "../controllers/contactRequest.controller";

const router = express.Router();

//request
router.post("/:id/send", send);
router.post("/:id/accept", accept);
router.post("/:id/reject", reject);
router.post("/:id/cancel", cancel);
router.get("/list", list);

export default router;
