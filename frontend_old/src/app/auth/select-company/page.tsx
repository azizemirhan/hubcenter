"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

interface Company {
    id: number
    name: string
    company_type: string
    slug: string
}

export default function SelectCompanyPage() {
    const router = useRouter()
    const { setActiveCompany, isAuthenticated } = useAuthStore()
    const [companies, setCompanies] = useState<Company[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login')
            return
        }

        const fetchCompanies = async () => {
            try {
                const data = await authService.getMyCompanies()
                setCompanies(data)

                // Eğer sadece 1 şirket varsa otomatik seç
                if (data.length === 1) {
                    handleSelectCompany(data[0])
                }
            } catch (error) {
                console.error('Şirketler alınamadı', error)
            } finally {
                setLoading(false)
            }
        }

        fetchCompanies()
    }, [isAuthenticated, router])

    const handleSelectCompany = (company: Company) => {
        setActiveCompany(company)
        router.push('/dashboard')
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Çalışma Alanı Seçin
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    İşlem yapmak istediğiniz şirketi seçiniz
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <ul className="divide-y divide-gray-200">
                        {companies.map((company) => (
                            <li
                                key={company.id}
                                className="py-4 hover:bg-gray-50 cursor-pointer transition-colors p-4 rounded-md border border-transparent hover:border-gray-200"
                                onClick={() => handleSelectCompany(company)}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-500 text-white font-bold">
                                            {company.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {company.name}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">
                                            {company.company_type === 'main' ? 'Ana Şirket' : 'Şube/İştirak'}
                                        </p>
                                    </div>
                                    <div>
                                        <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
