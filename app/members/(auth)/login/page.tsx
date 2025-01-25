import { Metadata } from 'next';
import LoginForm from './login-form';
import Logo from '@/components/members/ui/logo';

export const metadata: Metadata = {
  title: 'Demo - Brighton Rock Co-op Management',
  description: 'Brighton Rock Co-op management system demo',
};

export default function Login() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-gradient-to-t from-coop-600 to-coop-400 dark:from-sky-900 dark:to-sky-700" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative max-w-lg text-white">
            <div className="mb-6 inline-block rounded-lg bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              Demo Version
            </div>
            <h1 className="mb-4 text-4xl font-bold">Brighton Rock Co-op</h1>
            <p className="text-lg opacity-90">
              Try out our co-op management app demo
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
