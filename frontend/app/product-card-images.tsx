'use client';
import { useState } from 'react';

export default function ProductCardImages({ images, alt }: { images: string[]; alt: string }) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return null;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrent((c) => (c - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrent((c) => (c + 1) % images.length);
  };

  return (
    <div className="relative group">
      <img
        src={images[current]}
        alt={alt}
        className="w-full h-40 object-cover rounded mb-3"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === current ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}