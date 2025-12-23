'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, Col, Container, Form, Row, Button, Spinner } from 'react-bootstrap'
import Footer from './Footer'
import { useAuthStore } from '@/stores/authStore'
import api from '@/lib/api'
import axios from 'axios'

//Images
import avatar12 from '@/assets/img/avatar12.jpg'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const LockScreen = () => {
    const router = useRouter()
    const { user, setAuth, accessToken, refreshToken } = useAuthStore()
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const unlockScreen = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Önce mevcut refresh token ile yeni access token almayı dene
            if (refreshToken) {
                try {
                    const refreshResponse = await axios.post(`${API_URL}/auth/refresh/`, {
                        refresh: refreshToken
                    })
                    
                    if (refreshResponse.data.access) {
                        // Refresh başarılı - token'ları ve auth durumunu güncelle
                        const newAccessToken = refreshResponse.data.access
                        const newRefreshToken = refreshResponse.data.refresh || refreshToken
                        
                        // setAuth yerine manuel olarak tüm state'i güncelle
                        useAuthStore.setState({ 
                            accessToken: newAccessToken, 
                            refreshToken: newRefreshToken,
                            isAuthenticated: true 
                        })
                        
                        // State'in persist olması için kısa bekle
                        await new Promise(resolve => setTimeout(resolve, 100))
                        
                        router.push('/dashboard')
                        return
                    }
                } catch (refreshError) {
                    console.log('Refresh failed, will try password login')
                }
            }

            // Refresh başarısız veya yoksa, email + şifre ile giriş yap
            if (user?.email && password) {
                const loginResponse = await axios.post(`${API_URL}/auth/login/`, {
                    email: user.email,
                    password: password
                })

                const { access, refresh, user: userData } = loginResponse.data
                setAuth(userData || user, access, refresh)
                
                // State'in persist olması için kısa bekle
                await new Promise(resolve => setTimeout(resolve, 100))
                
                router.push('/dashboard')
            } else if (!password) {
                setError('Lütfen şifrenizi girin')
            } else {
                setError('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
                router.push('/auth/login')
            }
        } catch (err) {
            console.error('Unlock error:', err)
            if (err.response?.status === 401) {
                setError('Şifre yanlış')
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail)
            } else {
                setError('Giriş yapılamadı. Lütfen tekrar deneyin.')
            }
        } finally {
            setLoading(false)
        }
    }

    // Kullanıcı bilgisi yoksa login sayfasına yönlendir
    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Kullanıcı'
    const displayEmail = user?.email || 'Kullanıcı'

    return (
        <div className="hk-pg-wrapper pt-0 pb-xl-0 pb-5">
            <div className="hk-pg-body pt-0 pb-xl-0">
                <Container>
                    <Row>
                        <Col sm={10} className="position-relative mx-auto">
                            <div className="auth-content py-8">
                                <Form className="w-100" onSubmit={unlockScreen} >
                                    <Row>
                                        <Col lg={4} md={6} className="mx-auto">
                                            <Card className="card-flush bg-transparent">
                                                <Card.Body className="text-center">
                                                    <div className="avatar avatar-xl avatar-rounded position-relative mb-3">
                                                        <Image src={user?.avatar || avatar12} alt="user" className="avatar-img" width={180} height={180} />
                                                        <div className="badge-icon badge-icon-xxs text-primary position-bottom-end-overflow-1">
                                                            <div className="badge-icon-wrap">
                                                                <i className="ri-lock-fill" />
                                                            </div>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127 127">
                                                                <g data-name="Ellipse 302" transform="translate(8 8)" strokeWidth={3}>
                                                                    <circle cx="55.5" cy="55.5" r="55.5" stroke="currentColor" />
                                                                    <circle cx="55.5" cy="55.5" r="59.5" fill="currentColor" />
                                                                </g>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <h4 className="text-white">{displayName}</h4>
                                                    <p className="p-sm mb-4 text-white opacity-55">{displayEmail}</p>
                                                    
                                                    {error && (
                                                        <div className="alert alert-danger mb-3" role="alert">
                                                            {error}
                                                        </div>
                                                    )}
                                                    
                                                    <Row className="gx-3">
                                                        <Col as={Form.Group} className="mb-3">
                                                            <Form.Control 
                                                                placeholder="Şifrenizi girin" 
                                                                type="password"
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                disabled={loading}
                                                                autoFocus
                                                            />
                                                        </Col>
                                                    </Row>
                                                    
                                                    <Button 
                                                        type="submit" 
                                                        variant="primary" 
                                                        className="w-100"
                                                        disabled={loading}
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <Spinner animation="border" size="sm" className="me-2" />
                                                                Giriş yapılıyor...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="ri-lock-unlock-line me-2" />
                                                                Kilidi Aç
                                                            </>
                                                        )}
                                                    </Button>
                                                    
                                                    <div className="mt-3">
                                                        <a 
                                                            href="/auth/login" 
                                                            className="text-white opacity-55 text-decoration-none"
                                                        >
                                                            Farklı hesapla giriş yap
                                                        </a>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
            {/* Page Footer */}
            <Footer />
        </div>
    )
}

export default LockScreen
