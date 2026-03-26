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

    await fetch(url, {
      method:      'DELETE',
      credentials: 'include',
    });

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
                <button
                  onClick={() => handleRestore(item.type, item.id)}
                  className='text-xs text-green-600 hover:underline px-3 py-1
                             rounded hover:bg-green-50 font-medium'
                >
                  ↩ Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(item.type, item.id)}
                  className='text-xs text-red-500 hover:underline px-3 py-1
                             rounded hover:bg-red-50 font-medium'
                >
                  🗑️ Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}