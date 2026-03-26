'use client'; // needs useState — must be a Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter(); // for redirecting after success

  // One state variable for each form field
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState(''); // error message to show
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  async function handleSubmit() {
    setError('');    // clear any previous error
    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
      {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ name, email, password }),
        credentials: 'include', // IMPORTANT: sends/receives cookies
      }
    );

    const data = await res.json();

    if (!res.ok) {
      // Show the error message from the API
      setError(data.error?.message || 'Something went wrong');
      setLoading(false);
      return;
    }

    // Success! Show confirmation then redirect
    setSuccess(true);
    setTimeout(() => router.push('/login'), 1500);
  }

  return (
<div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
<div className='bg-white rounded-2xl shadow-md p-8 w-full max-w-md'>

<div className='text-center mb-8'>
<h1 className='text-3xl font-bold text-gray-900'>☁️ Cloud Drive</h1>
<p className='text-gray-500 mt-2'>Create your free account</p>
</div>

        {success && (
<div className='bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm text-center'>
            ✅ Account created! Redirecting to login...
</div>
        )}

        {error && (
<div className='bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm'>
            ❌ {error}
</div>
        )}

<div className='space-y-4'>
<div>
<label className='block text-sm font-medium text-gray-700 mb-1'>
              Full Name
</label>
<input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Your name'
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            />
</div>

<div>
<label className='block text-sm font-medium text-gray-700 mb-1'>
              Email Address
</label>
<input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
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
              placeholder='At least 8 characters'
              className='w-full border border-gray-300 rounded-lg px-4 py-2.5
                         focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            />
</div>

<button
            onClick={handleSubmit}
            disabled={loading || success}
            className='w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium
                       hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm'
>
            {loading ? 'Creating account...' : 'Create account'}
</button>
</div>

<p className='text-center text-sm text-gray-500 mt-6'>
          Already have an account?{''}
<Link href='/login' className='text-blue-600 hover:underline font-medium'>
            Sign in
</Link>
</p>
</div>
</div>
  );
}
