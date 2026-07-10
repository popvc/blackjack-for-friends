import z from "zod";

export const AddContactDto = z.string().length(20);
