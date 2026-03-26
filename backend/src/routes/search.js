const { Router } = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth } = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

// ── GET /api/search ── Search files and folders ───────────────────────
// Query params: q (search term), type (file|folder|all)
router.get('/', async (req, res) => {
  const { q, type = 'all' } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json({ files: [], folders: [] });
  }

  const searchTerm = `%${q.trim()}%`;
  const userId = req.user.id;

  let files = [];
  let folders = [];

  // Search files
  if (type === 'all' || type === 'file') {
    const { data } = await supabaseAdmin
      .from('files')
      .select('id, name, mime_type, size_bytes, folder_id, created_at')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .ilike('name', searchTerm)
      .order('name')
      .limit(20);
    files = data || [];
  }

  // Search folders
  if (type === 'all' || type === 'folder') {
    const { data } = await supabaseAdmin
      .from('folders')
      .select('id, name, parent_id, created_at')
      .eq('owner_id', userId)
      .eq('is_deleted', false)
      .ilike('name', searchTerm)
      .order('name')
      .limit(20);
    folders = data || [];
  }

  return res.json({ files, folders });
});

module.exports = router;
