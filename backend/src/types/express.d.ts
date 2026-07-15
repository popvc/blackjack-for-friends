import type { AuthUser } from "../config/authToken.ts";
import {  Profile } from "../models/profile.schema.ts"

declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
        }
    }
}

//makes it as an ES module as opposed to a script
export {};