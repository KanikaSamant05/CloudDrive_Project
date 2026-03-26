'use client'; // needs useState and useEffect

import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    // This runs once when the component mounts (appears on screen)
    // It fetches the current user from our Express API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include', // send the httpOnly cookie
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setError('Could not load your profile.');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Network error — is the API running?');
        setLoading(false);
      });
  }, []); // [] means: run once on mount, never again

  if (loading) return <p className='text-gray-400 animate-pulse'>Loading...</p>;
  if (error)   return <p className='text-red-500'>❌ {error}</p>;

  // Generate initials for the avatar fallback
  const initials = user.name
    ? user.name.split('').map((n) => n[0]).join('').toUpperCase().slice(0,2)
    : '?';

  return (
<div className='max-w-lg'>
<h1 className='text-2xl font-bold text-gray-800 mb-6'>Profile</h1>

<div className='bg-white rounded-xl shadow-sm border border-gray-200 p-6'>
<div className='flex items-center gap-4 mb-6'>
          {user.image_url ? (
<img src={user.image_url} alt={user.name}
              className='w-16 h-16 rounded-full object-cover border border-gray-200'
            />
          ) : (
<div className='w-16 h-16 rounded-full bg-blue-100 flex items-center
                            justify-center text-xl font-bold text-blue-600'>
              {initials}
</div>
          )}
<div>
<h2 className='text-xl font-semibold text-gray-800'>{user.name}</h2>
<p className='text-gray-500 text-sm'>{user.email}</p>
</div>
</div>

<div className='divide-y divide-gray-100 text-sm'>
<div className='flex justify-between py-3'>
<span className='text-gray-500'>User ID</span>
<span className='font-mono text-xs bg-gray-50 px-2 py-0.5 rounded'>
              {user.id.slice(0, 18)}...
</span>
</div>
<div className='flex justify-between py-3'>
<span className='text-gray-500'>Email</span>
<span className='text-gray-700'>{user.email}</span>
</div>
<div className='flex justify-between py-3'>
<span className='text-gray-500'>Member since</span>
<span className='text-gray-700'>
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
</span>
</div>
</div>
</div>
</div>
  );
}
