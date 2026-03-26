'use client';

import { useState } from 'react';

export default function ShareModal({ file, onClose }) {
  const [email,   setEmail]   = useState('');
  const [role,    setRole]    = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  async function handleShare(e) {
    e.preventDefault();
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
          resourceType: 'file',
          resourceId:   file.id,
          granteeEmail: email,
          role,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || 'Failed to share');
    } else {
      setSuccess(`Shared with ${email} successfully!`);
      setEmail('');
    }
    setLoading(false);
  }

  return (
    <div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'>
      <div className='bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4'>

        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='min-w-0 pr-4'>
            <h2 className='text-lg font-semibold text-gray-800'>
              Share file
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

        {/* Success */}
        {success && (
          <div className='bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            ✅ {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleShare} className='space-y-4'>

          {/* Email */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Share with (email)
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='teammate@example.com'
              required
              autoFocus
              className='w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <p className='text-xs text-gray-400 mt-1'>
              They must have an account in this app
            </p>
          </div>

          {/* Role */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Permission level
            </label>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setRole('viewer')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border
                            transition-colors
                            ${role === 'viewer'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
              >
                👁 Viewer
                <p className={`text-xs font-normal mt-0.5
                               ${role === 'viewer' ? 'text-blue-100' : 'text-gray-400'}`}>
                  Download only
                </p>
              </button>
              <button
                type='button'
                onClick={() => setRole('editor')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border
                            transition-colors
                            ${role === 'editor'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
              >
                ✏️ Editor
                <p className={`text-xs font-normal mt-0.5
                               ${role === 'editor' ? 'text-blue-100' : 'text-gray-400'}`}>
                  Can modify
                </p>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex gap-3 pt-1'>
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
              {loading ? 'Sharing...' : 'Share'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}