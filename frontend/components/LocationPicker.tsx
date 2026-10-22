'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Location = { address: string; lat: string; lng: string };

type Result = { place_id: number; display_name: string; lat: string; lon: string };

const DAKAR: [number, number] = [14.7167, -17.4677];
// Limite la recherche à un pays (code ISO). Mets '' pour chercher partout dans le monde.
const COUNTRY = 'sn';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LocationPicker({
  value,
  onChange,
}: {
  value: Location;
  onChange: (v: Location) => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reverse = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=fr`,
      );
      const data = await res.json();
      return (data.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  };

  const setPoint = async (lat: number, lng: number, address?: string, zoom = 16) => {
    if (!map.current) return;
    if (marker.current) marker.current.setLatLng([lat, lng]);
    else {
      marker.current = L.marker([lat, lng], { icon: markerIcon, draggable: true }).addTo(map.current);
      marker.current.on('dragend', () => {
        const p = marker.current!.getLatLng();
        setPoint(p.lat, p.lng, undefined, map.current!.getZoom());
      });
    }
    map.current.setView([lat, lng], zoom);
    const addr = address ?? (await reverse(lat, lng));
    onChangeRef.current({ address: addr, lat: lat.toFixed(6), lng: lng.toFixed(6) });
  };

  // Initialisation de la carte (une seule fois)
  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const hasValue = value.lat && value.lng;
    const start: [number, number] = hasValue ? [Number(value.lat), Number(value.lng)] : DAKAR;

    map.current = L.map(mapEl.current).setView(start, hasValue ? 16 : 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map.current);

    if (hasValue) {
      marker.current = L.marker(start, { icon: markerIcon, draggable: true }).addTo(map.current);
      marker.current.on('dragend', () => {
        const p = marker.current!.getLatLng();
        setPoint(p.lat, p.lng, undefined, map.current!.getZoom());
      });
    }

    map.current.on('click', (e: L.LeafletMouseEvent) => {
      setResults([]);
      setPoint(e.latlng.lat, e.latlng.lng, undefined, map.current!.getZoom());
    });

    return () => {
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    setError('');
    setResults([]);
    if (!navigator.geolocation) return setError("La géolocalisation n'est pas disponible sur ce navigateur.");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setPoint(pos.coords.latitude, pos.coords.longitude);
        setBusy(false);
      },
      () => {
        setError("Impossible d'obtenir votre position. Autorisez la localisation dans le navigateur.");
        setBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const search = async () => {
    if (!query.trim()) return;
    setError('');
    setResults([]);
    setBusy(true);
    try {
      const country = COUNTRY ? `&countrycodes=${COUNTRY}` : '';
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=fr${country}&q=${encodeURIComponent(query)}`,
      );
      const data: Result[] = await res.json();
      if (!data.length) setError('Aucun résultat. Essayez avec le nom du quartier ou de la ville.');
      else setResults(data);
    } catch {
      setError('La recherche a échoué. Réessayez.');
    } finally {
      setBusy(false);
    }
  };

  const pickResult = async (r: Result) => {
    setResults([]);
    setQuery('');
    await setPoint(Number(r.lat), Number(r.lon), r.display_name);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
          placeholder="Rechercher une adresse, un quartier, un lieu..."
          className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 bg-transparent"
        />
        <button type="button" onClick={search} disabled={busy}
          className="border rounded-lg px-4 py-2 hover:bg-gray-100/10 disabled:opacity-50">
          Rechercher
        </button>
        <button type="button" onClick={useMyLocation} disabled={busy}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
          📍 Utiliser ma position
        </button>
      </div>

      {results.length > 0 && (
        <ul className="border rounded-lg divide-y overflow-hidden">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => pickResult(r)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100/10"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div ref={mapEl} className="w-full h-80 rounded-lg overflow-hidden border z-0" />

      <p className="text-xs text-gray-500">
        Cherchez une adresse, cliquez sur la carte ou déplacez le repère pour ajuster l&apos;emplacement.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div>
        <label className="block text-sm text-gray-500 mb-1">Adresse enregistrée</label>
        <p className="border rounded-lg px-3 py-2 min-h-[42px]">
          {value.address || <span className="text-gray-500">Aucune adresse choisie</span>}
        </p>
      </div>
    </div>
  );
}