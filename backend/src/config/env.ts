import z from "zod";

//More research on appropriate PORT values
//Need proper regex for MONGODB_URI 
//NODE_ENV needs "test" once I have automated testing setup
const EnvVar = z.object({
  NODE_ENV: z.literal(["production", "development"]),
  PORT: z.literal(["3000", "3001"]),
  SOCKET_PORT: z.literal(["3001", "3002"]),
  MONGODB_URI: z.url(),
  JWT_SECRET: z.uuidv4(),
  CLIENT_URL: z.url(),
});

const result = EnvVar.safeParse(process.env);

if (!result.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(result.error)}`);
  process.exit(1);
}

export const ENV = result.data;
