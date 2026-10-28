'use client';

import { useRef, useState } from 'react';

// Images Cloudinary : version légère adaptée à l'écran
const cld = (src: string, w: number) =>
  src.includes('/upload/')
    ? src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`)
    : src;

const cldSrcSet = (src: string) =>
  src.includes('/upload/')
    ? [480, 800, 1200].map((w) => `${cld(src, w)} ${w}w`).join(', ')
    : undefined;

// Mobile : toute la largeur. Ordinateur : 480 px maximum.
const MAIN_SIZES = '(min-width: 1024px) 480px, 100vw';

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
  const scroller = useRef<HTMLDivElement>(null);

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

  // Mobile : le doigt fait défiler le carrousel, on en déduit l'image affichée
  function onScroll() {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx && i >= 0 && i < count) setIdx(i);
  }

  function selectThumb(i: number) {
    setIdx(i);
    const el = scroller.current;
    if (el && el.clientWidth) {
      el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
    }
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-3">
      {/* Miniatures : colonne à gauche sur ordinateur, ligne sous l'image sur mobile */}
      {count > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-140 pb-1 lg:pb-0 lg:pr-1 overscroll-contain">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onMouseEnter={() => setIdx(i)}
              onClick={() => selectThumb(i)}
              aria-label={`Voir l'image ${i + 1}`}
              aria-current={i === idx}
              className={`shrink-0 touch-manipulation size-16 lg:size-18 rounded-lg overflow-hidden border-2 bg-white transition ${
                i === idx ? 'border-gray-900' : 'border-transparent lg:hover:border-gray-300'
              }`}
            >
              <img
                src={cld(src, 144)}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* MOBILE : carrousel qu'on fait glisser au doigt */}
        <div className="relative lg:hidden">
          <div
            ref={scroller}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-gray-100 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => (
              <div key={src + i} className="aspect-square w-full shrink-0 snap-center bg-white">
                <img
                  src={cld(src, 800)}
                  srcSet={cldSrcSet(src)}
                  sizes={MAIN_SIZES}
                  alt={i === 0 ? alt : `${alt} (image ${i + 1})`}
                  draggable={false}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  decoding="async"
                  className="size-full select-none object-contain"
                />
              </div>
            ))}
          </div>
          {count > 1 && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
            >
              {idx + 1}/{count}
            </span>
          )}
        </div>

        {/* ORDINATEUR : image principale + zoom au survol (n'importe où sur l'image) */}
        <div
          className="group relative hidden lg:block w-full aspect-4/5 rounded-2xl overflow-hidden bg-white border border-gray-100 cursor-zoom-in"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
        >
          {images.map((src, i) => (
            <img
              key={src + i}
              src={cld(src, 800)}
              srcSet={cldSrcSet(src)}
              sizes={MAIN_SIZES}
              alt={alt}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition opacity-0 group-hover:opacity-100"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => go(e, 1)}
                aria-label="Image suivante"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/95 shadow flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition opacity-0 group-hover:opacity-100"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}