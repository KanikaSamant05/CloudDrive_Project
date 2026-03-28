'use client';

import { useState, useEffect } from 'react';
import UploadZone from '@/components/drive/uploadZone';
import ShareModal from '@/components/drive/ShareModal';
import LinkModal  from '@/components/drive/LinkModal';

export default function DrivePage() {
  const [folders,       setFolders]       = useState([]);
  const [files,         setFiles]         = useState([]);
  const [path,          setPath]          = useState([]);
  const [currentFolder, setCurrentFolder] = useState('root');
  const [loading,       setLoading]       = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creating,      setCreating]      = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    fetchContents(currentFolder);
  }, [currentFolder]);

  async function fetchContents(folderId) {
    setLoading(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}`,
      { credentials: 'include' }
    );
    const data = await res.json();
    setFolders(data.folders || []);
    setFiles(data.files     || []);
    setPath(data.path       || []);
    setLoading(false);
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreating(true);
    setError('');

    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/folders`,
      {
        method:      'POST',
        headers:     `Bearer ${localStorage.getItem('token')}`,
        credentials: 'include',
        body:        JSON.stringify({
          name:     newFolderName.trim(),
          parentId: currentFolder === 'root' ? null : currentFolder,
        }),
      }
    );
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || 'Failed to create folder');
      setCreating(false);
      return;
    }

    setNewFolderName('');
    setShowNewFolder(false);
    setCreating(false);
    fetchContents(currentFolder);
  }

  async function handleDeleteFolder(folderId) {
    if (!confirm('Move this folder to trash?')) return;
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}`,
      { method: 'DELETE', credentials: 'include' }
    );
    fetchContents(currentFolder);
  }

  return (
    <div>
      {/* Header row */}
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>My Drive</h1>
        <button
          onClick={() => setShowNewFolder(true)}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg text-sm
                     font-medium hover:bg-blue-700 transition-colors'
        >
          + New Folder
        </button>
      </div>

      {/* Breadcrumb */}
      <div className='flex items-center gap-2 text-sm text-gray-500 mb-6'>
        <button
          onClick={() => setCurrentFolder('root')}
          className='hover:text-blue-600 transition-colors font-medium'
        >
          My Drive
        </button>
        {path.map((p) => (
          <span key={p.id} className='flex items-center gap-2'>
            <span>/</span>
            <button
              onClick={() => setCurrentFolder(p.id)}
              className='hover:text-blue-600 transition-colors'
            >
              {p.name}
            </button>
          </span>
        ))}
      </div>

      {/* New folder modal */}
      {showNewFolder && (
        <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-sm'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>
              New Folder
            </h2>
            {error && (
              <p className='text-red-500 text-sm mb-3'>❌ {error}</p>
            )}
            <input
              type='text'
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder='Folder name'
              autoFocus
              className='w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         text-sm mb-4'
            />
            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => { setShowNewFolder(false); setError(''); }}
                className='px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creating}
                className='px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 disabled:opacity-50'
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <UploadZone
        currentFolderId={currentFolder}
        onUploadComplete={() => fetchContents(currentFolder)}
      />

      {/* Loading state */}
      {loading && (
        <p className='text-gray-400 animate-pulse'>Loading...</p>
      )}

      {/* Empty state */}
      {!loading && folders.length === 0 && files.length === 0 && (
        <div className='text-center py-20'>
          <p className='text-4xl mb-4'>📂</p>
          <p className='text-gray-500'>This folder is empty</p>
          <p className='text-gray-400 text-sm mt-1'>
            Create a folder or upload a file to get started
          </p>
        </div>
      )}

      {/* Folders grid */}
      {folders.length > 0 && (
        <div className='mb-6'>
          <h2 className='text-sm font-medium text-gray-500 uppercase tracking-wide mb-3'>
            Folders
          </h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className='group relative bg-white border border-gray-200 rounded-xl p-4
                           hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer'
                onDoubleClick={() => setCurrentFolder(folder.id)}
              >
                <div className='text-3xl mb-2'>🗂️</div>
                <p className='text-sm font-medium text-gray-700 truncate'>
                  {folder.name}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                  className='absolute top-2 right-2 opacity-0 group-hover:opacity-100
                             text-gray-400 hover:text-red-500 transition-all text-xs p-1'
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div>
          <h2 className='text-sm font-medium text-gray-500 uppercase tracking-wide mb-3'>
            Files
          </h2>
          <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
            {files.map((file, i) => (
              <FileRow
                key={file.id}
                file={file}
                isFirst={i === 0}
                onDelete={() => fetchContents(currentFolder)}
                onRename={() => fetchContents(currentFolder)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── FileRow component ─────────────────────────────────────────────────────────
function FileRow({ file, isFirst, onDelete, onRename }) {
  const [renaming,    setRenaming]    = useState(false);
  const [newName,     setNewName]     = useState(file.name);
  const [downloading, setDownloading] = useState(false);
  const [starred,     setStarred]     = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [showLink,    setShowLink]    = useState(false);

  // Load starred status on mount
  useEffect(() => {
    async function checkStarred() {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stars`,
        { credentials: 'include' }
      );
      const data = await res.json();
      const isStarred = (data.files || []).some(f => f.id === file.id);
      setStarred(isStarred);
    }
    checkStarred();
  }, [file.id]);

  function getFileIcon(mimeType) {
    if (!mimeType)                      return '📄';
    if (mimeType.startsWith('image/'))  return '🖼️';
    if (mimeType.startsWith('video/'))  return '🎬';
    if (mimeType.startsWith('audio/'))  return '🎵';
    if (mimeType.includes('pdf'))       return '📕';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('word') || mimeType.includes('document'))     return '📝';
    return '📄';
  }

  function formatSize(bytes) {
    if (!bytes)                return '—';
    if (bytes < 1024)          return `${bytes} B`;
    if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleDownload() {
    setDownloading(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}`,
      { credentials: 'include' }
    );
    const data = await res.json();
    if (data.signedUrl) window.open(data.signedUrl, '_blank');
    setDownloading(false);
  }

  async function handleRename() {
    if (!newName.trim() || newName === file.name) {
      setRenaming(false);
      return;
    }
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}`,
      {
        method:      'PATCH',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ name: newName.trim() }),
      }
    );
    setRenaming(false);
    onRename();
  }

  async function handleDelete() {
    if (!confirm('Move this file to trash?')) return;
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}`,
      { method: 'DELETE', credentials: 'include' }
    );
    onDelete();
  }

  async function handleStar() {
    if (starred) {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stars`,
        {
          method:      'DELETE',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ resourceType: 'file', resourceId: file.id }),
        }
      );
      setStarred(false);
    } else {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/stars`,
        {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          credentials: 'include',
          body:        JSON.stringify({ resourceType: 'file', resourceId: file.id }),
        }
      );
      setStarred(true);
    }
  }

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3 hover:bg-gray-50
                  ${!isFirst ? 'border-t border-gray-100' : ''}`}
    >
      <span className='text-2xl'>{getFileIcon(file.mime_type)}</span>

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
                       focus:outline-none focus:ring-1 focus:ring-blue-500 w-full'
          />
        ) : (
          <p className='text-sm font-medium text-gray-700 truncate'>{file.name}</p>
        )}
        <p className='text-xs text-gray-400'>{formatSize(file.size_bytes)}</p>
      </div>

      {/* Action buttons — show on hover */}
      <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100
                      transition-opacity'>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className='text-xs text-blue-600 hover: px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50'
        >
          Download
        </button>
        <button
          onClick={() => setRenaming(true)}
          className='text-xs text-gray-500 hover:text-gray-700 px-2 py-1
                     rounded hover:bg-gray-100'
        >
          ✏️ Rename
        </button>
        <button
          onClick={() => setShowShare(true)}
          className='text-xs text-green-600 hover: px-2 py-1 rounded hover:bg-green-100'
        >
          👥 Share
        </button>
        <button
          onClick={() => setShowLink(true)}
          className='text-xs text-purple-600 hover: px-2 py-1 rounded hover:bg-purple-100'
        >
          🔗 Link
        </button>

        {/* ── Star button — SVG icon ────────────────────────────── */}
        <button
          onClick={handleStar}
          title={starred ? 'Remove from starred' : 'Add to starred'}
          className='p-1.5 rounded-lg hover:bg-gray-100 transition-colors'
        >
          {starred ? (
            // Filled yellow star
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='w-4 h-4 text-yellow-400 transition-colors'
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
            // Empty grey star
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              className='w-4 h-4 text-gray-300 hover:text-yellow-400
                         transition-colors'
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

        <button
          onClick={handleDelete}
          className='text-xs text-red-400 hover:text-red-600 px-2 py-1
                     rounded hover:bg-red-50'
        >
          🗑️
        </button>
      </div>

      {/* Share modal */}
      {showShare && (
        <ShareModal
          file={file}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Link modal */}
      {showLink && (
        <LinkModal
          file={file}
          onClose={() => setShowLink(false)}
        />
      )}
    </div>
  );
}
