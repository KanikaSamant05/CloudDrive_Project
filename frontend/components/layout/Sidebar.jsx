'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  const [showMenu,      setShowMenu]      = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName,    setFolderName]    = useState('');
  const [creating,      setCreating]      = useState(false);
  const [error,         setError]         = useState('');
  const fileInputRef = useRef(null);

  const navItems = [
    { href: '/drive',          label: 'Home',     icon: null },
    { href: '/drive/search',   label: 'Search',   icon: '🔍' },
    { href: '/drive/shared',   label: 'Shared',   icon: '👥' },
    { href: '/drive/starred',  label: 'Starred',  icon: '⭐' },
    { href: '/drive/recent',   label: 'Recent',   icon: '🕐' },
    { href: '/drive/activity', label: 'Activity', icon: '📋' },
    { href: '/drive/link',     label: 'Links',    icon: '🔗' },
    { href: '/drive/trash',    label: 'Trash',    icon: '🗑️' },
  ];

  async function handleSignOut() {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
      { method: 'POST', credentials: 'include' }
    );
    window.location.href = '/login';
  }

  async function handleCreateFolder() {
    if (!folderName.trim()) return;
    setCreating(true);
    setError('');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/folders`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          name:     folderName.trim(),
          parentId: null,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || 'Failed to create folder');
      setCreating(false);
      return;
    }

    setFolderName('');
    setShowNewFolder(false);
    setCreating(false);
    router.push('/drive');
    router.refresh();
  }

  return (
    <>
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        className='hidden'
        onChange={() => {
          router.push('/drive');
        }}
      />

      <aside className='w-64 h-screen bg-white border-r border-gray-200
                        flex flex-col fixed left-0 top-0'>

        {/* Logo — non-clickable */}
        <div className='p-4 border-b border-gray-100'>
          <div className='flex items-center gap-2'>
            <span className='text-2xl'>☁️</span>
            <span className='font-bold text-gray-800'>Cloud Drive</span>
          </div>
        </div>

        {/* + New button */}
        <div className='px-4 py-3 relative'>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className='w-full flex items-center gap-2 bg-blue-600 text-white
                       px-4 py-2.5 rounded-xl font-medium text-sm
                       hover:bg-blue-700 transition-colors shadow-sm cursor-pointer'
          >
            <span className='text-lg font-bold'>+</span>
            <span>New</span>
            <span className='ml-auto text-blue-300 text-xs'>
              {showMenu ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className='absolute left-4 right-4 top-14 bg-white
                            border border-gray-200 rounded-xl shadow-lg
                            overflow-hidden z-50'>

              {/* Upload file */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  router.push('/drive');
                }}
                className='w-full flex items-center gap-3 px-4 py-3 text-sm
                           text-gray-700 hover:bg-gray-50 transition-colors
                           text-left cursor-pointer'
              >
                <span className='text-lg'>📄</span>
                <div>
                  <p className='font-medium'>Upload file</p>
                  <p className='text-xs text-gray-400'>
                    Go to My Drive to upload
                  </p>
                </div>
              </button>

              <div className='border-t border-gray-100' />

              {/* New folder */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowNewFolder(true);
                  setError('');
                }}
                className='w-full flex items-center gap-3 px-4 py-3 text-sm
                           text-gray-700 hover:bg-gray-50 transition-colors
                           text-left cursor-pointer'
              >
                <span className='text-lg'>📁</span>
                <div>
                  <p className='font-medium'>New folder</p>
                  <p className='text-xs text-gray-400'>
                    Create in My Drive root
                  </p>
                </div>
              </button>

            </div>
          )}
        </div>

        {/* Close menu when clicking outside */}
        {showMenu && (
          <div
            className='fixed inset-0 z-40'
            onClick={() => setShowMenu(false)}
          />
        )}

        {/* Nav links */}
        <nav className='flex-1 px-3 py-2 overflow-y-auto'>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                            text-sm font-medium transition-colors mb-0.5
                            cursor-pointer
                            ${isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
              >
                {item.icon && (
                  <span className='text-base'>{item.icon}</span>
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile + Sign out */}
        <div className='p-3 border-t border-gray-100 space-y-1'>
          <Link
            href='/drive/profile'
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                        text-sm font-medium transition-colors cursor-pointer
                        ${pathname === '/drive/profile'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                        }`}
          >
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                       text-sm font-medium text-gray-600 hover:bg-red-50
                       hover:text-red-600 transition-colors cursor-pointer'
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className='fixed inset-0 bg-black/40 flex items-center
                        justify-center z-50'>
          <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4'>
            <h2 className='text-lg font-semibold text-gray-800 mb-4'>
              New Folder
            </h2>

            {error && (
              <p className='text-red-500 text-sm mb-3'>❌ {error}</p>
            )}

            <input
              type='text'
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder='Folder name'
              autoFocus
              className='w-full border border-gray-300 rounded-lg px-3 py-2
                         focus:outline-none focus:ring-2 focus:ring-blue-500
                         text-sm mb-4 cursor-text'
            />

            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => {
                  setShowNewFolder(false);
                  setFolderName('');
                  setError('');
                }}
                className='px-4 py-2 text-sm text-gray-600
                           hover:bg-gray-100 rounded-lg cursor-pointer'
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={creating}
                className='px-4 py-2 text-sm bg-blue-600 text-white
                           rounded-lg hover:bg-blue-700 disabled:opacity-50
                           disabled:cursor-not-allowed cursor-pointer'
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}