const { Router } = require('express');
const { z }      = require('zod');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

const BUCKET = 'drive';

// ── POST /api/shares ──────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const schema = z.object({
    resourceType: z.enum(['file','folder']),
    resourceId:   z.string().uuid(),
    granteeEmail: z.string().email(),
    role:         z.enum(['viewer','editor']),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: { message: result.error.issues[0].message }
    });
  }

  const { resourceType, resourceId, granteeEmail, role } = result.data;

  const { data: grantee } = await supabaseAdmin
    .from('users')
    .select('id, email, name')
    .ilike('email', granteeEmail.trim().toLowerCase())
    .single();

  if (!grantee) {
    return res.status(404).json({
      error: { message: 'No user found with that email address' }
    });
  }

  if (grantee.id === req.user.id) {
    return res.status(400).json({
      error: { message: 'You cannot share with yourself' }
    });
  }

  const { data: share, error } = await supabaseAdmin
    .from('shares')
    .upsert({
      resource_type:   resourceType,
      resource_id:     resourceId,
      grantee_user_id: grantee.id,
      role,
      created_by:      req.user.id,
    }, { onConflict: 'resource_type,resource_id,grantee_user_id' })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: { message: error.message } });
  }

  return res.status(201).json({ share, grantee });
});

// ── GET /api/shares/received ── Files shared WITH me ──────────────────
router.get('/received', async (req, res) => {
  const { data: shares, error } = await supabaseAdmin
    .from('shares')
    .select(`
      id,
      role,
      resource_type,
      resource_id,
      created_at,
      created_by,
      owner:created_by (
        id,
        email,
        name
      )
    `)
    .eq('grantee_user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (!shares || shares.length === 0) {
    return res.json({ shares: [] });
  }

  const enriched = await Promise.all(
    shares.map(async (share) => {
      const table = share.resource_type === 'file' ? 'files' : 'folders';

      const { data: resource } = await supabaseAdmin
        .from(table)
        .select('id, name')
        .eq('id',         share.resource_id)
        .eq('is_deleted', false)          // ← only return non-deleted
        .maybeSingle();

      return { ...share, resource };
    })
  );

  // Filter out shares where resource is deleted or not found
  const valid = enriched.filter(s => s.resource !== null);

  return res.json({ shares: valid });
});

// ── GET /api/shares/sent ── Files I shared WITH others ────────────────
router.get('/sent', async (req, res) => {
  const { data: shares } = await supabaseAdmin
    .from('shares')
    .select('id, role, resource_type, resource_id, grantee_user_id, created_at')
    .eq('created_by', req.user.id)
    .order('created_at', { ascending: false });

  if (!shares || shares.length === 0) {
    return res.json({ shares: [] });
  }

  const enriched = await Promise.all(
    shares.map(async (share) => {
      const table = share.resource_type === 'file' ? 'files' : 'folders';

      const { data: resource } = await supabaseAdmin
        .from(table)
        .select('id, name')
        .eq('id',         share.resource_id)
        .eq('is_deleted', false)          // ← only return non-deleted
        .maybeSingle();

      const { data: grantee } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', share.grantee_user_id)
        .maybeSingle();

      return { ...share, resource, grantee };
    })
  );

  // Filter out shares where resource is deleted or not found
  const valid = enriched.filter(s => s.resource !== null);

  return res.json({ shares: valid });
});

// ── GET /api/shares/access/:resourceType/:resourceId ──────────────────
router.get('/access/:resourceType/:resourceId', async (req, res) => {
  const { resourceType, resourceId } = req.params;

  const { data: share } = await supabaseAdmin
    .from('shares')
    .select('id, role')
    .eq('resource_type',   resourceType)
    .eq('resource_id',     resourceId)
    .eq('grantee_user_id', req.user.id)
    .single();

  if (!share) {
    return res.status(403).json({
      error: { message: 'You do not have access to this resource' }
    });
  }

  const table = resourceType === 'file' ? 'files' : 'folders';
  const { data: resource } = await supabaseAdmin
    .from(table)
    .select('*')
    .eq('id', resourceId)
    .single();

  if (!resource) {
    return res.status(404).json({ error: { message: 'Resource not found' } });
  }

  let signedUrl = null;
  if (resourceType === 'file') {
    const { data: signedData } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(resource.storage_key, 60);
    signedUrl = signedData?.signedUrl;
  }

  return res.json({ resource, role: share.role, signedUrl });
});

