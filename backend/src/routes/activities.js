const { Router } = require('express');
const { supabaseAdmin } = require('../lib/supabase');
const { requireAuth }   = require('../middleware/requireAuth');

const router = Router();
router.use(requireAuth);

// ── GET /api/activities ── Get recent activity log ────────────────
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;

  const { data: activities } = await supabaseAdmin
    .from('activities')
    .select('*')
    .eq('actor_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return res.json({ activities: activities || [] });
});

// ── POST /api/activities ── Log an action ─────────────────────────
router.post('/', async (req, res) => {
  const { action, resourceType, resourceId, resourceName, context } = req.body;

  const { error } = await supabaseAdmin
    .from('activities')
    .insert({
      actor_id:      req.user.id,
      action,
      resource_type: resourceType,
      resource_id:   resourceId,
      resource_name: resourceName,
      context:       context || null,
    });

  if (error) {
    return res.status(500).json({ error: { message: error.message } });
  }

  return res.status(201).json({ message: 'Activity logged' });
});

module.exports = router;
