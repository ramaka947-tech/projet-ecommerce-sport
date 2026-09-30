'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerCustomer } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useCustomerAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    country: '', region: '', district: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await registerCustomer(form);
      login(data.accessToken, data.customer);
      router.push('/mon-compte');
    } catch (err: any) {
      setError(err.message || 'Erreur');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" required placeholder="Nom complet" value={form.name} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input name="email" type="email" required placeholder="Email" value={form.email} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input name="password" type="password" required minLength={6} placeholder="Mot de passe (6+)"
          value={form.password} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input name="phone" required placeholder="Téléphone" value={form.phone} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input name="country" placeholder="Pays (optionnel)" value={form.country} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input name="region" placeholder="Région / ville (optionnel)" value={form.region} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input name="district" placeholder="Quartier (optionnel)" value={form.district} onChange={handleChange}
          className="w-full border rounded px-3 py-2 bg-transparent" />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
          {loading ? 'Création...' : 'Créer mon compte'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Déjà un compte ? <Link href="/compte/connexion" className="text-blue-400 hover:underline">Se connecter</Link>
      </p>
    </main>
  );
}