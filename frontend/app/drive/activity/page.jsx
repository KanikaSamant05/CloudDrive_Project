'use client';

import { useState, useEffect } from 'react';

const ACTION_ICONS = {
  upload:        '⬆️',
  download:      '⬇️',
  delete:        '🗑️',
  restore:       '↩️',
  rename:        '✏️',
  share:         '👥',
  create_folder: '📁',
  create_link:   '🔗',
  move:          '📦',
};

const ACTION_LABELS = {
  upload:        'Uploaded',
  download:      'Downloaded',
  delete:        'Moved to trash',
  restore:       'Restored',
  rename:        'Renamed',
  share:         'Shared',
  create_folder: 'Created folder',
  create_link:   'Created public link',
  move:          'Moved',
};

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities?limit=50`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        setActivities(data.activities || []);
        setLoading(false);
      });
  }, []);

  function timeAgo(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Just now';
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
<div>
<h1 className='text-2xl font-bold text-gray-800 mb-6'>Activity</h1>

      {loading &&<p className='text-gray-400 animate-pulse'>Loading...</p>}

      {!loading && activities.length === 0 && (
<div className='text-center py-20'>
<p className='text-4xl mb-4'>📋</p>
<p className='text-gray-500'>No activity yet</p>
</div>
      )}

      {activities.length > 0 && (
<div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {activities.map((activity, i) => (
<div key={activity.id}
              className={`flex items-center gap-4 px-4 py-3
                          ${i !== 0 ? 'border-t border-gray-100' : ''}`}
>
<span className='text-2xl'>
                {ACTION_ICONS[activity.action] || '📋'}
</span>
<div className='flex-1 min-w-0'>
<p className='text-sm text-gray-700'>
<span className='font-medium'>
                    {ACTION_LABELS[activity.action] || activity.action}
</span>
                  {activity.resource_name && (
<span className='text-gray-500'>
                      {''}{activity.resource_name}
</span>
                  )}
</p>
<p className='text-xs text-gray-400 mt-0.5'>
                  {new Date(activity.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                  {' • '}
                  {timeAgo(activity.created_at)}
</p>
</div>

</div>
          ))}
</div>
      )}
</div>
  );
}
