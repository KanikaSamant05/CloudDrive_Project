'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import UploadZone from '@/components/drive/uploadZone';
import ShareModal from '@/components/drive/ShareModal';
import LinkModal  from '@/components/drive/LinkModal';
import { useSearchParams } from 'next/navigation';

function DrivePage() {
  const searchParams = useSearchParams();
  const [folders,       setFolders]       = useState([]);
  const [files,         setFiles]         = useState([]);
  const [path,          setPath]          = useState([]);
  const [currentFolder, setCurrentFolder] = useState(
    searchParams.get('folder') || 'root'
  );
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
        headers:     { 'Content-Type': 'application/json' },
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
        <div className='fixed inset-0 bg-black/40 flex items-center
                        justify-center z-50'>
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
                className='px-4 py-2 text-sm text-gray-600
                           hover:bg-gray-100 rounded-lg'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creating}
                className='px-4 py-2 text-sm bg-blue-600 text-white
                           rounded-lg hover:bg-blue-700 disabled:opacity-50'
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
          <h2 className='text-sm font-medium text-gray-500 uppercase
                         tracking-wide mb-3'>
            Folders
          </h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4
                          lg:grid-cols-5 gap-3'>
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onOpen={() => setCurrentFolder(folder.id)}
                onDelete={() => handleDeleteFolder(folder.id)}
                onRename={() => fetchContents(currentFolder)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div>
          <h2 className='text-sm font-medium text-gray-500 uppercase
                         tracking-wide mb-3'>
            Files
          </h2>
          <div className='bg-white border border-gray-200 rounded-xl'>
            {files.map((file, i) => (
              <FileRow
                key={file.id}
                file={file}
                isFirst={i === 0}
                isLast={i === files.length - 1}
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

// ── Suspense wrapper ──────────────────────────────────────────────────────────
export default function DrivePageWrapper() {
  return (
    <Suspense fallback={<p className='text-gray-400 animate-pulse'>Loading...</p>}>
      <DrivePage />
    </Suspense>
  );
}

// ── FolderCard component ──────────────────────────────────────────────────────
function FolderCard({ folder, onOpen, onDelete, onRename }) {
  const [renaming, setRenaming] = useState(false);
  const [newName,  setNewName]  = useState(folder.name);

  async function handleRename() {
    if (!newName.trim() || newName === folder.name) {
      setRenaming(false);
      return;
    }
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folder.id}`,
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

  return (
    <div
      className='group relative bg-white border border-gray-200
                 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm
                 transition-all cursor-pointer'
      onDoubleClick={() => !renaming && onOpen()}
    >
      {/* Folder icon */}
      <div className='mb-2'>
        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
          fill='currentColor' className='w-8 h-8 text-blue-400'>
          <path d='M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3
                   3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3
                   3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122
                   2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146
                   A4.483 4.483 0 0 0 19.5 12h-15a4.483 4.483 0 0
                   0-4.5 1.146Z' />
        </svg>
      </div>

      {/* Folder name / rename input */}
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
          onClick={(e) => e.stopPropagation()}
          className='text-sm border border-blue-400 rounded px-2 py-0.5
                     focus:outline-none focus:ring-1 focus:ring-blue-500 w-full'
        />
      ) : (
        <p className='text-sm font-medium text-gray-700 truncate'>
          {folder.name}
        </p>
      )}

      {/* Action buttons */}
      <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100
                      flex items-center gap-0.5 transition-all'>
        {/* Rename button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNewName(folder.name);
            setRenaming(true);
          }}
          className='text-gray-400 hover:text-blue-500 transition-colors p-1 rounded cursor-pointer'
          title='Rename'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
            fill='none' stroke='currentColor' strokeWidth='1.5'
            className='w-5 h-5'>
            <path strokeLinecap='round' strokeLinejoin='round'
              d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582
                 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1
                 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125' />
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className='text-gray-400 hover:text-red-500 transition-colors p-1 rounded cursor-pointer'
          title='Delete'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
            fill='none' stroke='currentColor' strokeWidth='1.5'
            className='w-4 h-4'>
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
        </button>
      </div>
    </div>
  );
}

// ── FileRow component ─────────────────────────────────────────────────────────
function FileRow({ file, isFirst, isLast, onDelete, onRename }) {
  const [renaming,    setRenaming]    = useState(false);
  const [newName,     setNewName]     = useState(file.name);
  const [downloading, setDownloading] = useState(false);
  const [starred,     setStarred]     = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [showLink,    setShowLink]    = useState(false);
  const [showMenu,    setShowMenu]    = useState(false);
  const [menuPos,     setMenuPos]     = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);

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

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [showMenu]);

  function getFileColor(mimeType) {
    if (!mimeType)
      return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'FILE' };
    if (mimeType.includes('pdf'))
      return { bg: 'bg-red-100',    text: 'text-red-600',    label: 'PDF'  };
    if (mimeType.startsWith('image/'))
      return { bg: 'bg-purple-100', text: 'text-purple-600', label: 'IMG'  };
    if (mimeType.startsWith('video/'))
      return { bg: 'bg-pink-100',   text: 'text-pink-600',   label: 'VID'  };
    if (mimeType.startsWith('audio/'))
      return { bg: 'bg-yellow-100', text: 'text-yellow-600', label: 'AUD'  };
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
      return { bg: 'bg-green-100',  text: 'text-green-600',  label: 'XLS'  };
    if (mimeType.includes('word') || mimeType.includes('document'))
      return { bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'DOC'  };
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
      return { bg: 'bg-orange-100', text: 'text-orange-600', label: 'PPT'  };
    return { bg: 'bg-gray-100', text: 'text-gray-500', label: 'FILE' };
  }

  function formatSize(bytes) {
    if (!bytes)                return '—';
    if (bytes < 1024)          return `${bytes} B`;
    if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  async function handleOpen() {
    setDownloading(true);
    const res  = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}`,
      { credentials: 'include' }
    );
    const data = await res.json();
    if (data.signedUrl) window.open(data.signedUrl, '_blank');
    setDownloading(false);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res  = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files/${file.id}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      if (data.signedUrl) {
        const blobRes = await fetch(data.signedUrl);
        const blob    = await blobRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a       = document.createElement('a');
        a.href        = blobUrl;
        a.download    = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stars`, {
        method:      'DELETE',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ resourceType: 'file', resourceId: file.id }),
      });
      setStarred(false);
    } else {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stars`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ resourceType: 'file', resourceId: file.id }),
      });
      setStarred(true);
    }
  }

  function handleMenuToggle() {
    if (showMenu) { setShowMenu(false); return; }
    if (btnRef.current) {
      const rect       = btnRef.current.getBoundingClientRect();
      const menuHeight = 220;
      const menuWidth  = 176;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight;
      setMenuPos({
        top:  openUpward
                ? rect.top  + window.scrollY - menuHeight
                : rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - menuWidth,
      });
    }
    setShowMenu(true);
  }

  const fileColor = getFileColor(file.mime_type);

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3 hover:bg-gray-50
                  ${!isFirst ? 'border-t border-gray-100' : ''}
                  ${isLast   ? 'rounded-b-xl'             : ''}`}
    >
      <div
        onClick={handleOpen}
        className={`w-10 h-12 rounded-lg ${fileColor.bg} flex flex-col
                    items-center justify-center shrink-0 relative
                    cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <div className='absolute top-0 right-0 w-3 h-3 bg-white
                        rounded-bl-md opacity-60' />
        <span className={`text-xs font-bold ${fileColor.text} mt-1`}>
          {fileColor.label}
        </span>
        <div className='flex flex-col gap-0.5 mt-1'>
          <div className={`w-5 h-0.5 rounded opacity-40 ${fileColor.text} bg-current`} />
          <div className={`w-4 h-0.5 rounded opacity-40 ${fileColor.text} bg-current`} />
          <div className={`w-5 h-0.5 rounded opacity-40 ${fileColor.text} bg-current`} />
        </div>
      </div>

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
          <button
            onClick={handleOpen}
            disabled={downloading}
            className='text-sm font-medium text-gray-700 hover:text-blue-600
                       hover:underline truncate text-left w-full
                       transition-colors disabled:opacity-50 block'
          >
            {file.name}
          </button>
        )}
        <p className='text-xs text-gray-400'>{formatSize(file.size_bytes)}</p>
      </div>

      <button
        onClick={handleStar}
        title={starred ? 'Remove from starred' : 'Add to starred'}
        className='p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0 cursor-pointer'
      >
        {starred ? (
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
            fill='currentColor' className='w-4 h-4 text-yellow-400'>
            <path fillRule='evenodd'
              d='M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082
                 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117
                 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12
                 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257
                 -5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404
                 -.434 2.082-5.005Z' clipRule='evenodd' />
          </svg>
        ) : (
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
            fill='none' stroke='currentColor' strokeWidth='1.5'
            className='w-4 h-4 text-gray-300 hover:text-yellow-400 cursor-pointer'>
            <path strokeLinecap='round' strokeLinejoin='round'
              d='M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563
                 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204
                 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0
                 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54
                 a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182
                 -.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442
                 a.563.563 0 0 0 .475-.345L11.48 3.5Z' />
          </svg>
        )}
      </button>

      <div className='relative'>
        <button
          ref={btnRef}
          onClick={handleMenuToggle}
          className='opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                     hover:bg-gray-100 transition-all cursor-pointer'
          title='More options'
        >
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
            fill='currentColor' className='w-4 h-4 text-gray-500'>
            <path fillRule='evenodd'
              d='M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5
                 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3
                 0 1.5 1.5 0 0 1-3 0Z' clipRule='evenodd' />
          </svg>
        </button>

        {showMenu && (
          <>
            <div className='fixed inset-0 z-40' onClick={() => setShowMenu(false)} />
            <div
              className='fixed z-50 bg-white border border-gray-200
                         rounded-xl shadow-lg w-44'
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button
                onClick={() => { setShowMenu(false); handleDownload(); }}
                className='w-full flex items-center gap-3 px-4 py-2.5 text-sm
                           text-gray-700 hover:bg-gray-50 transition-colors
                           text-left rounded-t-xl cursor-pointer'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                  fill='none' stroke='currentColor' strokeWidth='1.5'
                  className='w-4 h-4 text-blue-500'>
                  <path strokeLinecap='round' strokeLinejoin='round'
                    d='M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0
                       21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3' />
                </svg>
                Download
              </button>
              <button
                onClick={() => { setShowMenu(false); setRenaming(true); }}
                className='w-full flex items-center gap-3 px-4 py-2.5 text-sm
                           text-gray-700 hover:bg-gray-50 transition-colors
                           text-left cursor-pointer'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                  fill='none' stroke='currentColor' strokeWidth='1.5'
                  className='w-4 h-4 text-gray-500'>
                  <path strokeLinecap='round' strokeLinejoin='round'
                    d='m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582
                       16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1
                       1.13-1.897l8.932-8.931Zm0 0L19.5 7.125' />
                </svg>
                Rename
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowShare(true); }}
                className='w-full flex items-center gap-3 px-4 py-2.5 text-sm
                           text-gray-700 hover:bg-gray-50 transition-colors
                           text-left cursor-pointer'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                  fill='none' stroke='currentColor' strokeWidth='1.5'
                  className='w-4 h-4 text-green-500'>
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
                Share
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowLink(true); }}
                className='w-full flex items-center gap-3 px-4 py-2.5 text-sm
                           text-gray-700 hover:bg-gray-50 transition-colors
                           text-left cursor-pointer'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                  fill='none' stroke='currentColor' strokeWidth='1.5'
                  className='w-4 h-4 text-purple-500'>
                  <path strokeLinecap='round' strokeLinejoin='round'
                    d='M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0
                       1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0
                       0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244' />
                </svg>
                Link
              </button>
              <div className='border-t border-gray-100' />
              <button
                onClick={() => { setShowMenu(false); handleDelete(); }}
                className='w-full flex items-center gap-3 px-4 py-2.5 text-sm
                           text-red-500 hover:bg-red-50 transition-colors
                           text-left rounded-b-xl cursor-pointer'
              >
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'
                  fill='none' stroke='currentColor' strokeWidth='1.5'
                  className='w-4 h-4'>
                  <path strokeLinecap='round' strokeLinejoin='round'
                    d='m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107
                       1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244
                       2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456
                       0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114
                       1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0
                       -1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18
                       .037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0' />
                </svg>
                Move to trash
              </button>
            </div>
          </>
        )}
      </div>

      {showShare && <ShareModal file={file} onClose={() => setShowShare(false)} />}
      {showLink  && <LinkModal  file={file} onClose={() => setShowLink(false)}  />}
    </div>
  );
}