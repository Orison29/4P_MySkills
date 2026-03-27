'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authApi } from '@/api/auth.api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'EMPLOYEE',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      await authApi.register(data);
      toast.success('Signup successful. Please login.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-200">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
            Create your account
          </h2>
          <p className="text-sm text-zinc-500 mt-2">
            Sign up to start using 4P_MySkills
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Email address</label>
            <div className="mt-1">
              <input
                {...register('email')}
                type="email"
                className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border outline-none"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Password</label>
            <div className="mt-1">
              <input
                {...register('password')}
                type="password"
                className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border outline-none"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">Role</label>
            <div className="mt-1">
              <select
                {...register('role')}
                className="block w-full rounded-md border-zinc-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border outline-none bg-white"
              >
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="MANAGER">MANAGER</option>
                <option value="HR">HR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
