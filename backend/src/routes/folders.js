const { Router } = require('express');
const { z }      = require('zod');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');
const { logActivity }   = require('../lib/logActivity');

const router = Router();
router.use(requireAuth);

// ── POST /api/folders ── Create a new folder ──────────────────────────
router.post('/', async (req, res) => {
  const schema = z.object({
    name:     z.string().min(1).max(255),
    parentId: z.string().uuid().nullable().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: result.error.issues[0].message } });
  }

  const { name, parentId } = result.data;
  const userId = req.user.id;

  if (parentId) {
    const { data: parent } = await supabaseAdmin
      .from('folders')
      .select('id')
      .eq('id', parentId)
      .eq('owner_id', userId)
      .single();
    if (!parent) {
      return res.status(404).json({ error: { message: 'Parent folder not found' } });
    }
  }

  const { data: folder, error } = await supabaseAdmin
    .from('folders')
    .insert({ name, owner_id: userId, parent_id: parentId || null })
    .select()
    .single();

  if (error) {
    const msg = error.message.includes('unique')
      ? 'A folder with this name already exists here'
      : error.message;
    return res.status(400).json({ error: { message: msg } });
  }

  // ── Log activity ───────────────────────────────────────────────────
  await logActivity({
    userId,
    action:       'create_folder',
    resourceType: 'folder',
    resourceId:   folder.id,
    resourceName: folder.name,
  });

  return res.status(201).json({ folder });
});

// ── DELETE /api/folders/:id/permanent ── Permanently delete ──────────
// IMPORTANT: must be BEFORE /:id routes
router.delete('/:id/permanent', async (req, res) => {
  const { error } = await supabaseAdmin
    .from('folders')
    .delete()
    .eq('id',       req.params.id)
    .eq('owner_id', req.user.id);

  if (error) {
    return res.status(404).json({ error: { message: 'Folder not found' } });
  }

  return res.json({ message: 'Folder permanently deleted' });
});

// ── GET /api/folders/:id ── Get folder contents + breadcrumb ─────────
router.get('/:id', async (req, res) => {
  const userId   = req.user.id;
  const folderId = req.params.id;
  const isRoot   = folderId === 'root';
  const page     = parseInt(req.query.page)  || 1;
  const limit    = parseInt(req.query.limit) || 50;
  const offset   = (page - 1) * limit;

  // ── Get subfolders with pagination ────────────────────────────────
  const foldersQuery = supabaseAdmin
    .from('folders')
    .select('id, name, created_at, updated_at')
    .eq('owner_id',   userId)
    .eq('is_deleted', false)
    .order('name')
    .range(offset, offset + limit - 1);

  if (isRoot) {
    foldersQuery.is('parent_id', null);
  } else {
    foldersQuery.eq('parent_id', folderId);
  }

  const { data: folders } = await foldersQuery;

  // ── Get files with pagination ─────────────────────────────────────
  const filesQuery = supabaseAdmin
    .from('files')
    .select('id, name, mime_type, size_bytes, created_at, updated_at')
    .eq('owner_id',   userId)
    .eq('is_deleted', false)
    .order('name')
    .range(offset, offset + limit - 1);

  if (isRoot) {
    filesQuery.is('folder_id', null);
  } else {
    filesQuery.eq('folder_id', folderId);
  }

  const { data: files } = await filesQuery;

  // ── Build breadcrumb path ─────────────────────────────────────────
  let path = [];
  if (!isRoot) {
    let currentId = folderId;
    while (currentId) {
      const { data: f } = await supabaseAdmin
        .from('folders')
        .select('id, name, parent_id')
        .eq('id', currentId)
        .single();
      if (!f) break;
      path.unshift({ id: f.id, name: f.name });
      currentId = f.parent_id;
    }
  }

  return res.json({
    folders: folders || [],
    files:   files   || [],
    path,
    page,
    limit,
  });
});

// ── PATCH /api/folders/:id ── Rename or move ──────────────────────────
router.patch('/:id', async (req, res) => {
  const schema = z.object({
    name:     z.string().min(1).max(255).optional(),
    parentId: z.string().uuid().nullable().optional(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: result.error.issues[0].message } });
  }

  const updates = {};
  if (result.data.name     !== undefined) updates.name      = result.data.name;
  if (result.data.parentId !== undefined) updates.parent_id = result.data.parentId;
  updates.updated_at = new Date().toISOString();

  const { data: folder, error } = await supabaseAdmin
    .from('folders')
    .update(updates)
    .eq('id',       req.params.id)
    .eq('owner_id', req.user.id)
    .select()
    .single();

  if (error || !folder) {
    return res.status(404).json({ error: { message: 'Folder not found' } });
  }

  // ── Log rename activity ────────────────────────────────────────────
  if (result.data.name) {
    await logActivity({
      userId:       req.user.id,
      action:       'rename',
      resourceType: 'folder',
      resourceId:   req.params.id,
      resourceName: result.data.name,
    });
  }

  // ── Log move activity ──────────────────────────────────────────────
  if (result.data.parentId !== undefined) {
    await logActivity({
      userId:       req.user.id,
      action:       'move',
      resourceType: 'folder',
      resourceId:   req.params.id,
      resourceName: folder.name,
    });
  }

  return res.json({ folder });
});

// ── DELETE /api/folders/:id ── Soft delete ────────────────────────────
router.delete('/:id', async (req, res) => {
  // Get folder name before deleting for activity log
  const { data: folder } = await supabaseAdmin
    .from('folders')
    .select('name')
    .eq('id',       req.params.id)
    .eq('owner_id', req.user.id)
    .single();

  const { error } = await supabaseAdmin
    .from('folders')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id',       req.params.id)
    .eq('owner_id', req.user.id);

  if (error) {
    return res.status(404).json({ error: { message: 'Folder not found' } });
  }

  // ── Log delete activity ────────────────────────────────────────────
  await logActivity({
    userId:       req.user.id,
    action:       'delete',
    resourceType: 'folder',
    resourceId:   req.params.id,
    resourceName: folder?.name,
  });

  return res.json({ message: 'Folder moved to trash' });
});

module.exports = router;