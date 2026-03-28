'use client';

import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function DriveLayout({ children }) {

  useEffect(() => {
    // Check if user is logged in via API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include',
    })
      .then(res => {
        if (res.status === 401) {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <Sidebar />
      <main className='ml-64 flex-1 p-8 overflow-y-auto'>
        {children}
      </main>
    </div>
  );
}

