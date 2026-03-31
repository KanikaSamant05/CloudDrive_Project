'use client';

import { useState, useEffect } from 'react';

export default function TrashPage() {
  const [files,   setFiles]   = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTrash(); }, []);

  async function fetchTrash() {
    setLoading(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/trash/list`,
      { credentials: 'include' }
    );
    const data = await res.json();
    setFiles(data.files     || []);
    setFolders(data.folders || []);
    setLoading(false);
  }

  async function handleRestore(resourceType, resourceId) {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/restore`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ resourceType, resourceId }),
      }
    );
    fetchTrash();
  }

  async function handlePermanentDelete(resourceType, resourceId) {
    if (!confirm('Permanently delete this item? This cannot be undone!')) return;

    const url = resourceType === 'folder'
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${resourceId}/permanent`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/files/${resourceId}/permanent`;

    await fetch(url, { method: 'DELETE', credentials: 'include' });
    fetchTrash();
  }

  const allItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...files.map(f   => ({ ...f, type: 'file'   })),
  ];

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-2'>Trash</h1>
      <p className='text-gray-500 text-sm mb-6'>
        Items here will be permanently deleted after 30 days.
      </p>

      {loading && (
        <p className='text-gray-400 animate-pulse'>Loading...</p>
      )}

      {!loading && allItems.length === 0 && (
        <div className='text-center py-20'>
          <p className='text-4xl mb-4'>🗑️</p>
          <p className='text-gray-500'>Trash is empty</p>
        </div>
      )}

      {allItems.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {allItems.map((item, i) => (
            <div key={item.id}
              className={`flex items-center gap-4 px-4 py-3
                          ${i !== 0 ? 'border-t border-gray-100' : ''}`}
            >
              <span className='text-2xl'>
                {item.type === 'folder' ? '🗂️' : '📄'}
              </span>

              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-700 truncate'>
                  {item.name}
                </p>
                <p className='text-xs text-gray-400'>
                  {item.type} • deleted {new Date(item.updated_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action buttons */}
              <div className='flex items-center gap-2'>

                {/* Restore button */}
                <button
                  onClick={() => handleRestore(item.type, item.id)}
                  className='text-xs text-green-600 px-3 py-1 rounded
                             hover:bg-green-50 font-medium flex items-center gap-1.5 cursor-pointer'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                    fill='none' stroke='currentColor' strokeWidth='1.5'
                    className='w-3.5 h-3.5'>
                    <path strokeLinecap='round' strokeLinejoin='round'
                      d='M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3' />
                  </svg>
                  Restore
                </button>

                {/* Delete forever button */}
                <button
                  onClick={() => handlePermanentDelete(item.type, item.id)}
                  className='text-xs text-red-500 px-3 py-1 rounded
                             hover:bg-red-50 font-medium flex items-center gap-1.5 cursor-pointer'
                >
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                    fill='none' stroke='currentColor' strokeWidth='1.5'
                    className='w-3.5 h-3.5'>
                    <path strokeLinecap='round' strokeLinejoin='round'
                      d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052
                         .682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25
                         0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077
                         L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397
                         m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11
                         0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09
                         -2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09
                         1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' />
                  </svg>
                  Delete forever
                </button>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}