const isProduction = process.env.NODE_ENV === 'production';

export const AUTH_COOKIE_NAME = 'portfolio_admin_token';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
  maxAge: 15 * 60 * 60 * 1000,
};
