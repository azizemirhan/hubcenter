'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Col, Container, Form, Row, Card, Spinner, ListGroup } from 'react-bootstrap';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

//Images
import logo from '@/assets/img/logo-light.png';

const SelectCompany = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const router = useRouter();
    const { isAuthenticated, setActiveCompany } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }

        const fetchCompanies = async () => {
            try {
                const data = await authService.getMyCompanies();
                setCompanies(data);
                if (data.length === 1) {
                    handleSelect(data[0]);
                }
            } catch (error) {
                console.error("Şirketler alınamadı", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, [isAuthenticated, router]);

    const handleSelect = async (company) => {
        try {
            setLoading(true);
            await authService.switchCompany(company.slug);
            setActiveCompany(company);
            router.push('/dashboard');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="d-flex justify-content-center mt-5"><Spinner animation="border" /></div>;

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
                                <div className="w-100">
                                    <Row>
                                        <Col xl={8} sm={10} className="mx-auto">
                                            <div className="text-center mb-4">
                                                <h4>Çalışma Alanı Seçin</h4>
                                                <p>İşlem yapmak istediğiniz şirketi seçiniz</p>
                                            </div>
                                            
                                            <ListGroup variant="flush" className="border rounded">
                                                {companies.map(company => (
                                                    <ListGroup.Item 
                                                        key={company.id} 
                                                        action 
                                                        onClick={() => handleSelect(company)}
                                                        className="d-flex align-items-center p-3"
                                                    >
                                                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: 40, height: 40}}>
                                                            {company.logo ? (
                                                                <img src={company.logo} alt={company.name} className="w-100 h-100 rounded-circle" />
                                                            ) : (
                                                                <span className="fw-bold">{company.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="fw-medium">{company.name}</div>
                                                            <small className="text-muted">{company.company_type === 'main' ? 'Ana Şirket' : 'Şube/İştirak'}</small>
                                                        </div>
                                                        <div className="ms-auto">
                                                            <i className="bi bi-chevron-right text-muted"></i>
                                                        </div>
                                                    </ListGroup.Item>
                                                ))}
                                            </ListGroup>

                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </div>
    )
}

export default SelectCompany
