const { Router } = require('express');
const { z }      = require('zod');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

// ── GET /api/stars ── List all starred items ──────────────────────────
router.get('/', async (req, res) => {
  const userId = req.user.id;

  const { data: stars } = await supabaseAdmin
    .from('stars')
    .select('resource_type, resource_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!stars || stars.length === 0) {
    return res.json({ files: [], folders: [] });
  }

  // Separate file and folder stars
  const fileIds   = stars.filter(s => s.resource_type === 'file').map(s => s.resource_id);
  const folderIds = stars.filter(s => s.resource_type === 'folder').map(s => s.resource_id);

  // Fetch file details
  const { data: files } = fileIds.length > 0
    ? await supabaseAdmin
        .from('files')
        .select('id, name, mime_type, size_bytes, created_at')
        .in('id', fileIds)
        .eq('is_deleted', false)
    : { data: [] };

  // Fetch folder details
  const { data: folders } = folderIds.length > 0
    ? await supabaseAdmin
        .from('folders')
        .select('id, name, created_at')
        .in('id', folderIds)
        .eq('is_deleted', false)
    : { data: [] };

  return res.json({ files: files || [], folders: folders || [] });
});

// ── POST /api/stars ── Star an item ───────────────────────────────────
router.post('/', async (req, res) => {
  const schema = z.object({
    resourceType: z.enum(['file','folder']),
    resourceId:   z.string().uuid(),
  });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: { message: result.error.issues[0].message } });
  }

  const { resourceType, resourceId } = result.data;

  const { error } = await supabaseAdmin
    .from('stars')
    .upsert({
      user_id:       req.user.id,
      resource_type: resourceType,
      resource_id:   resourceId,
    }, { onConflict: 'user_id,resource_type,resource_id' });

  if (error) {
    return res.status(500).json({ error: { message: error.message } });
  }

  return res.status(201).json({ message: 'Starred' });
});

// ── DELETE /api/stars ── Unstar an item ───────────────────────────────
router.delete('/', async (req, res) => {
  const { resourceType, resourceId } = req.body;

  const { error } = await supabaseAdmin
    .from('stars')
    .delete()
    .eq('user_id',       req.user.id)
    .eq('resource_type', resourceType)
    .eq('resource_id',   resourceId);

  if (error) {
    return res.status(500).json({ error: { message: error.message } });
  }

  return res.json({ message: 'Unstarred' });
});

module.exports = router;
