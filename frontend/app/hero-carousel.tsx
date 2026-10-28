'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const DELAY = 6000;

export type HeroMedia = {
  id: string | number;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  // Champs optionnels : si renseignés, un texte + bouton s'affichent par-dessus le média.
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  href?: string;
};

// Cloudinary : f_auto/q_auto + largeur adaptée à l'écran (800 px suffit sur mobile).
const cld = (url: string, transform: string) => url.replace('/upload/', `/upload/${transform}/`);
const imgSrc = (url: string, w: number, q = 'q_auto') => cld(url, `f_auto,${q},w_${w},c_limit`);

export default function HeroCarousel({ media }: { media: HeroMedia[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false); // survol ou doigt posé
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = media?.length ?? 0;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = trackRef.current;
      if (!el || !count) return;
      const index = (i + count) % count;
      el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    },
    [count]
  );

  // `current` suit la position réelle du scroll : swipe, flèches, points et autoplay passent tous par là.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setCurrent((c) => (c === i ? c : i));
  };

  // Le timer repart de zéro à chaque changement de slide.
  useEffect(() => {
    if (count <= 1 || paused || reduceMotion) return;
    const t = setTimeout(() => {
      const nextIndex = (current + 1) % count;
      goTo(nextIndex, nextIndex !== 0); // retour au début sans traverser tout le carrousel
    }, DELAY);
    return () => clearTimeout(t);
  }, [current, paused, reduceMotion, count, goTo]);

  if (!media || count === 0) return null;

  const arrow =
    'hidden md:grid absolute top-1/2 -translate-y-1/2 z-20 place-items-center size-11 rounded-full border border-white/40 bg-ink/40 text-white hover:bg-ink/70 transition focus-visible:outline-2 focus-visible:outline-action';

  // Distance circulaire : on ne monte les vidéos que pour la slide active et ses voisines.
  const near = (i: number) => {
    const d = Math.abs(i - current);
    return Math.min(d, count - d) <= 1;
  };

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onTouchCancel={() => setPaused(false)}
      role="region"
      aria-roledescription="carrousel"
      aria-label="Médias à la une"
    >
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {media.map((item, i) => (
          <div
            key={item.id}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${i + 1} sur ${count}`}
            className="relative shrink-0 w-full h-full snap-center snap-always"
          >
            {item.type === 'video' ? (
              near(i) && (
                <video
                  src={cld(item.url, 'f_auto,q_auto')}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? 'auto' : 'metadata'}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              )
            ) : (
              <img
                src={imgSrc(item.url, 1280)}
                srcSet={`${imgSrc(item.url, 800)} 800w, ${imgSrc(item.url, 1280)} 1280w, ${imgSrc(
                  item.url,
                  2400,
                  'q_auto:best'
                )} 2400w`}
                sizes="100vw"
                alt={item.alt || ''}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}

            {item.title && (
              <>
                {/* Dégradé pour garder le texte lisible sur n'importe quelle photo */}
                <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent md:from-ink/70" />
                <div className="absolute inset-0 z-10 flex flex-col items-start justify-center gap-2 p-5 pb-10 w-[72%] md:w-1/2 md:p-12">
                  {item.eyebrow && (
                    <p className="text-action text-xs md:text-sm font-bold uppercase tracking-wide">{item.eyebrow}</p>
                  )}
                  <h2 className="text-[26px] md:text-5xl leading-[1.05] font-extrabold text-white">{item.title}</h2>
                  {item.description && (
                    <p className="text-[13px] md:text-base leading-snug text-white/85">{item.description}</p>
                  )}
                  {item.ctaLabel && item.href && (
                    <Link
                      href={item.href}
                      className="mt-2 inline-flex items-center gap-2 h-11 px-5 rounded-full bg-action text-white text-sm font-semibold active:scale-95 transition-transform"
                    >
                      {item.ctaLabel}
                      <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button onClick={() => goTo(current - 1)} className={`${arrow} left-4`} aria-label="Média précédent">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => goTo(current + 1)} className={`${arrow} right-4`} aria-label="Média suivant">
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center">
            {media.map((item, i) => (
              <button
                key={item.id}
                onClick={() => goTo(i)}
                aria-label={`Média ${i + 1}`}
                aria-current={i === current}
                className="p-1.5" // zone tactile élargie, sans agrandir le point
              >
                <span
                  className={`block h-2 rounded-full transition-all ${
                    i === current ? 'w-6 bg-action' : 'w-2 bg-white/60'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}