'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '../../../services/users';

export default function NewUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'SAM_HEAD' | 'SAM'>('SAM');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createUser({ email, name, role, password });
      router.push('/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New user</h1>
      <form onSubmit={onSubmit} className="bg-white shadow-sm rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'ADMIN' | 'SAM_HEAD' | 'SAM')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
          >
            <option value="SAM">SAM</option>
            <option value="SAM_HEAD">SAM_HEAD</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Temporary password</label>
          <input
            id="password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-md px-4 py-2 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Creating…' : 'Create user'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/users')}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-4 py-2 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
