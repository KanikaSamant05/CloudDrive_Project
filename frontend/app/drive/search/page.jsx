'use client';

import { useState } from 'react';

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
  'svg', 'svgz',
]);

function getExt(name) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function getFileIcon(name) {
  const ext = getExt(name);
  if (IMAGE_EXTENSIONS.has(ext)) return '🖼️';
  if (ext === 'pdf')             return '📕';
  if (['mp4','mov','avi','mkv'].includes(ext)) return '🎬';
  if (['mp3','wav','aac'].includes(ext))       return '🎵';
  return '📄';
}

export default function SearchPage() {
  const [query,    setQuery]   = useState('');
  const [results,  setResults] = useState({ files: [], folders: [] });
  const [loading,  setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [opening,  setOpening] = useState(null); // tracks which file is opening

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

  // ✅ Same pattern as drive page — fetches signed URL then opens in new tab
  async function handleOpen(file) {
    setOpening(file.id);
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
    setOpening(null);
  }

  const total = results.files.length + results.folders.length;

  function formatSize(bytes) {
    if (!bytes)              return '—';
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
        <button
          type='submit'
          disabled={loading}
          className='bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm
                     font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer'
        >
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
      </form>

      {/* Results */}
      {searched && !loading && (
        <div>
          <p className='text-sm text-gray-500 mb-4'>
            {total === 0
              ? 'No results found'
              : `${total} result${total !== 1 ? 's' : ''} for "${query}"`}
          </p>

          {/* Folders */}
          {results.folders.length > 0 && (
            <div className='mb-6'>
              <h2 className='text-sm font-medium text-gray-500 uppercase tracking-wide mb-3'>
                Folders
              </h2>
              <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
                {results.folders.map((folder, i) => (
                  <div
                    key={folder.id}
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
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 px-4 py-3
                                ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <span className='text-xl'>{getFileIcon(file.name)}</span>

                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-700 truncate'>
                        {file.name}
                      </p>
                      <p className='text-xs text-gray-400'>{formatSize(file.size_bytes)}</p>
                    </div>

                    {/* ✅ Open button for ALL files, no badge */}
                    <button
                      onClick={() => handleOpen(file)}
                      disabled={opening === file.id}
                      className='text-xs text-blue-600 border border-blue-200 bg-blue-50
                                 hover:bg-blue-100 px-3 py-1 rounded-md font-medium
                                 whitespace-nowrap flex-shrink-0 disabled:opacity-50
                                 transition-colors cursor-pointer'
                    >
                      {opening === file.id ? 'Opening...' : 'Open'}
                    </button>
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