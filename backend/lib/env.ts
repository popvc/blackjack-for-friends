//do I need checking for all environment variables?

interface EnvVar {
  NODE_ENV: string;
  PORT: string;
  POSTGRESQL_URI: string;
  JWT_SECRET: string;
  CLIENT_URL: string;
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable missing: ${key}`);
  }
  return value;
}

export const ENV: EnvVar = {
  NODE_ENV: getEnvVar("NODE_ENV"),
  PORT: getEnvVar("PORT"),
  POSTGRESQL_URI: getEnvVar("POSTGRESQL_URI"),
  JWT_SECRET: getEnvVar("JWT_SECRET"),
  CLIENT_URL: getEnvVar("CLIENT_URL"),
} as const;
