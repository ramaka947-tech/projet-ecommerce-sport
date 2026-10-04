'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HeroCarousel({ media }: { media: any[] }) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (media.length <= 1 || paused) return;
        timerRef.current = setInterval(() => {
            setCurrent((c) => (c + 1) % media.length);
        }, 6000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [media.length, paused]);

    if (!media || media.length === 0) return null;

    const item = media[current];

    const prev = () => {
        setPaused(true);
        setCurrent((c) => (c - 1 + media.length) % media.length);
    };

    const next = () => {
        setPaused(true);
        setCurrent((c) => (c + 1) % media.length);
    };

    const goTo = (i: number) => {
        setPaused(true);
        setCurrent(i);
    };

    return (
        <>
            {item.type === 'video' ? (
                <video
                    key={item.id}
                    src={item.url.replace('/upload/', '/upload/q_100/')}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <img
                    key={item.id}
                    src={item.url.replace('/upload/', '/upload/q_100,w_2400/')}
                    alt=""
                    className="w-full h-full object-cover"
                />
            )}

            {media.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition"
                        aria-label="Précédent"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition"
                        aria-label="Suivant"
                    >
                        <ChevronRight size={24} />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {media.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i)}
                                className={`w-2.5 h-2.5 rounded-full transition ${i === current ? 'bg-white' : 'bg-white/50'
                                    }`}
                                aria-label={`Média ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </>
    );
}