'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, Table, ProgressBar } from 'react-bootstrap';
import { seoService } from '@/services/seoService';
import { customerService } from '@/services/customerService';

const PACKAGE_TYPES = {
    basic: { label: 'Temel', color: 'secondary' },
    standard: { label: 'Standart', color: 'info' },
    premium: { label: 'Premium', color: 'warning' },
    enterprise: { label: 'Kurumsal', color: 'primary' }
};

const STATUS_COLORS = {
    active: 'success',
    paused: 'warning',
    completed: 'info',
    cancelled: 'danger'
};

const SEOPage = () => {
    const [packages, setPackages] = useState([]);
    const [summary, setSummary] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer: '', package_type: 'standard', status: 'active',
        start_date: '', monthly_fee: '', target_keywords: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [packagesData, summaryData, customersData] = await Promise.all([
                seoService.getPackages(),
                seoService.getPackagesSummary(),
                customerService.getCustomers()
            ]);
            
            const packagesList = packagesData.results || packagesData;
            const customersList = customersData.results || customersData;
            
            setPackages(packagesList);
            setSummary(summaryData);
            setCustomers(customersList);
        } catch (err) {
            console.error(err);
            setError("SEO paketleri yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreatePackage = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await seoService.createPackage(formData);
            setShowModal(false);
            setFormData({ customer: '', package_type: 'standard', status: 'active', start_date: '', monthly_fee: '', target_keywords: '' });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    return (
        <Container fluid>
            <div className="nk-content-inner">
                <div className="nk-content-body">
                    <div className="nk-block-head nk-block-head-sm">
                        <div className="nk-block-between">
                            <div className="nk-block-head-content">
                                <h3 className="nk-block-title page-title">SEO Yönetimi</h3>
                            </div>
                            <div className="nk-block-head-content">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg me-2"></i>Yeni Paket
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="nk-block">
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-primary">{summary.total || 0}</h4>
                                        <small className="text-muted">Toplam Paket</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-success">{summary.active || 0}</h4>
                                        <small className="text-muted">Aktif</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-warning">{summary.paused || 0}</h4>
                                        <small className="text-muted">Duraklatılmış</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-success">₺{(summary.monthly_revenue || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Aylık Gelir</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                    <div className="nk-block">
                        {error && <Alert variant="danger">{error}</Alert>}
                        
                        <Card>
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Müşteri</th>
                                            <th>Domain</th>
                                            <th>Paket</th>
                                            <th>Durum</th>
                                            <th>Başlangıç</th>
                                            <th>Aylık Ücret</th>
                                            <th>Anahtar Kelime</th>
                                            <th>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packages.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">Kayıtlı SEO paketi bulunamadı.</td>
                                            </tr>
                                        ) : (
                                            packages.map((pkg) => (
                                                <tr key={pkg.id}>
                                                    <td className="fw-medium">{pkg.customer_name}</td>
                                                    <td>{pkg.domain_name || '-'}</td>
                                                    <td>
                                                        <Badge bg={PACKAGE_TYPES[pkg.package_type]?.color || 'secondary'}>
                                                            {pkg.package_type_display}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge bg={STATUS_COLORS[pkg.status] || 'secondary'}>
                                                            {pkg.status_display}
                                                        </Badge>
                                                    </td>
                                                    <td>{pkg.start_date}</td>
                                                    <td>₺{parseFloat(pkg.monthly_fee).toLocaleString('tr-TR')}</td>
                                                    <td>
                                                        <Badge bg="light" text="dark">{pkg.keyword_count || 0}</Badge>
                                                    </td>
                                                    <td>
                                                        <Button variant="outline-primary" size="sm">
                                                            Detay
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>

            {/* New Package Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni SEO Paketi</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePackage}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Müşteri <span className="text-danger">*</span></Form.Label>
                                    <Form.Select 
                                        value={formData.customer}
                                        onChange={e => setFormData({...formData, customer: e.target.value})}
                                        required
                                    >
                                        <option value="">Seçiniz...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Paket Tipi <span className="text-danger">*</span></Form.Label>
                                    <Form.Select 
                                        value={formData.package_type}
                                        onChange={e => setFormData({...formData, package_type: e.target.value})}
                                    >
                                        <option value="basic">Temel</option>
                                        <option value="standard">Standart</option>
                                        <option value="premium">Premium</option>
                                        <option value="enterprise">Kurumsal</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.start_date}
                                        onChange={e => setFormData({...formData, start_date: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Aylık Ücret (₺) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01"
                                        value={formData.monthly_fee}
                                        onChange={e => setFormData({...formData, monthly_fee: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Durum</Form.Label>
                                    <Form.Select 
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="paused">Duraklatılmış</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Hedef Anahtar Kelimeler</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={4}
                                        placeholder="Her satıra bir anahtar kelime yazın..."
                                        value={formData.target_keywords}
                                        onChange={e => setFormData({...formData, target_keywords: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <Spinner size="sm" className="me-2" /> : null}
                            Kaydet
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default SEOPage;
