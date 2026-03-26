'use client';

import { useState, useRef } from 'react';

export default function UploadZone({ currentFolderId, onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads,    setUploads]    = useState([]); // list of active uploads
  const fileInputRef = useRef(null);

  // Upload a single file
  async function uploadFile(file) {
    const uploadId = Date.now() + Math.random();

    // Add to uploads list with 0% progress
    setUploads(prev => [...prev, {
      id:       uploadId,
      name:     file.name,
      progress: 0,
      status:   'uploading',
    }]);

    try {
      // Step 1: Ask API for a signed upload URL
      const initRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files/init`,
        {
          method:'POST',
          headers:{ 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: file.name,
            mimeType:  file.type || 'application/octet-stream',
            sizeBytes: file.size,
            folderId: currentFolderId === 'root' ? null : currentFolderId,
          }),
        }
      );

      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData.error?.message || 'Failed to init upload');
      }

      // Step 2: Upload file directly to Supabase Storage
      // We use XMLHttpRequest so we can track progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Update progress bar as file uploads
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100);
            setUploads(prev => prev.map(u =>
              u.id === uploadId ? { ...u, progress: pct } : u
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));

        xhr.open('PUT', initData.uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // Step 3: Tell API the upload is complete
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/files/complete`,
        {
          method:'POST',
          headers:{ 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ fileId: initData.fileId }),
        }
      );

      // Mark as done
      setUploads(prev => prev.map(u =>
        u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u
      ));

      // Remove from list after 2 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
        onUploadComplete(); // refresh file list
      }, 2000);

    } catch (err) {
      setUploads(prev => prev.map(u =>
        u.id === uploadId ? { ...u, status: 'error', error: err.message } : u
      ));
    }
  }

  function handleFiles(fileList) {
    Array.from(fileList).forEach(uploadFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  return (
<div className='mb-6'>
      {/* Drop zone */}
<div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                    transition-colors ${ isDragging
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
>
<p className='text-3xl mb-2'>☁️</p>
<p className='text-sm font-medium text-gray-600'>
          Drag and drop files here
</p>
<p className='text-xs text-gray-400 mt-1'>or click to browse</p>
<input
          ref={fileInputRef}
          type='file'
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className='hidden'
        />
</div>

      {/* Upload progress list */}
      {uploads.length > 0 && (
<div className='mt-3 space-y-2'>
          {uploads.map((upload) => (
<div key={upload.id}
              className='bg-white border border-gray-200 rounded-lg px-4 py-3'
>
<div className='flex items-center justify-between mb-1'>
<span className='text-sm text-gray-700 truncate'>{upload.name}</span>
<span className='text-xs text-gray-400 ml-2'>
                  {upload.status === 'done'  ? '✅' : ''}
                  {upload.status === 'error' ? '❌' : ''}
                  {upload.status === 'uploading' ? `${upload.progress}%` : ''}
</span>
</div>
              {upload.status === 'uploading'&& (
<div className='w-full bg-gray-100 rounded-full h-1.5'>
<div
                    className='bg-blue-600 h-1.5 rounded-full transition-all'
                    style={{ width: `${upload.progress}%` }}
                  />
</div>
              )}
              {upload.status === 'error'&& (
<p className='text-xs text-red-500'>{upload.error}</p>
              )}
</div>
          ))}
</div>
      )}
</div>
  );
}
