'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm text-ink/70 hover:text-ink hover:underline transition"
    >
      <ArrowLeft size={16} />
      Retour
    </button>
  );
}