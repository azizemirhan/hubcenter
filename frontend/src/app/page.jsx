"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from 'react-bootstrap'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, activeCompany } = useAuthStore()

  useEffect(() => {
    // Client-side redirection
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
    <div className="d-flex align-items-center justify-content-center vh-100">
       <Spinner animation="border" variant="primary" />
    </div>
  )
}
