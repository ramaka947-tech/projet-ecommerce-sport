'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginCustomer } from '@/lib/api';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginCustomer(email, password);
      login(data.accessToken, data.customer);
      router.push('/mon-compte');
    } catch (err: any) {
      setError(err.message || 'Erreur');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-6">Connexion</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" required placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-transparent" />
        <input type="password" required placeholder="Mot de passe" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 bg-transparent" />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full bg-black text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
      <p className="text-sm text-gray-500 mt-4">
        Pas de compte ? <Link href="/compte/inscription" className="text-blue-400 hover:underline">Créer un compte</Link>
      </p>
    </main>
  );
}