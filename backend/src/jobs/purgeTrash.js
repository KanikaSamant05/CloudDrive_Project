const cron          = require('node-cron');
const { supabaseAdmin } = require('../lib/supabase');

const BUCKET          = 'drive';
const RETENTION_DAYS  = 30;

async function purgeOldTrash() {
  console.log('Running trash purge job...');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  // Get all files that have been deleted for 30+ days
  const { data: oldFiles } = await supabaseAdmin
    .from('files')
    .select('id, storage_key, name')
    .eq('is_deleted', true)
    .lt('updated_at', cutoffDate.toISOString());

  if (oldFiles && oldFiles.length > 0) {
    console.log(`Purging ${oldFiles.length} old files from trash...`);

    // Delete from storage
    const storageKeys = oldFiles.map(f => f.storage_key);
    await supabaseAdmin.storage.from(BUCKET).remove(storageKeys);

    // Delete from database
    const fileIds = oldFiles.map(f => f.id);
    await supabaseAdmin.from('files').delete().in('id', fileIds);

    console.log(`Purged ${oldFiles.length} files successfully`);
  }

  // Get all folders that have been deleted for 30+ days
  const { data: oldFolders } = await supabaseAdmin
    .from('folders')
    .select('id, name')
    .eq('is_deleted', true)
    .lt('updated_at', cutoffDate.toISOString());

  if (oldFolders && oldFolders.length > 0) {
    console.log(`Purging ${oldFolders.length} old folders from trash...`);
    const folderIds = oldFolders.map(f => f.id);
    await supabaseAdmin.from('folders').delete().in('id', folderIds);
    console.log(`Purged ${oldFolders.length} folders successfully`);
  }

  console.log('Trash purge complete');
}

function startPurgeJob() {
  // Run every day at midnight
  cron.schedule('0 0 * * *', purgeOldTrash);
}

module.exports = { startPurgeJob, purgeOldTrash };
