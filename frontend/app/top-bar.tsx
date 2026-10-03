'use client';
import { Mail, Phone, Globe } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="hidden md:flex bg-gray-900 text-white text-xs px-6 py-2.5 items-center justify-between">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5">
          <Mail size={13} /> contact@sportpro.com
        </span>
        <span className="flex items-center gap-1.5">
          <Phone size={13} /> +221 XX XX XX XX
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1 hover:opacity-80">
          <Globe size={13} /> FR ▾
        </button>
        <button className="flex items-center gap-1 hover:opacity-80">
          EUR ▾
        </button>
      </div>
    </div>
  );
}