import type { Request, Response } from "express";

export const test = async (req: Request, res: Response) => {
  try {
    res.send("Test controller success");
  } catch (error) {
    console.error("Error in test");
  }
}
  