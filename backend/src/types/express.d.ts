import type { AuthUser } from "../config/authToken.ts";

//user should be optional. I'll look into a better approach later
declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
        }
    }
}

//makes it as an ES module as opposed to a script
export {};