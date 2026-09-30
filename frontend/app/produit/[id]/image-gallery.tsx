'use client';
import { useState } from 'react';

export default function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <div>
      <img
        src={images[current]}
        alt={alt}
        className="w-full max-w-md h-96 object-cover rounded-lg border"
      />

      {images.length > 1 && (
        <div className="flex gap-2 mt-4">
          {images.map((url, i) => (
            <button
              key={url}
              onClick={() => setCurrent(i)}
              className={`border rounded overflow-hidden ${
                i === current ? 'ring-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img src={url} alt="" className="w-20 h-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}