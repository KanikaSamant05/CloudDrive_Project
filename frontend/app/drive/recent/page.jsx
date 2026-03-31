'use client';

import { useState, useEffect, useRef } from 'react';

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
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function timeAgo(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Recent</h1>

      {loading && <p className="text-gray-400 animate-pulse">Loading...</p>}

      {!loading && files.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🕐</p>
          <p className="text-gray-500">No recent files</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl">
          {files.map((file, i) => (
            <RecentFileRow
              key={file.id}
              file={file}
              isFirst={i === 0}
              isLast={i === files.length - 1}
              formatSize={formatSize}
              timeAgo={timeAgo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── RecentFileRow ─────────────────────────────────────────────────────────────
function RecentFileRow({ file, isFirst, isLast, formatSize, timeAgo }) {
  const [showMenu,    setShowMenu]    = useState(false);
  const [menuPos,     setMenuPos]     = useState({ top: 0, left: 0 });
  const [downloading, setDownloading] = useState(false);
  const btnRef = useRef(null);

  // Close menu on scroll
  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [showMenu]);

  // ── File type color + label (same as Drive) ──────────────────────────
  function getFileColor(mimeType) {
    if (!mimeType)
      return { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'FILE' };
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

  // ── Open file directly ───────────────────────────────────────────────
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

  // ── Open containing folder (navigate to it) ──────────────────────────
  function handleOpenInFolder() {
    if (file.folder_id && file.folder_id !== 'root') {
      // Navigate to the folder page
      window.location.href = `/drive?folder=${file.folder_id}`;
    } else {
      // File is in root — navigate to My Drive root
      window.location.href = '/drive';
    }
    setShowMenu(false);
  }

  // ── Position dropdown so it never goes off-screen ───────────────────
  function handleMenuToggle(e) {
    e.stopPropagation();
    if (showMenu) { setShowMenu(false); return; }

    if (btnRef.current) {
      const rect       = btnRef.current.getBoundingClientRect();
      const menuHeight = 100; // two items
      const menuWidth  = 176; // w-44
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight;

      setMenuPos({
        top:  openUpward
                ? rect.top  + window.scrollY - menuHeight - 4
                : rect.bottom + window.scrollY + 4,
        left: Math.min(
          rect.right + window.scrollX - menuWidth,
          window.innerWidth - menuWidth - 8
        ),
      });
    }
    setShowMenu(true);
  }

  const fileColor = getFileColor(file.mime_type);

  return (
    <div
      className={`group flex items-center gap-4 px-4 py-3 hover:bg-gray-50
                  transition-colors cursor-pointer
                  ${!isFirst ? 'border-t border-gray-100' : ''}
                  ${isLast   ? 'rounded-b-xl'             : ''}
                  ${isFirst  ? 'rounded-t-xl'             : ''}`}
      onClick={handleOpen}
    >

      {/* ── Colored document icon (same style as Drive) ─────────────── */}
      <div
        className={`w-10 h-12 rounded-lg ${fileColor.bg} flex flex-col
                    items-center justify-center shrink-0 relative
                    hover:opacity-80 transition-opacity`}
      >
        {/* Folded corner */}
        <div className="absolute top-0 right-0 w-3 h-3 bg-white
                        rounded-bl-md opacity-60" />
        <span className={`text-xs font-bold ${fileColor.text} mt-1`}>
          {fileColor.label}
        </span>
        {/* Document lines */}
        <div className="flex flex-col gap-0.5 mt-1">
          <div className={`w-5 h-0.5 rounded opacity-40 ${fileColor.text} bg-current`} />
          <div className={`w-4 h-0.5 rounded opacity-40 ${fileColor.text} bg-current`} />
          <div className={`w-5 h-0.5 rounded opacity-40 ${fileColor.text} bg-current`} />
        </div>
      </div>

      {/* ── File name + meta ─────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-blue-600 transition-colors">
          {file.name}
        </p>
        <p className="text-xs text-gray-400">
          {formatSize(file.size_bytes)} • {timeAgo(file.xupdated_at)}
        </p>
      </div>

      {/* ── Three-dot button ─────────────────────────────────────────── */}
      <button
        ref={btnRef}
        onClick={handleMenuToggle}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg
                   hover:bg-gray-100 transition-all cursor-pointer shrink-0"
        title="More options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="currentColor" className="w-4 h-4 text-gray-500">
          <path fillRule="evenodd"
            d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5
               1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3
               0 1.5 1.5 0 0 1-3 0Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* ── Dropdown menu ────────────────────────────────────────────── */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
          />

          <div
            className="fixed z-50 bg-white border border-gray-200
                       rounded-xl shadow-lg w-44 py-1"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {/* Open */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                handleOpen();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                         text-gray-700 hover:bg-gray-50 transition-colors
                         text-left rounded-t-xl cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5"
                className="w-4 h-4 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51
                     7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07
                     .207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5
                     c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Open
            </button>

            {/* Open in Folder */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenInFolder();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                         text-gray-700 hover:bg-gray-50 transition-colors
                         text-left rounded-b-xl cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5"
                className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25
                     2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5
                     1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25A2.25
                     2.25 0 0 0 4.5 16.5h15a2.25 2.25 0 0 0 2.25-2.25V8.25
                     A2.25 2.25 0 0 0 19.5 6h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              Open in Folder
            </button>
          </div>
        </>
      )}
    </div>
  );
}