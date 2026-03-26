'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function SharePage() {
  const { token }   = useParams();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [password,  setPassword]  = useState('');
  const [needsPass, setNeedsPass] = useState(false);

  useEffect(() => {
    if (token) resolve('');
  }, [token]);

  async function resolve(pwd) {
    setLoading(true);
    setError('');

    const url = pwd
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/link-shares/resolve/${token}?password=${encodeURIComponent(pwd)}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/link-shares/resolve/${token}`;

    const res  = await fetch(url);
    const json = await res.json();

    if (!res.ok) {
      if (json.error?.code === 'PASSWORD_REQUIRED') {
        setNeedsPass(true);
      } else {
        setError(json.error?.message || 'Link not found or expired');
      }
    } else {
      setData(json);
      setNeedsPass(false);
    }
    setLoading(false);
  }

  function formatSize(bytes) {
    if (!bytes) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <p className='text-gray-400 animate-pulse'>Loading...</p>
      </div>
    );
  }

  // ── Password required ───────────────────────────────────────────────
  if (needsPass) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='bg-white rounded-xl shadow-md p-8 w-full max-w-sm'>
          <div className='text-center mb-6'>
            <p className='text-4xl mb-3'>🔒</p>
            <h1 className='text-xl font-bold text-gray-800'>
              Password required
            </h1>
            <p className='text-gray-500 text-sm mt-1'>
              This link is password protected
            </p>
          </div>
          {error && (
            <div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
              ❌ {error}
            </div>
          )}
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && resolve(password)}
            placeholder='Enter password'
            autoFocus
            className='w-full border border-gray-300 rounded-lg px-3 py-2
                       text-sm focus:outline-none focus:ring-2
                       focus:ring-blue-500 mb-3'
          />
          <button
            onClick={() => resolve(password)}
            className='w-full bg-blue-600 text-white py-2 rounded-lg
                       text-sm font-medium hover:bg-blue-700'
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
        <div className='text-center'>
          <p className='text-4xl mb-4'>🔗</p>
          <h1 className='text-xl font-bold text-gray-800 mb-2'>
            Link unavailable
          </h1>
          <p className='text-gray-500 text-sm'>{error}</p>
        </div>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='bg-white rounded-xl shadow-md p-8 w-full max-w-sm text-center'>

        <p className='text-5xl mb-4'>☁️</p>

        <h1 className='text-xl font-bold text-gray-800 mb-1'>
          {data?.file?.name || data?.folder?.name}
        </h1>

        <p className='text-gray-500 text-sm mb-2'>
          Shared with you via Cloud Drive
        </p>

        {/* File size */}
        {data?.file?.size_bytes && (
          <p className='text-xs text-gray-400 mb-4'>
            {formatSize(data.file.size_bytes)}
          </p>
        )}

        {/* Expiry date — shown below file info */}
        {data?.expiresAt && (
          <div className='bg-orange-50 border border-orange-200 rounded-lg
                          px-4 py-2.5 mb-3 text-left'>
            <p className='text-xs text-orange-700'>
              ⏰ This link expires on{' '}
              <span className='font-semibold'>
                {formatDate(data.expiresAt)}
              </span>
            </p>
          </div>
        )}

        {/* Password protected badge */}
        {data?.hasPassword && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg
                          px-4 py-2.5 mb-3 text-left'>
            <p className='text-xs text-blue-700'>
              🔒 This link is password protected
            </p>
          </div>
        )}

        {/* Download button */}
        {data?.signedUrl && (
          <button
            onClick={() => window.open(data.signedUrl, '_blank')}
            className='w-full bg-blue-600 text-white px-6 py-2.5 mt-2
                       rounded-lg font-medium hover:bg-blue-700 text-sm
                       transition-colors'
          >
            ⬇ Download file
          </button>
        )}

        {/* Folder message */}
        {data?.folder && !data?.signedUrl && (
          <p className='text-gray-500 text-sm mt-2'>
            This is a shared folder.
          </p>
        )}

      </div>
    </div>
  );
}