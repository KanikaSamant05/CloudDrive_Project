const { Router } = require('express');
const { z }      = require('zod');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');

const router = Router();

const registerSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name:     z.string().min(1, 'Name is required').max(100),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const cookieOpts = {
httpOnly: true,
secure:   process.env.NODE_ENV === 'production',
sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
path:     '/',
maxAge:   7 * 24 * 60 * 60 * 1000,
};

// ── POST /api/auth/register ──────────────────────────────────────────
router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION', message: result.error.issues[0].message }
    });
  }

  const { email, password, name } = result.data;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: name },
    email_confirm: true,
  });

  if (error) {
    const msg = error.message.includes('already registered')
      ? 'An account with this email already exists'
      : error.message;
    return res.status(400).json({
      error: { code: 'REGISTER_FAILED', message: msg }
    });
  }

  return res.status(201).json({ message: 'Account created! You can now log in.' });
});

// ── POST /api/auth/login ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: { code: 'VALIDATION', message: result.error.issues[0].message }
    });
  }

  const { email, password } = result.data;

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return res.status(401).json({
      error: { code: 'LOGIN_FAILED', message: 'Incorrect email or password' }
    });
  }

  res.cookie('access_token',  data.session.access_token,  cookieOpts);
  res.cookie('refresh_token', data.session.refresh_token, {
    ...cookieOpts,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.json({
    user: {
      id:    data.user.id,
      email: data.user.email,
      name:  data.user.user_metadata?.full_name,
    }
  });
});

// ── POST /api/auth/logout ────────────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  const token = req.cookies?.access_token;

  await supabaseAdmin.auth.admin.signOut(token);

  res.clearCookie('access_token',  { path: '/', sameSite: 'none',secure: true, httpOnly: true });
  res.clearCookie('refresh_token', { path: '/', sameSite: 'none', secure: true, httpOnly: true });

  return res.json({ message: 'Logged out successfully' });
});

// ── GET /api/auth/me 
router.get('/me', requireAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, image_url, created_at')
    .eq('id', req.user.id)
    .single();

  if (error || !profile) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'User profile not found' }
    });
  }

  return res.json({ user: profile });
});

module.exports = router;