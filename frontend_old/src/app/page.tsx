"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, activeCompany } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      if (activeCompany) {
        router.push('/dashboard')
      } else {
        router.push('/auth/select-company')
      }
    } else {
      router.push('/auth/login')
    }
  }, [isAuthenticated, activeCompany, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}
