'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleEmailLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
        {
          method:      'POST',
          headers:     { 'Content-Type': 'application/json' },
          body:        JSON.stringify({ email, password }),
          credentials: 'include',
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Incorrect email or password');
        setLoading(false);
        return;
      }

      window.location.href = '/drive';

    } catch (err) {
      setError('Could not connect to server. Is the backend running?');
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <div className='bg-white rounded-2xl shadow-md p-8 w-full max-w-md'>

        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>☁️ Cloud Drive</h1>
          <p className='text-gray-500 mt-2'>Welcome back</p>
        </div>

        {error && (
          <div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Email Address
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              required
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Password
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Your password'
              required
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                       hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm cursor-pointer'
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className='text-center text-sm text-gray-500 mt-6'>
          No account?{' '}
          <Link href='/register' className='text-blue-600 hover:underline font-medium'>
            Create one free
          </Link>
        </p>

      </div>
    </div>
  );
}

