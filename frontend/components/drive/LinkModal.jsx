'use client';

import { useState } from 'react';

export default function LinkModal({ file, onClose }) {
  const [password,  setPassword]  = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [link,      setLink]      = useState('');
  const [error,     setError]     = useState('');
  const [copied,    setCopied]    = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLink('');
    setCopied(false);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/link-shares`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          resourceType: 'file',
          resourceId:   file.id,
          password:     password  || undefined,
          expiresAt:    expiresAt || undefined,
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

  function formatDate(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('en-GB', {
      day:    '2-digit',
      month:  '2-digit',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4'>

        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='min-w-0 pr-4'>
            <h2 className='text-lg font-semibold text-gray-800'>
              Create public link
            </h2>
            <p className='text-xs text-gray-400 truncate mt-0.5'>
              {file.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-xl shrink-0'
          >
            ✕
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            ❌ {error}
          </div>
        )}

        {/* Link created success */}
        {link && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-4'>
            <p className='text-sm font-medium text-green-700 mb-2'>
              ✅ Link created!
            </p>

            {/* Show expiry if set */}
            {expiresAt && (
              <p className='text-xs text-gray-500 mb-2'>
                ⏰ Expires: {formatDate(expiresAt)}
              </p>
            )}

            {/* Show password badge if set */}
            {password && (
              <p className='text-xs text-gray-500 mb-2'>
                🔒 Password protected
              </p>
            )}

            {/* Link + copy button */}
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
                           rounded hover:bg-green-700 shrink-0'
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Create another link button */}
            <button
              onClick={() => {
                setLink('');
                setPassword('');
                setExpiresAt('');
                setCopied(false);
              }}
              className='w-full mt-3 text-xs text-gray-500 hover:text-gray-700
                         py-1.5 rounded border border-gray-200 hover:bg-gray-50'
            >
              + Create another link
            </button>
          </div>
        )}

        {/* Form — hide after link is created */}
        {!link && (
          <form onSubmit={handleCreate} className='space-y-4'>

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

            {/* Buttons */}
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 py-2 text-sm text-gray-600 hover:bg-gray-100
                           rounded-lg border border-gray-300 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 disabled:opacity-50 transition-colors'
              >
                {loading ? 'Creating...' : '🔗 Create link'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
