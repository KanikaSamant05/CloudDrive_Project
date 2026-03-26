'use client';

import { useState, useEffect } from 'react';

export default function SharedPage() {
  const [files,        setFiles]        = useState([]);
  const [folders,      setFolders]      = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [email,        setEmail]        = useState('');
  const [role,         setRole]         = useState('viewer');
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(true);
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');

  const [sharedWithMe,     setSharedWithMe]     = useState([]);
  const [fetchingReceived, setFetchingReceived] = useState(true);

  const [sharedByMe,     setSharedByMe]     = useState([]);
  const [fetchingShared, setFetchingShared] = useState(true);

  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    fetchItems();
    fetchSharedWithMe();
    fetchSharedByMe();
  }, []);

  async function fetchItems() {
    setFetching(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/folders/root`,
        { credentials: 'include' }
      );
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      setFiles(data.files     || []);
      setFolders(data.folders || []);
    } catch (err) {
      console.log('Error:', err);
    }
    setFetching(false);
  }

  // ── UPDATED: filter out null resources ────────────────────────────
  async function fetchSharedWithMe() {
    setFetchingReceived(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shares/received`,
        { credentials: 'include' }
      );
      const data = await res.json();

      // Filter out shares where resource is null (deleted files)
      const valid = (data.shares || []).filter(s => s.resource !== null);
      setSharedWithMe(valid);
    } catch (err) {
      console.log('Error:', err);
    }
    setFetchingReceived(false);
  }

  // ── UPDATED: filter out null resources ────────────────────────────
  async function fetchSharedByMe() {
    setFetchingShared(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shares/sent`,
        { credentials: 'include' }
      );
      const data = await res.json();

      // Filter out shares where resource is null (deleted files)
      const valid = (data.shares || []).filter(s => s.resource !== null);
      setSharedByMe(valid);
    } catch (err) {
      console.log('Error:', err);
    }
    setFetchingShared(false);
  }

  async function handleShare(e) {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please select a file or folder first');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shares`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          resourceType: selectedItem.type,
          resourceId:   selectedItem.id,
          granteeEmail: email,
          role,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || 'Failed to share');
    } else {
      setSuccess(`✅ "${selectedItem.name}" shared with ${email} as ${role}`);
      setEmail('');
      setSelectedItem(null);
      fetchSharedByMe();
      setActiveTab('sent');
    }
    setLoading(false);
  }

  const allItems = [
    ...folders.map(f => ({ ...f, type: 'folder' })),
    ...files.map(f   => ({ ...f, type: 'file'   })),
  ];

  return (
    <div className='max-w-2xl'>
      <h1 className='text-2xl font-bold text-gray-800 mb-2'>Shared</h1>
      <p className='text-gray-500 text-sm mb-8'>
        Share files with others and track your sharing activity.
      </p>

      {/* ── SECTION 1: Share with someone ─────────────────────────── */}
      <div className='bg-white border border-gray-200 rounded-xl p-6 mb-6'>
        <h2 className='text-lg font-semibold text-gray-800 mb-1'>
          ➕ Share with someone
        </h2>
        <p className='text-gray-500 text-sm mb-4'>
          Share your files and folders with other registered users
        </p>

        {success && (
          <div className='bg-green-50 text-green-700 px-4 py-3 rounded-lg
                          mb-4 text-sm'>
            {success}
          </div>
        )}
        {error && (
          <div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg
                          mb-4 text-sm'>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleShare} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Select file or folder to share
            </label>
            {fetching ? (
              <p className='text-sm text-gray-400 animate-pulse py-2'>
                Loading your files...
              </p>
            ) : allItems.length === 0 ? (
              <p className='text-sm text-gray-400 py-2'>
                No files or folders yet. Upload something first!
              </p>
            ) : (
              <div className='border border-gray-200 rounded-lg overflow-hidden
                              max-h-48 overflow-y-auto'>
                {allItems.map((item, i) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => setSelectedItem(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5
                                text-left text-sm transition-colors
                                ${i !== 0 ? 'border-t border-gray-100' : ''}
                                ${selectedItem?.id === item.id
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'hover:bg-gray-50 text-gray-700'
                                }`}
                  >
                    <span>{item.type === 'folder' ? '🗂️' : '📄'}</span>
                    <span className='truncate flex-1'>{item.name}</span>
                    <span className='text-xs text-gray-400 shrink-0'>
                      {item.type}
                    </span>
                    {selectedItem?.id === item.id && (
                      <span className='text-blue-600 font-bold ml-1'>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {selectedItem && (
              <div className='mt-2 flex items-center gap-2 text-sm
                              text-blue-700 bg-blue-50 px-3 py-2 rounded-lg'>
                <span>
                  {selectedItem.type === 'folder' ? '🗂️' : '📄'}
                </span>
                <span className='font-medium truncate flex-1'>
                  {selectedItem.name}
                </span>
                <button
                  type='button'
                  onClick={() => setSelectedItem(null)}
                  className='text-gray-400 hover:text-gray-600 text-xs'
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Share with (email address)
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='teammate@example.com'
              required
              className='w-full border border-gray-300 rounded-lg px-3 py-2
                         text-sm focus:outline-none focus:ring-2
                         focus:ring-blue-500'
            />
            <p className='text-xs text-gray-400 mt-1'>
              The person must have an account in this app
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Permission level
            </label>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setRole('viewer')}
                className={`flex-1 py-2.5 rounded-lg text-sm border
                            transition-colors
                            ${role === 'viewer'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
              >
                👁 Viewer
                <p className={`text-xs mt-0.5
                               ${role === 'viewer'
                                 ? 'text-blue-100' : 'text-gray-400'}`}
                >
                  View only
                </p>
              </button>
              <button
                type='button'
                onClick={() => setRole('editor')}
                className={`flex-1 py-2.5 rounded-lg text-sm border
                            transition-colors
                            ${role === 'editor'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
              >
                ✏️ Editor
                <p className={`text-xs mt-0.5
                               ${role === 'editor'
                                 ? 'text-blue-100' : 'text-gray-400'}`}
                >
                  Can modify
                </p>
              </button>
            </div>
          </div>

          <button
            type='submit'
            disabled={loading || !selectedItem}
            className='w-full bg-blue-600 text-white py-2.5 rounded-lg
                       font-medium hover:bg-blue-700 disabled:opacity-50
                       text-sm'
          >
            {loading ? 'Sharing...' : 'Share'}
          </button>
        </form>
      </div>

      {/* ── SECTION 2: Sharing Activity ───────────────────────────── */}
      <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>

        <div className='px-6 py-4 border-b border-gray-100'>
          <h2 className='text-lg font-semibold text-gray-800'>
            📊 Sharing Activity
          </h2>
          <p className='text-gray-500 text-sm mt-0.5'>
            Track what you have shared and what others shared with you
          </p>
        </div>

        <div className='flex border-b border-gray-100'>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
                        border-b-2 ${activeTab === 'received'
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
          >
            📥 Shared with me
            {sharedWithMe.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                                font-medium
                                ${activeTab === 'received'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}
              >
                {sharedWithMe.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-3 text-sm font-medium transition-colors
                        border-b-2 ${activeTab === 'sent'
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
          >
            📤 Shared by me
            {sharedByMe.length > 0 && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                                font-medium
                                ${activeTab === 'sent'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                                }`}
              >
                {sharedByMe.length}
              </span>
            )}
          </button>
        </div>

        <div className='p-4'>

          {activeTab === 'received' && (
            <>
              {fetchingReceived && (
                <p className='text-gray-400 animate-pulse text-sm py-4
                               text-center'>
                  Loading...
                </p>
              )}

              {!fetchingReceived && sharedWithMe.length === 0 && (
                <div className='text-center py-10'>
                  <p className='text-3xl mb-3'>📭</p>
                  <p className='text-gray-500 text-sm font-medium'>
                    Nothing shared with you yet
                  </p>
                  <p className='text-gray-400 text-xs mt-1'>
                    Files shared with you will appear here
                  </p>
                </div>
              )}

              {sharedWithMe.length > 0 && (
                <div className='divide-y divide-gray-100'>
                  {sharedWithMe.map((share, i) => (
                    <SharedItem
                      key={share.id}
                      share={share}
                      isFirst={i === 0}
                      isOwner={false}
                      onRefresh={fetchSharedWithMe}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'sent' && (
            <>
              {fetchingShared && (
                <p className='text-gray-400 animate-pulse text-sm py-4
                               text-center'>
                  Loading...
                </p>
              )}

              {!fetchingShared && sharedByMe.length === 0 && (
                <div className='text-center py-10'>
                  <p className='text-3xl mb-3'>📤</p>
                  <p className='text-gray-500 text-sm font-medium'>
                    You have not shared anything yet
                  </p>
                  <p className='text-gray-400 text-xs mt-1'>
                    Use the form above to share files with others
                  </p>
                </div>
              )}

              {sharedByMe.length > 0 && (
                <div className='divide-y divide-gray-100'>
                  {sharedByMe.map((share, i) => (
                    <SharedItem
                      key={share.id}
                      share={share}
                      isFirst={i === 0}
                      isOwner={true}
                      onRefresh={fetchSharedByMe}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ── SharedItem component ──────────────────────────────────────────────
function SharedItem({ share, isFirst, isOwner, onRefresh }) {
  const [renaming,  setRenaming]  = useState(false);
  const [newName,   setNewName]   = useState(share.resource?.name || '');
  const [viewing,   setViewing]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [error,     setError]     = useState('');

  const isEditor = share.role === 'editor';

  async function handleView() {
    setViewing(true);
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shares/access/${share.resource_type}/${share.resource_id}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        setError('Could not open file');
      }
    } catch {
      setError('Failed to open file');
    }
    setViewing(false);
  }

  async function handleRename() {
    if (!newName.trim() || newName === share.resource?.name) {
      setRenaming(false);
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/shares/access/${share.resource_id}`,
        {
          method:      'PATCH',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ name: newName.trim() }),
        }
      );
      if (res.ok) {
        setRenaming(false);
        onRefresh();
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Failed to rename');
      }
    } catch {
      setError('Rename failed');
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this file? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const url = isOwner
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/shares/owner/${share.resource_type}/${share.resource_id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/shares/access/${share.resource_id}`;

      const res = await fetch(url, {
        method:      'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        onRefresh();
      } else {
        const data = await res.json();
        setError(data.error?.message || 'Failed to delete');
        setDeleting(false);
      }
    } catch {
      setError('Delete failed');
      setDeleting(false);
    }
  }

  return (
    <div className={`flex items-center gap-4 py-3
                     ${!isFirst ? 'pt-3' : ''}`}
    >
      <span className='text-2xl shrink-0'>
        {share.resource_type === 'folder' ? '🗂️' : '📄'}
      </span>

      <div className='flex-1 min-w-0'>
        {renaming ? (
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  handleRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
            className='text-sm border border-blue-400 rounded px-2 py-0.5
                       focus:outline-none focus:ring-1 focus:ring-blue-500
                       w-full'
          />
        ) : (
          <p className='text-sm font-medium text-gray-700 truncate'>
            {share.resource?.name || 'Unknown file'}
          </p>
        )}

        <div className='flex items-center gap-2 mt-0.5 flex-wrap'>
          {isOwner ? (
            <p className='text-xs text-gray-400'>
              Shared with{' '}
              <span className='font-medium text-gray-600'>
                {share.grantee?.name || share.grantee?.email || 'Unknown'}
              </span>
            </p>
          ) : (
            <p className='text-xs text-gray-400'>
              Shared by{' '}
              <span className='font-medium text-gray-600'>
                {share.owner?.name || share.owner?.email || 'Unknown'}
              </span>
            </p>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium
                            ${isEditor
                              ? 'bg-green-50 text-green-700'
                              : 'bg-blue-50 text-blue-700'
                            }`}
          >
            {isEditor ? '✏️ Editor' : '👁 Viewer'}
          </span>
        </div>

        {error && (
          <p className='text-xs text-red-500 mt-1'>❌ {error}</p>
        )}
      </div>

      <div className='flex items-center gap-1 shrink-0'>

        {share.resource_type === 'file' && !isOwner && (
          <button
            onClick={handleView}
            disabled={viewing}
            className='text-xs text-blue-600 px-2 py-1.5 rounded
                       hover:bg-blue-50 hover:underline disabled:opacity-50
                       transition-colors'
          >
            {viewing ? '...' : '👁 View'}
          </button>
        )}

        {!isOwner && isEditor && share.resource_type === 'file' && (
          <button
            onClick={() => { setRenaming(true); setError(''); }}
            className='text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5
                       rounded hover:bg-gray-100 transition-colors'
          >
            ✏️ Rename
          </button>
        )}

        {share.resource_type === 'file' && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className='text-xs text-red-400 hover:text-red-600 px-2 py-1.5
                       rounded hover:bg-red-50 disabled:opacity-50
                       transition-colors'
            title={isOwner
              ? 'Delete file and remove all shares'
              : 'Delete this file'
            }
          >
            {deleting ? '...' : '🗑️'}
          </button>
        )}

      </div>
    </div>
  );
}
