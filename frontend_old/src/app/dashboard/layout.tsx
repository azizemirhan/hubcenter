"use client"

import { useAuthStore } from "@/stores/authStore"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAuthenticated, activeCompany, user, logout } = useAuthStore()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (!isAuthenticated) {
            router.push('/auth/login')
        } else if (!activeCompany) {
            router.push('/auth/select-company')
        }
    }, [isAuthenticated, activeCompany, router])

    if (!mounted || !user || !activeCompany) return null

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:block">
                <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-700">
                    NextCRM
                </div>
                <nav className="p-4 space-y-2">
                    <a href="/dashboard" className="block px-4 py-2 rounded bg-slate-800 text-blue-400 font-medium">Dashboard</a>
                    <a href="/dashboard/customers" className="block px-4 py-2 rounded hover:bg-slate-800 transition">Müşteriler</a>
                    <a href="/dashboard/projects" className="block px-4 py-2 rounded hover:bg-slate-800 transition">Projeler</a>
                    <a href="/dashboard/finance" className="block px-4 py-2 rounded hover:bg-slate-800 transition">Finans</a>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
                    <h1 className="text-lg font-semibold text-gray-800">{activeCompany.name}</h1>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                            {user.first_name} {user.last_name}
                        </span>
                        <button
                            onClick={() => {
                                logout()
                                router.push('/auth/login')
                            }}
                            className="text-red-500 text-sm hover:text-red-700 font-medium"
                        >
                            Çıkış
                        </button>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
