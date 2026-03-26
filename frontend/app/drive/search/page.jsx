'use client';

import { useState } from 'react';

export default function SearchPage() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState({ files: [], folders: [] });
  const [loading, setLoading] = useState(false);
  const [searched,setSearched]= useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}`,
      { credentials: 'include' }
    );
    const data = await res.json();
    setResults({ files: data.files || [], folders: data.folders || [] });
    setLoading(false);
  }

  const total = results.files.length + results.folders.length;

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1024/1024).toFixed(1)} MB`;
  }

  return (
<div>
<h1 className='text-2xl font-bold text-gray-800 mb-6'>Search</h1>

      {/* Search bar */}
<form onSubmit={handleSearch} className='flex gap-3 mb-8'>
<input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search files and folders...'
          className='flex-1 border border-gray-300 rounded-lg px-4 py-2.5
                     focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
        />
<button type='submit' disabled={loading}
          className='bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm
                     font-medium hover:bg-blue-700 disabled:opacity-50'
>
          {loading ? 'Searching...' : '🔍 Search'}
</button>
</form>

      {/* Results */}
      {searched && !loading && (
<div>
<p className='text-sm text-gray-500 mb-4'>
            {total === 0 ? 'No results found' : `${total} result${total !== 1 ? 's' : ''} for "${query}"`}
</p>

          {/* Folders */}
          {results.folders.length > 0 && (
<div className='mb-6'>
<h2 className='text-sm font-medium text-gray-500 uppercase tracking-wide mb-3'>
                Folders
</h2>
<div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
                {results.folders.map((folder, i) => (
<div key={folder.id}
                    className={`flex items-center gap-3 px-4 py-3
                                ${i !== 0 ? 'border-t border-gray-100' : ''}`}
>
<span className='text-xl'>🗂️</span>
<span className='text-sm font-medium text-gray-700'>{folder.name}</span>
</div>
                ))}
</div>
</div>
          )}

          {/* Files */}
          {results.files.length > 0 && (
<div>
<h2 className='text-sm font-medium text-gray-500 uppercase tracking-wide mb-3'>
                Files
</h2>
<div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
                {results.files.map((file, i) => (
<div key={file.id}
                    className={`flex items-center gap-3 px-4 py-3
                                ${i !== 0 ? 'border-t border-gray-100' : ''}`}
>
<span className='text-xl'>📄</span>
<div className='flex-1 min-w-0'>
<p className='text-sm font-medium text-gray-700 truncate'>{file.name}</p>
<p className='text-xs text-gray-400'>{formatSize(file.size_bytes)}</p>
</div>
</div>
  ))}
</div>
</div>
  )}
</div>
  )}
</div>
  );
}
