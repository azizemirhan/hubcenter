'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Col, Container, Form, InputGroup, Row, Alert, Spinner } from 'react-bootstrap';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

//Images
import logo from '@/assets/img/logo-light.png';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    
    useEffect(() => {
        if (isAuthenticated) {
            router.push('/auth/select-company');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await authService.login(email, password);
            router.push("/auth/select-company");
        } catch (err) {
            console.error(err);
            setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="hk-pg-wrapper py-0" >
            <div className="hk-pg-body py-0">
                <Container fluid>
                    <Row className="auth-split">
                        <Col xl={5} lg={6} md={7} className="position-relative mx-auto">
                            <div className="auth-content flex-column pt-8 pb-md-8 pb-13">
                                <div className="text-center mb-7">
                                    <Link href="/" className="navbar-brand me-0">
                                        <Image className="brand-img d-inline-block" src={logo} alt="brand" />
                                    </Link>
                                </div>
                                <Form className="w-100" onSubmit={handleSubmit} >
                                    <Row>
                                        <Col xl={7} sm={10} className="mx-auto">
                                            <div className="text-center mb-4">
                                                <h4>Hesabınıza Giriş Yapın</h4>
                                                <p>CRM/ERP Sistemine hoş geldiniz.</p>
                                            </div>
                                            
                                            {error && <Alert variant="danger">{error}</Alert>}

                                            <Row className="gx-3">
                                                <Col as={Form.Group} lg={12} className="mb-3" >
                                                    <div className="form-label-group">
                                                        <Form.Label>Email</Form.Label>
                                                    </div>
                                                    <Form.Control 
                                                        placeholder="Email adresi" 
                                                        type="email" 
                                                        value={email} 
                                                        onChange={e => setEmail(e.target.value)}
                                                        required
                                                    />
                                                </Col>
                                                <Col as={Form.Group} lg={12} className="mb-3" >
                                                    <div className="form-label-group">
                                                        <Form.Label>Şifre</Form.Label>
                                                    </div>
                                                    <InputGroup className="password-check">
                                                        <span className="input-affix-wrapper affix-wth-text">
                                                            <Form.Control 
                                                                placeholder="Şifreniz" 
                                                                value={password} 
                                                                onChange={e => setPassword(e.target.value)} 
                                                                type={showPassword ? "text" : "password"}
                                                                required
                                                            />
                                                            <Link href="#" className="input-suffix text-primary text-uppercase fs-8 fw-medium" onClick={() => setShowPassword(!showPassword)} >
                                                                {showPassword ? <span>Gizle</span> : <span>Göster</span>}
                                                            </Link>
                                                        </span>
                                                    </InputGroup>
                                                </Col>
                                            </Row>
                                            
                                            <Button variant="primary" type="submit" className="btn-uppercase btn-block" disabled={loading}>
                                                {loading ? <Spinner animation="border" size="sm" /> : 'Giriş Yap'}
                                            </Button>

                                        </Col>
                                    </Row>
                                </Form>
                            </div>
                            <div className="hk-footer border-0">
                                <Container fluid as="footer" className="footer">
                                    <Row>
                                        <div className="col-xl-8 text-center">
                                            <p className="footer-text pb-0">
                                                <span className="copy-text">NextCRM © {new Date().getFullYear()} Tüm hakları saklıdır.</span>
                                            </p>
                                        </div>
                                    </Row>
                                </Container>
                            </div>
                        </Col>
                        <Col xl={7} lg={6} md={5} sm={10} className="d-md-block d-none position-relative bg-primary-light-5">
                            <div className="auth-content flex-column text-center py-8">
                                <Row>
                                    <Col xxl={7} xl={8} lg={11} className="mx-auto">
                                        <h2 className="mb-4">Güçlü. Esnek. Verimli.</h2>
                                        <p>İş süreçlerinizi tek bir yerden yönetin, verimliliğinizi artırın.</p>
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )
}

export default Login
