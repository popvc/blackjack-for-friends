import z from "zod";

export const ContactIdDto = z.string().length(20);


export type ContactIdDto = z.infer<typeof ContactIdDto>;