'use client';
import MainLayout from '@/layout/apps-layout'
import AuthGuard from '@/components/AuthGuard'

const AppsLayout = ({ children }) => {

    return (
        <AuthGuard>
            <MainLayout>
                {children}
            </MainLayout>
        </AuthGuard>
    )
}

export default AppsLayout
