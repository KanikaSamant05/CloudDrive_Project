// web/app/drive/layout.jsx

import Sidebar from '@/components/layout/Sidebar';

export default function DriveLayout({ children }) {
  return (
    <div className='flex min-h-screen bg-gray-50'>

      {/* Sidebar — fixed, 256px wide */}
      <Sidebar />

      {/* Main content — must have ml-64 to clear the sidebar */}
      <main className='ml-64 flex-1 p-8 overflow-y-auto'>
        {children}
      </main>

    </div>
  );
}
