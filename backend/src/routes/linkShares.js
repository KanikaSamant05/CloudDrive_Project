const { Router } = require('express');
const { z } = require('zod');
const crypto = require('crypto');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();
const BUCKET = 'drive';

// ── POST /api/link-shares ── Create a public link ─────────────────────
router.post('/', requireAuth, async (req, res) => {
  const schema = z.object({
    resourceType: z.enum(['file','folder']),
    resourceId:   z.string().uuid(),
    expiresAt:    z.string().optional(),
    password:     z.string().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: result.error.issues[0].message } });
  }

  const { resourceType, resourceId, expiresAt, password } = result.data;

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Hash password if provided
  let passwordHash = null;
  if (password) {
    passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
  }

  const { data: link, error } = await supabaseAdmin
    .from('link_shares')
    .insert({
      resource_type: resourceType,
      resource_id:   resourceId,
      token,
      password_hash: passwordHash,
      expires_at:    expiresAt || null,
      created_by:    req.user.id,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: { message: error.message } });
  }

  return res.status(201).json({ link, token });
});

// ── GET /api/link/:token ── Resolve a public link ─────────────────────
// This route is PUBLIC — no requireAuth middleware
router.get('/resolve/:token', async (req, res) => {
  const { token }   = req.params;
  const { password } = req.query;

  // Find the link
  const { data: link } = await supabaseAdmin
    .from('link_shares')
    .select('*')
    .eq('token', token)
    .single();

  if (!link) {
    return res.status(404).json({ error: { message: 'Link not found' } });
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return res.status(410).json({ error: { message: 'This link has expired' } });
  }

  // Check password if required
  if (link.password_hash) {
    if (!password) {
      return res.status(401).json({ error: { code: 'PASSWORD_REQUIRED', message: 'Password required' } });
    }
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    if (hash !== link.password_hash) {
      return res.status(401).json({ error: { code: 'WRONG_PASSWORD', message: 'Incorrect password' } });
    }
  }

  // Get the resource
  if (link.resource_type === 'file') {
    const { data: file } = await supabaseAdmin
      .from('files')
      .select('id, name, mime_type, size_bytes, storage_key')
      .eq('id', link.resource_id)
      .single();

    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    // Generate signed download URL
    const { data: signedData } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(file.storage_key, 300); // 5 minutes

    return res.json({ file, 
      signedUrl: signedData?.signedUrl ,
      expiresAt:  link.expires_at, 
      hasPassword: !!link.password_hash,
    });
  }

  // Folder — just return metadata
  const { data: folder } = await supabaseAdmin
    .from('folders')
    .select('id, name')
    .eq('id', link.resource_id)
    .single();

  return res.json({ folder,
        expiresAt:   link.expires_at,
        hasPassword: !!link.password_hash, 
   });
});

// ── GET /api/link-shares ── List my public links ──────────────────────
router.get('/', requireAuth, async (req, res) => {
  const { data: links } = await supabaseAdmin
    .from('link_shares')
    .select('*')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });

  return res.json({ links: links || [] });
});

// ── DELETE /api/link-shares/:id ── Delete a public link ──────────────
router.delete('/:id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('link_shares')
    .delete()
    .eq('id', req.params.id)
    .eq('created_by', req.user.id);

  if (error) {
    return res.status(404).json({ error: { message: 'Link not found' } });
  }

  return res.json({ message: 'Link deleted' });
});

module.exports = router;
