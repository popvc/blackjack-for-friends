import express from "express";
import { test } from "../controllers/test.controller";
import { login, logout, signup } from "../controllers/auth.controller";

const router = express.Router();

//router.use("/", test);

router.post("/signup", signup)
router.post("/login", login);
router.post("/logout", logout);
//router.put("/update-profile", (req, res) => res.send("Placeholder /update-profile"));
//router.get("/check", );
export default router;
