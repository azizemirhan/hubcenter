'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from 'react-bootstrap';

const AuthGuard = ({ children }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, _hasHydrated } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (_hasHydrated) {
            if (!isAuthenticated && !pathname.startsWith('/auth')) {
                router.push('/auth/login');
            } else {
                setIsReady(true);
            }
        }
    }, [_hasHydrated, isAuthenticated, router, pathname]);

    if (!_hasHydrated || !isReady) {
        return (
            <div className="d-flex align-items-center justify-content-center vh-100">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return children;
};

export default AuthGuard;
