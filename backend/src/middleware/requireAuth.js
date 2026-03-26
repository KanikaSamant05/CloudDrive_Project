const { supabaseAdmin } = require('../lib/supabase');

async function requireAuth(req, res, next) {
  const token        = req.cookies?.access_token;
  const refreshToken = req.cookies?.refresh_token;

  if (!token && !refreshToken) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'You are not logged in' }
    });
  }

  // Try the access token first
  if (token) {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      req.user = user;
      return next();
    }
  }

  // Access token failed — try refreshing using the refresh token
  if (refreshToken) {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!error && data.session) {
      // Set new cookies
      const cookieOpts = {
        httpOnly: true,
        secure:   false,
        sameSite: 'lax',
        path:     '/',
        maxAge:   7 * 24 * 60 * 60 * 1000,
      };

      res.cookie('access_token',  data.session.access_token,  cookieOpts);
      res.cookie('refresh_token', data.session.refresh_token, {
        ...cookieOpts,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      req.user = data.user;
      return next();
    }
  }

  // Both failed
  return res.status(401).json({
    error: { code: 'INVALID_TOKEN', message: 'Session expired, please log in again' }
  });
}

module.exports = { requireAuth };