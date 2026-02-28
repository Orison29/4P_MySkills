'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(data);
      login(response.token, response.user, response.profile);
      
      toast.success('Login successful');
      
      // Redirect based on role
      const role = response.user.role;
      if (role === 'HR') router.push('/hr');
      else if (role === 'ADMIN') router.push('/admin');
      else if (role === 'MANAGER') router.push('/manager');
      else router.push('/employee');
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-200 ">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Sign in to 4P_MySkills
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Enter your details to access your dashboard
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => { setValue('email', 'hr@example.com'); setValue('password', 'password123'); }} className="text-xs py-1 px-2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 hover:bg-indigo-100 transition">HR User</button>
          <button type="button" onClick={() => { setValue('email', 'manager@example.com'); setValue('password', 'password123'); }} className="text-xs py-1 px-2 bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition">Manager</button>
          <button type="button" onClick={() => { setValue('email', 'employee@example.com'); setValue('password', 'password123'); }} className="text-xs py-1 px-2 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 hover:bg-emerald-100 transition">Employee</button>
          <button type="button" onClick={() => { setValue('email', 'admin@example.com'); setValue('password', 'password123'); }} className="text-xs py-1 px-2 bg-zinc-50 text-zinc-700 rounded border border-zinc-200 hover:bg-zinc-100 transition">Admin</button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-zinc-700 ">
              Email address
            </label>
            <div className="mt-1">
              <input
                {...register('email')}
                type="email"
                className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border outline-none"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 ">
              Password
            </label>
            <div className="mt-1">
              <input
                {...register('password')}
                type="password"
                className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border outline-none"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
