'use client';

import { useState, useEffect } from 'react';

export default function LinkPage() {
  const [files,        setFiles]        = useState([]);
  const [folders,      setFolders]      = useState([]);
  const [resourceType, setResourceType] = useState('file');
  const [resourceId,   setResourceId]   = useState('');
  const [password,     setPassword]     = useState('');
  const [expiresAt,    setExpiresAt]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(true);
  const [link,         setLink]         = useState('');
  const [error,        setError]        = useState('');
  const [copied,       setCopied]       = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setFetching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/folders/root`,
        { credentials: 'include' }
      );

      // If not logged in redirect to login
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await res.json();
      setFiles(data.files     || []);
      setFolders(data.folders || []);
    } catch (err) {
      console.log('Error fetching items:', err);
    }
    setFetching(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!resourceId) {
      setError('Please select a file or folder');
      return;
    }
    setLoading(true);
    setError('');
    setLink('');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/link-shares`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          resourceType,
          resourceId,
          password:  password  || undefined,
          expiresAt: expiresAt || undefined,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || 'Failed to create link');
    } else {
      const url = `${window.location.origin}/share/${data.token}`;
      setLink(url);
    }
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const items = resourceType === 'file' ? files : folders;

  return (
    <div className='max-w-lg'>
      <h1 className='text-2xl font-bold text-gray-800 mb-2'>Public Links</h1>
      <p className='text-gray-500 text-sm mb-8'>
        Create a link anyone can use to access a file — no account needed.
      </p>

      <div className='bg-white border border-gray-200 rounded-xl p-6'>

        {error && (
          <div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            ❌ {error}
          </div>
        )}

        {link && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
            <p className='text-sm font-medium text-green-700 mb-2'>
              ✅ Link created!
            </p>
            <div className='flex gap-2'>
              <input
                readOnly
                value={link}
                className='flex-1 text-xs border border-gray-300 rounded
                           px-2 py-1.5 bg-white'
              />
              <button
                onClick={handleCopy}
                className='text-xs bg-green-600 text-white px-3 py-1.5
                           rounded hover:bg-green-700'
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className='space-y-4'>

          {/* File or Folder toggle */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Item Type
            </label>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => { setResourceType('file'); setResourceId(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border
                            transition-colors
                            ${resourceType === 'file'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
              >
                📄 File
              </button>
              <button
                type='button'
                onClick={() => { setResourceType('folder'); setResourceId(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border
                            transition-colors
                            ${resourceType === 'folder'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
              >
                🗂️ Folder
              </button>
            </div>
          </div>

          {/* File/folder picker */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Select {resourceType === 'file' ? 'File' : 'Folder'}
            </label>
            {fetching ? (
              <p className='text-sm text-gray-400 animate-pulse py-2'>
                Loading...
              </p>
            ) : items.length === 0 ? (
              <p className='text-sm text-gray-400 py-2'>
                No {resourceType}s found. Upload something first!
              </p>
            ) : (
              <div className='border border-gray-200 rounded-lg overflow-hidden
                              max-h-48 overflow-y-auto'>
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => setResourceId(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5
                                text-left text-sm transition-colors
                                ${i !== 0 ? 'border-t border-gray-100' : ''}
                                ${resourceId === item.id
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-700'
                                }`}
                  >
                    <span>
                      {resourceType === 'file' ? '📄' : '🗂️'}
                    </span>
                    <span className='truncate flex-1'>{item.name}</span>
                    {resourceId === item.id && (
                      <span className='text-blue-600 font-bold'>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Show selected item name */}
            {resourceId && (
              <div className='mt-2 flex items-center gap-2 text-sm text-blue-700
                              bg-blue-50 px-3 py-2 rounded-lg'>
                <span>{resourceType === 'file' ? '📄' : '🗂️'}</span>
                <span className='font-medium truncate'>
                  {items.find(i => i.id === resourceId)?.name}
                </span>
                <button
                  type='button'
                  onClick={() => setResourceId('')}
                  className='ml-auto text-gray-400 hover:text-gray-600 text-xs'
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Password (optional)
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Leave empty for no password'
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {/* Expiry */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Expiry date (optional)
            </label>
            <input
              type='datetime-local'
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <button
            type='submit'
            disabled={loading || !resourceId}
            className='w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                       hover:bg-blue-700 disabled:opacity-50 text-sm'
          >
            {loading ? 'Creating...' : '🔗 Create public link'}
          </button>
        </form>
      </div>
    </div>
  );
}