export function validateEnvironment(env: Record<string, unknown>) {
  for (const key of [
    'MONGO_URL',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ]) {
    if (typeof env[key] !== 'string' || !env[key].trim())
      throw new Error(`Missing environment variable: ${key}`);
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(String(env.MONGO_URL)))
    throw new Error('Invalid MONGO_URL');
  if (String(env.JWT_SECRET).length < 32)
    throw new Error('JWT_SECRET must contain at least 32 characters');
  const port = Number(env.PORT ?? 5000);
  if (!Number.isInteger(port) || port < 0 || port > 65535)
    throw new Error('Invalid PORT');
  if (
    env.COOKIE_SECURE !== undefined &&
    !['true', 'false'].includes(String(env.COOKIE_SECURE))
  )
    throw new Error('Invalid COOKIE_SECURE');
  const origins = String(
    env.CORS_ORIGINS ??
      'http://localhost:5173,http://localhost:3000,https://react-web-chat.vercel.app',
  )
    .split(',')
    .map((origin) => origin.trim());
  if (
    origins.some((origin) => {
      try {
        return new URL(origin).origin !== origin;
      } catch {
        return true;
      }
    })
  )
    throw new Error('CORS_ORIGINS must contain comma-separated origins');
  return { ...env, PORT: port, CORS_ORIGINS: origins.join(',') };
}
