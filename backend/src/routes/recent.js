const { Router } = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

// ── GET /api/recent ── Get recently modified files ────────────────────
router.get('/', async (req, res) => {
  const { data: files } = await supabaseAdmin
    .from('files')
    .select('id, name, mime_type, size_bytes, folder_id, created_at, updated_at')
    .eq('owner_id', req.user.id)
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false })
    .limit(20);

  return res.json({ files: files || [] });
});

module.exports = router;
