import express, { type Request, type Response } from "express";
import { login, logout, signup } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth.middleware";

const router = express.Router();

//router.use("/", test);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
//router.put("/update-profile", (req, res) => res.send("Placeholder /update-profile"));
router.get("/check", protectRoute, (req: Request, res: Response) => res.status(200).json(req.userId));

export default router;
