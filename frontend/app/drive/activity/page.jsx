'use client';

import { useState, useEffect } from 'react';

const ACTION_ICONS = {
  upload: (
    <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-blue-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21
             18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5' />
      </svg>
    </div>
  ),
  download: (
    <div className='w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-green-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21
             18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3' />
      </svg>
    </div>
  ),
  delete: (
    <div className='w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-red-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107
             1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244
             2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456
             0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114
             1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0
             -1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18
             .037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' />
      </svg>
    </div>
  ),
  restore: (
    <div className='w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-yellow-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3' />
      </svg>
    </div>
  ),
  rename: (
    <div className='w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-purple-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582
             16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1
             1.13-1.897l8.932-8.931Zm0 0L19.5 7.125' />
      </svg>
    </div>
  ),
  share: (
    <div className='w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-indigo-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94
             3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12
             21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12
             0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995
             5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0
             3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6
             0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5
             0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z' />
      </svg>
    </div>
  ),
  create_folder: (
    <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-blue-400'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25
             2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0
             21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0
             1-1.06-.44Z' />
      </svg>
    </div>
  ),
  create_link: (
    <div className='w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-pink-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0
             1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0
             0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' />
      </svg>
    </div>
  ),
  move: (
    <div className='w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0'>
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-orange-500'>
        <path strokeLinecap='round' strokeLinejoin='round'
          d='M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5
             12M21 7.5H7.5' />
      </svg>
    </div>
  ),
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

const DEFAULT_ICON = (
  <div className='w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0'>
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
      stroke='currentColor' strokeWidth='1.5' className='w-4 h-4 text-gray-400'>
      <path strokeLinecap='round' strokeLinejoin='round'
        d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125
           0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0
           12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125
           1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0
           1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' />
    </svg>
  </div>
);

export default function ActivityPage() {
  const [activities,   setActivities]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [clearingAll,  setClearingAll]  = useState(false);
  const [clearingId,   setClearingId]   = useState(null);
  const [showConfirm,  setShowConfirm]  = useState(false);

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

  async function handleClearOne(id) {
    setClearingId(id);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/${id}`, {
      method:      'DELETE',
      credentials: 'include',
    });
    setActivities(prev => prev.filter(a => a.id !== id));
    setClearingId(null);
  }

  async function handleClearAll() {
    setClearingAll(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities`, {
      method:      'DELETE',
      credentials: 'include',
    });
    setActivities([]);
    setClearingAll(false);
    setShowConfirm(false);
  }

  return (
    <div>
      {/* Header row */}
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Activity</h1>
        {activities.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={clearingAll}
            className='flex items-center gap-2 px-3 py-1.5 text-sm text-red-500
                       border border-red-200 rounded-lg hover:bg-red-50
                       transition-colors disabled:opacity-50 cursor-pointer'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
              stroke='currentColor' strokeWidth='1.5' className='w-4 h-4'>
              <path strokeLinecap='round' strokeLinejoin='round'
                d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107
                   1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244
                   2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456
                   0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114
                   1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0
                   -1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18
                   .037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' />
            </svg>
            {clearingAll ? 'Clearing...' : 'Clear all'}
          </button>
        )}
      </div>

      {/* Confirm clear all modal */}
      {showConfirm && (
        <div className='fixed inset-0 bg-black/40 flex items-center
                        justify-center z-50'>
          <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-sm'>
            <h2 className='text-lg font-semibold text-gray-800 mb-2'>
              Clear all activity?
            </h2>
            <p className='text-sm text-gray-500 mb-6'>
              This will permanently remove all activity logs. This action
              cannot be undone.
            </p>
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => setShowConfirm(false)}
                className='px-4 py-2 text-sm text-gray-600
                           hover:bg-gray-100 rounded-lg transition-colors cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                disabled={clearingAll}
                className='px-4 py-2 text-sm bg-red-500 text-white rounded-lg
                           hover:bg-red-600 disabled:opacity-50 transition-colors cursor-pointer'
              >
                {clearingAll ? 'Clearing...' : 'Clear all'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <p className='text-gray-400 animate-pulse'>Loading...</p>
      )}

      {!loading && activities.length === 0 && (
        <div className='text-center py-20'>
          <div className='w-12 h-12 rounded-xl bg-gray-100 flex items-center
                          justify-center mx-auto mb-4'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'
              stroke='currentColor' strokeWidth='1.5' className='w-6 h-6 text-gray-400'>
              <path strokeLinecap='round' strokeLinejoin='round'
                d='M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125
                   1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0
                   12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125
                   1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0
                   1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z' />
            </svg>
          </div>
          <p className='text-gray-500'>No activity yet</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {activities.map((activity, i) => (
            <div
              key={activity.id}
              className={`group flex items-center gap-4 px-4 py-3
                          hover:bg-gray-50 transition-colors
                          ${i !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              {ACTION_ICONS[activity.action] ?? DEFAULT_ICON}

              <div className='flex-1 min-w-0'>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>
                    {ACTION_LABELS[activity.action] || activity.action}
                  </span>
                  {activity.resource_name && (
                    <span className='text-gray-500'>
                      {' '}{activity.resource_name}
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

              {/* Per-row clear button — visible on hover */}
              <button
                onClick={() => handleClearOne(activity.id)}
                disabled={clearingId === activity.id}
                title='Remove this activity'
                className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                           text-gray-300 hover:text-red-400 hover:bg-red-50
                           transition-all disabled:opacity-50 shrink-0 cursor-pointer'
              >
                {clearingId === activity.id ? (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                    fill='none' stroke='currentColor' strokeWidth='1.5'
                    className='w-4 h-4 animate-spin'>
                    <path strokeLinecap='round' strokeLinejoin='round'
                      d='M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993
                         0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25
                         0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' />
                  </svg>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                    fill='none' stroke='currentColor' strokeWidth='1.5'
                    className='w-4 h-4'>
                    <path strokeLinecap='round' strokeLinejoin='round'
                      d='M6 18 18 6M6 6l12 12' />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}