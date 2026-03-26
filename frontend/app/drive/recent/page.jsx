'use client';

import { useState, useEffect } from 'react';

export default function RecentPage() {
  const [files,   setFiles]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recent`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setFiles(data.files || []); setLoading(false); });
  }, []);

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1024/1024).toFixed(1)} MB`;
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60)  return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    if (hours < 24)  return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  return (
<div>
<h1 className='text-2xl font-bold text-gray-800 mb-6'>Recent</h1>

      {loading &&<p className='text-gray-400 animate-pulse'>Loading...</p>}

      {!loading && files.length === 0 && (
<div className='text-center py-20'>
<p className='text-4xl mb-4'>🕐</p>
<p className='text-gray-500'>No recent files</p>
</div>
      )}

      {files.length > 0 && (
<div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
          {files.map((file, i) => (
<div key={file.id}
              className={`flex items-center gap-4 px-4 py-3
                          ${i !== 0 ? 'border-t border-gray-100' : ''}`}
>
<span className='text-2xl'>📄</span>
<div className='flex-1 min-w-0'>
<p className='text-sm font-medium text-gray-700 truncate'>{file.name}</p>
<p className='text-xs text-gray-400'>
                  {formatSize(file.size_bytes)} • {timeAgo(file.updated_at)}
</p>
</div>
</div>
          ))}
</div>
      )}
</div>
  );
}
