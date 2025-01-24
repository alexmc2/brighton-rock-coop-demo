import { Metadata } from 'next';
import LoginForm from './login-form';
import Logo from '@/components/members/ui/logo';

export const metadata: Metadata = {
  title: 'Sign In - Co-op Management',
  description: 'Sign in to access the co-op management system',
};

export default function Login() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-t from-coop-600 to-coop-400 dark:from-sky-900 dark:to-sky-700" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative max-w-lg text-white">
            <h1 className="mb-4 text-4xl font-bold">Brighton Rock Co-op</h1>
            <p className="text-lg opacity-90">
              Sign in to access the co-op management app
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md space-y-8 px-6 sm:px-6">
          <div className="flex justify-center">
            <Logo />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
