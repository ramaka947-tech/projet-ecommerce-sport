'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DELAY = 6000;

export default function HeroCarousel({ media }: { media: any[] }) {
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);

  // Le timer repart de zéro à chaque changement de slide (flèches et points inclus).
  useEffect(() => {
    if (media.length <= 1 || hovered) return;
    const t = setTimeout(() => setCurrent((c) => (c + 1) % media.length), DELAY);
    return () => clearTimeout(t);
  }, [current, hovered, media.length]);

  if (!media || media.length === 0) return null;

  const item = media[current % media.length];
  const prev = () => setCurrent((c) => (c - 1 + media.length) % media.length);
  const next = () => setCurrent((c) => (c + 1) % media.length);

  const transform =
    item.type === 'video' ? '/upload/f_auto,q_auto/' : '/upload/f_auto,q_auto:best,w_2400,c_limit/';
  const url = item.url.replace('/upload/', transform);

  const arrow =
    'absolute top-1/2 -translate-y-1/2 z-20 grid place-items-center size-11 rounded-full border border-white/40 bg-ink/40 text-white hover:bg-ink/70 transition focus-visible:outline-2 focus-visible:outline-action';

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="region"
      aria-roledescription="carrousel"
      aria-label="Médias à la une"
    >
      {item.type === 'video' ? (
        <video
          key={item.id}
          src={url}
          autoPlay
          muted
          loop
          playsInline
          className="hero-in absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        <img
          key={item.id}
          src={url}
          alt={item.alt || ''}
          className="hero-in absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {media.length > 1 && (
        <>
          <button onClick={prev} className={`${arrow} left-4`} aria-label="Média précédent">
            <ChevronLeft size={22} />
          </button>
          <button onClick={next} className={`${arrow} right-4`} aria-label="Média suivant">
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Média ${i + 1}`}
                aria-current={i === current}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-6 bg-action' : 'w-2 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}