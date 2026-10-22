'use client';

import { useState } from 'react';

export default function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const count = images.length;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  function go(e: React.MouseEvent, dir: number) {
    e.stopPropagation();
    setIdx((i) => (i + dir + count) % count);
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3">
      {/* Miniatures : colonne à gauche sur ordinateur, ligne sous l'image sur mobile */}
      {count > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[560px] pb-1 lg:pb-0 lg:pr-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onMouseEnter={() => setIdx(i)}
              onClick={() => setIdx(i)}
              aria-label={`Voir l'image ${i + 1}`}
              className={`shrink-0 w-16 h-16 lg:w-[72px] lg:h-[72px] rounded-lg overflow-hidden border-2 bg-white transition ${
                i === idx ? 'border-gray-900' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Image principale + zoom au survol (n'importe où sur l'image) */}
      <div
        className="group relative flex-1 aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-gray-100 cursor-zoom-in"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
      >
        {images.map((src, i) => (
          <img
            key={src + i}
            src={src}
            alt={alt}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-contain select-none ${
              i === idx ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              transform: zoom && i === idx ? 'scale(2.4)' : 'scale(1)',
              transformOrigin: origin,
              transition: zoom ? 'transform 0.15s ease-out' : 'transform 0.3s ease',
            }}
          />
        ))}

        {/* Indication */}
        <span
          className={`pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 text-white text-xs px-3 py-1 transition-opacity ${
            zoom ? 'opacity-0' : 'opacity-100'
          }`}
        >
          Survolez pour zoomer
        </span>

        {/* Flèches */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => go(e, -1)}
              aria-label="Image précédente"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={(e) => go(e, 1)}
              aria-label="Image suivante"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}