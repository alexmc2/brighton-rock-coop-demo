// app/members/(auth)/login/login-form.tsx

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AuthApiError } from '@supabase/supabase-js';

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const supabase = createClientComponentClient();

  // Handle session refresh manually
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const handleGuestLogin = useCallback(() => {
    if (isLoading) return;
    setEmail('demo@brighton-rock.org');
    setPassword('X9!b@7qL');
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting authentication...');
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError instanceof AuthApiError && signInError.status === 429) {
          setError(
            'Too many login attempts. Please wait a moment and try again.'
          );
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (!data?.session) {
        console.error('No session returned');
        setError('Authentication failed');
        return;
      }

      console.log('Authentication successful, redirecting...');
      router.refresh();
      router.push('/members/dashboard');
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <div className="rounded-xl bg-violet-50 dark:bg-sky-950/50 p-4 text-center">
        <p className="text-sm font-medium text-violet-800 dark:text-sky-300">
          This is a demo version of the Brighton Rock Co-op Management App
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-slate-400"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className=" text-slate-700 dark:text-slate-200 mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-sky-600 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-400"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-sky-600 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-xl bg-coop-500 dark:bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-coop-500 dark:hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-coop-500 dark:focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={handleGuestLogin}
            className="flex w-full justify-center rounded-xl bg-violet-100 dark:bg-sky-950 px-4 py-2 text-sm font-semibold text-violet-700 dark:text-sky-400 shadow-sm hover:bg-violet-200 dark:hover:bg-sky-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-sky-500 focus:ring-offset-2"
          >
            Demo Access
          </button>
        </div>
      </form>
    </div>
  );
}