// ── PATCH /api/shares/access/:resourceId ── Editor rename ────────────
router.patch('/access/:resourceId', async (req, res) => {
  const { resourceId } = req.params;
  const { name }       = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: { message: 'Name is required' } });
  }

  const { data: share } = await supabaseAdmin
    .from('shares')
    .select('id, role')
    .eq('resource_type',   'file')
    .eq('resource_id',     resourceId)
    .eq('grantee_user_id', req.user.id)
    .single();

  if (!share) {
    return res.status(403).json({
      error: { message: 'You do not have access to this file' }
    });
  }

  if (share.role !== 'editor') {
    return res.status(403).json({
      error: { message: 'You need editor permission to rename' }
    });
  }

  const { data: file, error } = await supabaseAdmin
    .from('files')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', resourceId)
    .select()
    .single();

  if (error || !file) {
    return res.status(500).json({ error: { message: 'Failed to rename' } });
  }

  return res.json({ file });
});

// ── DELETE /api/shares/access/:resourceId ─────────────────────────────
// Grantee delete — viewer AND editor can delete
// Also deletes share record so it disappears from both lists
router.delete('/access/:resourceId', async (req, res) => {
  const { resourceId } = req.params;

  const { data: share } = await supabaseAdmin
    .from('shares')
    .select('id, role')
    .eq('resource_type',   'file')
    .eq('resource_id',     resourceId)
    .eq('grantee_user_id', req.user.id)
    .maybeSingle();

  if (!share) {
    return res.status(403).json({
      error: { message: 'You do not have access to this file' }
    });
  }

  // Soft delete the file
  await supabaseAdmin
    .from('files')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', resourceId);

  // Delete share record — removes from both Shared with me + Shared by me
  await supabaseAdmin
    .from('shares')
    .delete()
    .eq('id', share.id);

  return res.json({ message: 'File deleted and share removed' });
});

// ── DELETE /api/shares/owner/:resourceType/:resourceId ────────────────
// Owner deletes — removes file AND all share records
router.delete('/owner/:resourceType/:resourceId', async (req, res) => {
  const { resourceType, resourceId } = req.params;

  const table = resourceType === 'file' ? 'files' : 'folders';

  const { data: resource } = await supabaseAdmin
    .from(table)
    .select('id, owner_id')
    .eq('id', resourceId)
    .maybeSingle();

  if (!resource) {
    return res.status(404).json({ error: { message: 'Resource not found' } });
  }

  if (resource.owner_id !== req.user.id) {
    return res.status(403).json({
      error: { message: 'Only the owner can delete this resource' }
    });
  }

  // Delete ALL share records — removes from grantee's list too
  await supabaseAdmin
    .from('shares')
    .delete()
    .eq('resource_type', resourceType)
    .eq('resource_id',   resourceId);

  // Soft delete the resource
  await supabaseAdmin
    .from(table)
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', resourceId);

  return res.json({ message: 'Resource deleted and all shares removed' });
});

// ── GET /api/shares/:resourceType/:resourceId ─────────────────────────
router.get('/:resourceType/:resourceId', async (req, res) => {
  const { resourceType, resourceId } = req.params;

  const { data: shares } = await supabaseAdmin
    .from('shares')
    .select('id, role, created_at, grantee_user_id')
    .eq('resource_type', resourceType)
    .eq('resource_id',   resourceId)
    .eq('created_by',    req.user.id);

  const enriched = await Promise.all(
    (shares || []).map(async (share) => {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', share.grantee_user_id)
        .single();
      return { ...share, user };
    })
  );

  return res.json({ shares: enriched });
});

// ── DELETE /api/shares/:id ── Revoke a share ──────────────────────────
router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('shares')
    .delete()
    .eq('id',         req.params.id)
    .eq('created_by', req.user.id);

  if (error) {
    return res.status(404).json({ error: { message: 'Share not found' } });
  }

  return res.json({ message: 'Access revoked' });
});

module.exports = router;
