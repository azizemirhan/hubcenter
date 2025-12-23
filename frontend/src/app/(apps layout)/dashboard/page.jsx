'use client'
import React from 'react';
import { Col, Container, Row, Card } from 'react-bootstrap';
import { useAuthStore } from '@/stores/authStore';

const Dashboard = () => {
    const { activeCompany, user } = useAuthStore();

    if (!activeCompany) return <div>Yükleniyor...</div>;

    return (
        <Container fluid>
            <div className="nk-content-inner">
                <div className="nk-content-body">
                    <div className="nk-block-head nk-block-head-sm">
                        <div className="nk-block-between">
                            <div className="nk-block-head-content">
                                <h3 className="nk-block-title page-title">Dashboard</h3>
                                <div className="nk-block-des text-soft">
                                    <p>Hoşgeldin, {user?.first_name} {user?.last_name}. <b>{activeCompany.name}</b> panelindesin.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Row className="g-gs">
                        <Col xxl={3} sm={6}>
                            <Card className="h-100">
                                <Card.Body>
                                    <div className="card-title-group">
                                        <div className="card-title">
                                            <h6 className="title">Toplam Müşteri</h6>
                                        </div>
                                    </div>
                                    <div className="data">
                                        <div className="amount">124</div>
                                        <div className="info text-up text-success"><span className="change">+2.5%</span> <span className="text-muted">geçen aydan</span></div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        <Col xxl={3} sm={6}>
                             <Card className="h-100">
                                <Card.Body>
                                    <div className="card-title-group">
                                        <div className="card-title">
                                            <h6 className="title">Aktif Projeler</h6>
                                        </div>
                                    </div>
                                    <div className="data">
                                        <div className="amount">8</div>
                                        <div className="info text-muted">Devam eden işler</div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>

                    </Row>
                </div>
            </div>
        </Container>
    )
}

export default Dashboard
