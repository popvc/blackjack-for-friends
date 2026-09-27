import z from "zod";

// Lowercase, a-z, 0-9, underscores. No consecutive, leading or trailing underscores.
const VALID_USERNAME_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

//complexity rules for password eventually
export const SignUpDto = z.object({
  password: z.string().min(16).max(64),
  username: z
    .stringFormat("username", VALID_USERNAME_REGEX, {
      error:
        "Invalid input: Can only use lowercase a-z, 0-9 or underscore. No leading, trailing or consecutive underscores",
    })
    .min(6)
    .max(36),
  email: z.email().toLowerCase(),
});

export const SignInDto = z.object({
  email: z.email().toLowerCase(),
  password: z.string(),
});

//return DTOs at another date

export type SignUpDto = z.infer<typeof SignUpDto>;
export type SignInDto = z.infer<typeof SignInDto>;
