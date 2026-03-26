const { Router } = require('express');
const { z }      = require('zod');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');
const { logActivity }   = require('../lib/logActivity');

const router = Router();
router.use(requireAuth);

const BUCKET = 'drive';

// ── POST /api/files/init ──────────────────────────────────────────────
router.post('/init', async (req, res) => {
  const schema = z.object({
    name:      z.string().min(1).max(255),
    mimeType:  z.string(),
    sizeBytes: z.number().positive(),
    folderId:  z.string().uuid().nullable().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: result.error.issues[0].message } });
  }

  const { name, mimeType, sizeBytes, folderId } = result.data;
  const userId = req.user.id;

  const fileId     = crypto.randomUUID();
  const slug       = name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
  const storageKey = `tenants/${userId}/${fileId}-${slug}`;

  const { data: file, error: dbError } = await supabaseAdmin
    .from('files')
    .insert({
      id:          fileId,
      name,
      mime_type:   mimeType,
      size_bytes:  sizeBytes,
      storage_key: storageKey,
      owner_id:    userId,
      folder_id:   folderId || null,
    })
    .select()
    .single();

  if (dbError) {
    return res.status(500).json({ error: { message: dbError.message } });
  }

  const { data: uploadData, error: uploadError } = await supabaseAdmin
    .storage
    .from(BUCKET)
    .createSignedUploadUrl(storageKey);

  if (uploadError) {
    await supabaseAdmin.from('files').delete().eq('id', fileId);
    return res.status(500).json({ error: { message: uploadError.message } });
  }

  return res.json({
    fileId,
    storageKey,
    uploadUrl: uploadData.signedUrl,
    token:     uploadData.token,
  });
});

// ── POST /api/files/complete ──────────────────────────────────────────
router.post('/complete', async (req, res) => {
  const schema = z.object({ fileId: z.string().uuid() });
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: 'fileId required' } });
  }

  const { data: file } = await supabaseAdmin
    .from('files')
    .select('storage_key, name')   // ← also select name for logging
    .eq('id', result.data.fileId)
    .eq('owner_id', req.user.id)
    .single();

  if (!file) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }

  // ── Log upload activity ──────────────────────────────────────────
  await logActivity({
    userId:       req.user.id,
    action:       'upload',
    resourceType: 'file',
    resourceId:   result.data.fileId,
    resourceName: file.name,
  });

  return res.json({ message: 'Upload complete', fileId: result.data.fileId });
});

// ── GET /api/files/trash/list ─────────────────────────────────────────
router.get('/trash/list', async (req, res) => {
  const { data: files } = await supabaseAdmin
    .from('files')
    .select('*')
    .eq('owner_id', req.user.id)
    .eq('is_deleted', true)
    .order('updated_at', { ascending: false });

  const { data: folders } = await supabaseAdmin
    .from('folders')
    .select('*')
    .eq('owner_id', req.user.id)
    .eq('is_deleted', true)
    .order('updated_at', { ascending: false });

  return res.json({ files: files || [], folders: folders || [] });
});

// ── POST /api/files/restore ───────────────────────────────────────────
router.post('/restore', async (req, res) => {
  const { resourceType, resourceId } = req.body;
  const table = resourceType === 'folder' ? 'folders' : 'files';

  const { error } = await supabaseAdmin
    .from(table)
    .update({ is_deleted: false, updated_at: new Date().toISOString() })
    .eq('id', resourceId)
    .eq('owner_id', req.user.id);

  if (error) {
    return res.status(404).json({ error: { message: 'Item not found' } });
  }

  // ── Log restore activity ─────────────────────────────────────────
  await logActivity({
    userId:       req.user.id,
    action:       'restore',
    resourceType: resourceType,
    resourceId:   resourceId,
  });

  return res.json({ message: 'Item restored successfully' });
});

// ── DELETE /api/files/:id/permanent ── Permanently delete ────────────
router.delete('/:id/permanent', async (req, res) => {
  const { data: file } = await supabaseAdmin
    .from('files')
    .select('storage_key, name')
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .single();

  if (!file) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }

  // Delete from Supabase Storage
  await supabaseAdmin
    .storage
    .from(BUCKET)
    .remove([file.storage_key]);

  // Delete from database
  await supabaseAdmin
    .from('files')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);

  return res.json({ message: 'File permanently deleted' });
});

// ── GET /api/files/:id ────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data: file, error } = await supabaseAdmin
    .from('files')
    .select('*')
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .eq('is_deleted', false)
    .single();

  if (error || !file) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }

  const { data: signedData } = await supabaseAdmin
    .storage
    .from(BUCKET)
    .createSignedUrl(file.storage_key, 60);

  // ── Log download activity ────────────────────────────────────────
  await logActivity({
    userId:       req.user.id,
    action:       'download',
    resourceType: 'file',
    resourceId:   file.id,
    resourceName: file.name,
  });

  return res.json({ file, signedUrl: signedData?.signedUrl });
});

// ── PATCH /api/files/:id ──────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const schema = z.object({
    name:     z.string().min(1).max(255).optional(),
    folderId: z.string().uuid().nullable().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: result.error.issues[0].message } });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (result.data.name     !== undefined) updates.name      = result.data.name;
  if (result.data.folderId !== undefined) updates.folder_id = result.data.folderId;

  const { data: file, error } = await supabaseAdmin
    .from('files')
    .update(updates)
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .select()
    .single();

  if (error || !file) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }

  // ── Log rename activity ──────────────────────────────────────────
  if (result.data.name) {
    await logActivity({
      userId:       req.user.id,
      action:       'rename',
      resourceType: 'file',
      resourceId:   req.params.id,
      resourceName: result.data.name,
    });
  }

  // ── Log move activity ────────────────────────────────────────────
  if (result.data.folderId !== undefined) {
    await logActivity({
      userId:       req.user.id,
      action:       'move',
      resourceType: 'file',
      resourceId:   req.params.id,
      resourceName: file.name,
    });
  }

  return res.json({ file });
});

// ── DELETE /api/files/:id ── Soft delete ──────────────────────────────
router.delete('/:id', async (req, res) => {
  // Get file name before deleting for activity log
  const { data: file } = await supabaseAdmin
    .from('files')
    .select('name')
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id)
    .single();

  const { error } = await supabaseAdmin
    .from('files')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);

  if (error) {
    return res.status(404).json({ error: { message: 'File not found' } });
  }

  // ── Log delete activity ──────────────────────────────────────────
  await logActivity({
    userId:       req.user.id,
    action:       'delete',
    resourceType: 'file',
    resourceId:   req.params.id,
    resourceName: file?.name,
  });
  return res.json({ message: 'File moved to trash' });
});

module.exports = router; 