'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, Table } from 'react-bootstrap';
import { domainService } from '@/services/domainService';
import { customerService } from '@/services/customerService';

const DomainsPage = () => {
    const [domains, setDomains] = useState([]);
    const [summary, setSummary] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer: '', domain_name: '', registrar: '', register_date: '',
        expire_date: '', auto_renew: true, dns_provider: '', ssl_provider: '', ssl_expire_date: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [domainsData, summaryData, customersData] = await Promise.all([
                domainService.getDomains(),
                domainService.getDomainsSummary(),
                customerService.getCustomers()
            ]);
            
            const domainsList = domainsData.results || domainsData;
            const customersList = customersData.results || customersData;
            
            setDomains(domainsList);
            setSummary(summaryData);
            setCustomers(customersList);
        } catch (err) {
            console.error(err);
            setError("Domainler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateDomain = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await domainService.createDomain(formData);
            setShowModal(false);
            setFormData({ customer: '', domain_name: '', registrar: '', register_date: '', expire_date: '', auto_renew: true, dns_provider: '', ssl_provider: '', ssl_expire_date: '' });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const getExpiryBadge = (daysUntil) => {
        if (daysUntil < 0) return <Badge bg="dark">Süresi Doldu</Badge>;
        if (daysUntil <= 7) return <Badge bg="danger">{daysUntil} gün</Badge>;
        if (daysUntil <= 30) return <Badge bg="warning">{daysUntil} gün</Badge>;
        return <Badge bg="success">{daysUntil} gün</Badge>;
    };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    return (
        <Container fluid>
            <div className="nk-content-inner">
                <div className="nk-content-body">
                    <div className="nk-block-head nk-block-head-sm">
                        <div className="nk-block-between">
                            <div className="nk-block-head-content">
                                <h3 className="nk-block-title page-title">Domainler</h3>
                            </div>
                            <div className="nk-block-head-content">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg me-2"></i>Yeni Domain
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
                                        <small className="text-muted">Toplam Domain</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-danger">{summary.expiring_7_days || 0}</h4>
                                        <small className="text-muted">7 Gün İçinde</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-warning">{summary.expiring_30_days || 0}</h4>
                                        <small className="text-muted">30 Gün İçinde</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-success">{summary.auto_renew_enabled || 0}</h4>
                                        <small className="text-muted">Oto Yenileme</small>
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
                                            <th>Domain</th>
                                            <th>Müşteri</th>
                                            <th>Kayıt Firması</th>
                                            <th>Bitiş Tarihi</th>
                                            <th>Kalan Süre</th>
                                            <th>SSL</th>
                                            <th>Oto Yenileme</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {domains.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">Kayıtlı domain bulunamadı.</td>
                                            </tr>
                                        ) : (
                                            domains.map((domain) => (
                                                <tr key={domain.id}>
                                                    <td className="fw-medium">{domain.domain_name}</td>
                                                    <td>{domain.customer_name}</td>
                                                    <td>{domain.registrar}</td>
                                                    <td>{domain.expire_date}</td>
                                                    <td>{getExpiryBadge(domain.days_until_expiry)}</td>
                                                    <td>{domain.ssl_expire_date || '-'}</td>
                                                    <td>
                                                        {domain.auto_renew ? 
                                                            <Badge bg="success">Aktif</Badge> : 
                                                            <Badge bg="secondary">Pasif</Badge>
                                                        }
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

            {/* New Domain Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Domain</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateDomain}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Domain Adı <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="example.com"
                                        value={formData.domain_name}
                                        onChange={e => setFormData({...formData, domain_name: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
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
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Kayıt Firması <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="GoDaddy, Namecheap..."
                                        value={formData.registrar}
                                        onChange={e => setFormData({...formData, registrar: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Kayıt Tarihi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.register_date}
                                        onChange={e => setFormData({...formData, register_date: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.expire_date}
                                        onChange={e => setFormData({...formData, expire_date: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>DNS Sağlayıcı</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={formData.dns_provider}
                                        onChange={e => setFormData({...formData, dns_provider: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>SSL Sağlayıcı</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={formData.ssl_provider}
                                        onChange={e => setFormData({...formData, ssl_provider: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>SSL Bitiş Tarihi</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.ssl_expire_date}
                                        onChange={e => setFormData({...formData, ssl_expire_date: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Check 
                                    type="switch"
                                    id="auto-renew-switch"
                                    label="Otomatik Yenileme"
                                    checked={formData.auto_renew}
                                    onChange={e => setFormData({...formData, auto_renew: e.target.checked})}
                                />
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

export default DomainsPage;
