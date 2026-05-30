import express from "express";
import { test } from "../controllers/test.controller";

const router = express.Router();

//router.use("/", test);

router.post("/", (req, res) => res.send("Placeholder /signup")); //doesn't do anything because post doesn't return a response
router.post("/login", (req, res) => res.send("Placeholder /login"));
router.post("/logout", (req, res) => res.send("Placeholder /logout"));
router.put("/update-profile", (req, res) => res.send("Placeholder /update-profile"));
router.get("/check", (req, res) => res.send("Placeholder /check"));
export default router;
