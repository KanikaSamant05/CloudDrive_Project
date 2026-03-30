'use client';

import { useState, useEffect } from 'react';

export default function StarredPage() {
  const [files,   setFiles]   = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stars`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(data => {
        setFiles(data.files     || []);
        setFolders(data.folders || []);
        setLoading(false);
      });
  }, []);

  async function handleUnstar(resourceType, resourceId) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stars`, {
      method:      'DELETE',
      headers:     { 'Content-Type': 'application/json' },
      credentials: 'include',
      body:        JSON.stringify({ resourceType, resourceId }),
    });
    if (resourceType === 'file') {
      setFiles(prev => prev.filter(f => f.id !== resourceId));
    } else {
      setFolders(prev => prev.filter(f => f.id !== resourceId));
    }
  }

  const allItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...files.map(f   => ({ ...f, type: 'file'   })),
  ];

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-2'>Starred</h1>
      <p className='text-gray-500 text-sm mb-6'>
        Files and folders you have starred for quick access
      </p>

      {loading && (
        <p className='text-gray-400 animate-pulse'>Loading...</p>
      )}

      {!loading && allItems.length === 0 && (
        <div className='text-center py-20'>
          <div className='text-5xl mb-4'>
            {/* Empty star */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              className='w-16 h-16 mx-auto text-gray-300'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563
                   0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204
                   3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0
                   1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982
                   20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0
                   0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563
                   0 0 0 .475-.345L11.48 3.5Z'
              />
            </svg>
          </div>
          <p className='text-gray-500 font-medium'>No starred items yet</p>
          <p className='text-gray-400 text-sm mt-1'>
            Click the star icon on any file to add it here
          </p>
        </div>
      )}

      {allItems.length > 0 && (
        <div className='bg-white border border-gray-200 rounded-xl
                        overflow-hidden'>
          {allItems.map((item, i) => (
            <StarredItem
              key={item.id}
              item={item}
              isFirst={i === 0}
              onUnstar={() => handleUnstar(item.type, item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── StarredItem component ─────────────────────────────────────────────
function StarredItem({ item, isFirst, onUnstar }) {
  const [starred,  setStarred]  = useState(true);
  const [opening,  setOpening]  = useState(false);

  async function handleToggle() {
    setStarred(false);
    await onUnstar();
  }

  // ── Open file in new tab ───────────────────────────────────────────
  async function handleOpen() {
    // Folders have no signed URL — nothing to open
    if (item.type === 'folder') return;
    setOpening(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/${item.id}`,
      { credentials: 'include' }
    );
    const data = await res.json();
    if (data.signedUrl) window.open(data.signedUrl, '_blank');
    setOpening(false);
  }

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50
                  ${!isFirst ? 'border-t border-gray-100' : ''}`}
    >
      {/* ── Icon — clickable for files ──────────────────────────────── */}
      <span
        onClick={item.type === 'file' ? handleOpen : undefined}
        className={`text-2xl ${
          item.type === 'file'
            ? 'cursor-pointer hover:opacity-70 transition-opacity'
            : ''
        }`}
      >
        {item.type === 'folder' ? '🗂️' : '📄'}
      </span>

      {/* ── Name — clickable for files ──────────────────────────────── */}
      <div className='flex-1 min-w-0'>
        {item.type === 'file' ? (
          <button
            onClick={handleOpen}
            disabled={opening}
            className='text-sm font-medium text-gray-700 hover:text-blue-600
                       hover:underline truncate text-left w-full
                       transition-colors disabled:opacity-50 block'
          >
            {opening ? 'Opening...' : item.name}
          </button>
        ) : (
          <p className='text-sm font-medium text-gray-700 truncate'>
            {item.name}
          </p>
        )}
        <p className='text-xs text-gray-400 mt-0.5'>
          {item.type}
          {item.size_bytes && (
            <span>
              {' · '}
              {item.size_bytes < 1024 * 1024
                ? `${(item.size_bytes / 1024).toFixed(1)} KB`
                : `${(item.size_bytes / 1024 / 1024).toFixed(1)} MB`
              }
            </span>
          )}
        </p>
      </div>

      {/* ── Star button ─────────────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        title='Remove from starred'
        className='p-1.5 rounded-lg hover:bg-gray-100 transition-colors'
      >
        {starred ? (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='currentColor'
            className='w-5 h-5 text-yellow-400 transition-colors'
          >
            <path
              fillRule='evenodd'
              d='M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082
                 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117
                 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12
                 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434
                 2.082-5.005Z'
              clipRule='evenodd'
            />
          </svg>
        ) : (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            className='w-5 h-5 text-gray-300 transition-colors'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              d='M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563
                 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204
                 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0
                 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982
                 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0
                 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563
                 0 0 0 .475-.345L11.48 3.5Z'
            />
          </svg>
        )}
      </button>
    </div>
  );
}