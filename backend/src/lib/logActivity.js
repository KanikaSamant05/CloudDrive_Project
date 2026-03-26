const { supabaseAdmin } = require('./supabase');

async function logActivity({ userId, action, resourceType, resourceId, resourceName, context }) {
  try {
    await supabaseAdmin
      .from('activities')
      .insert({
        actor_id:      userId,
        action,
        resource_type: resourceType,
        resource_id:   resourceId,
        resource_name: resourceName || null,
        context:       context      || null,
      });
  } catch (err) {
    // Never let logging break the main flow
    console.error('Failed to log activity:', err.message);
  }
}

module.exports = { logActivity };
