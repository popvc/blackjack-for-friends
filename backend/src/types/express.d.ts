import {  Profile } from "../models/profile.schema.ts"

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}

//makes it as an ES module as opposed to a script
export {};