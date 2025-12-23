"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

const loginSchema = z.object({
    email: z.string().email('Geçerli bir email adresi giriniz'),
    password: z.string().min(1, 'Şifre zorunludur')
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setError('')
            setLoading(true)
            await authService.login(data.email, data.password)
            router.push('/auth/select-company') // Şirket seçimine yönlendir
        } catch (err: any) {
            console.error(err)
            setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.')
        } finally {
            setLoading(false)
        }
    }

    // Zaten giriş yapmışsa yönlendir
    if (isAuthenticated) {
        router.push('/dashboard') // veya select-company
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Hesabınıza Giriş Yapın
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                {...register('email')}
                                type="email"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email adresi"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>
                        <div>
                            <input
                                {...register('password')}
                                type="password"
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Şifre"
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
