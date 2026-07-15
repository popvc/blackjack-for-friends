import express, { type Request, type Response } from "express";
import { signin, signout, signup } from "../controllers/auth.controller";
import { protectRoute } from "../middleware/auth.middleware";

const router = express.Router();

//router.use("/", test);

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", signout);
//router.put("/update-profile", (req, res) => res.send("Placeholder /update-profile"));
router.get("/check", protectRoute, (req: Request, res: Response) =>
  res.status(200).json({ message: "Authenticated", user: req.user }),
);

export default router;
