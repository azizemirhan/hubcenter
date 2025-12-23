'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, Table } from 'react-bootstrap';
import { hostingService } from '@/services/domainService';
import { customerService } from '@/services/customerService';

const HostingPage = () => {
    const [hostings, setHostings] = useState([]);
    const [summary, setSummary] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer: '', provider: '', plan_name: '', server_ip: '',
        server_location: '', disk_space: '', bandwidth: '',
        start_date: '', expire_date: '', monthly_cost: '', cpanel_url: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [hostingsData, summaryData, customersData] = await Promise.all([
                hostingService.getHostings(),
                hostingService.getHostingsSummary(),
                customerService.getCustomers()
            ]);
            
            const hostingsList = hostingsData.results || hostingsData;
            const customersList = customersData.results || customersData;
            
            setHostings(hostingsList);
            setSummary(summaryData);
            setCustomers(customersList);
        } catch (err) {
            console.error(err);
            setError("Hosting'ler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateHosting = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await hostingService.createHosting(formData);
            setShowModal(false);
            setFormData({ customer: '', provider: '', plan_name: '', server_ip: '', server_location: '', disk_space: '', bandwidth: '', start_date: '', expire_date: '', monthly_cost: '', cpanel_url: '' });
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
                                <h3 className="nk-block-title page-title">Hosting</h3>
                            </div>
                            <div className="nk-block-head-content">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg me-2"></i>Yeni Hosting
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="nk-block">
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-primary">{summary.total || 0}</h4>
                                        <small className="text-muted">Toplam Hosting</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-warning">{summary.expiring_30_days || 0}</h4>
                                        <small className="text-muted">30 Gün İçinde Bitiyor</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-success">₺{(summary.total_monthly_cost || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Aylık Maliyet</small>
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
                                            <th>Sağlayıcı</th>
                                            <th>Plan</th>
                                            <th>Sunucu IP</th>
                                            <th>Bitiş Tarihi</th>
                                            <th>Aylık Ücret</th>
                                            <th>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hostings.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">Kayıtlı hosting bulunamadı.</td>
                                            </tr>
                                        ) : (
                                            hostings.map((hosting) => (
                                                <tr key={hosting.id}>
                                                    <td className="fw-medium">{hosting.customer_name}</td>
                                                    <td>{hosting.provider}</td>
                                                    <td><Badge bg="light" text="dark">{hosting.plan_name}</Badge></td>
                                                    <td><code>{hosting.server_ip || '-'}</code></td>
                                                    <td>{hosting.expire_date}</td>
                                                    <td>
                                                        {hosting.monthly_cost ? 
                                                            `₺${parseFloat(hosting.monthly_cost).toLocaleString('tr-TR')}` : 
                                                            '-'
                                                        }
                                                    </td>
                                                    <td>
                                                        {hosting.cpanel_url && (
                                                            <a href={hosting.cpanel_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                                cPanel
                                                            </a>
                                                        )}
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

            {/* New Hosting Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Hosting</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateHosting}>
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
                                    <Form.Label>Sağlayıcı <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="DigitalOcean, AWS..."
                                        value={formData.provider}
                                        onChange={e => setFormData({...formData, provider: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Plan Adı <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        value={formData.plan_name}
                                        onChange={e => setFormData({...formData, plan_name: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Sunucu IP</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="192.168.1.1"
                                        value={formData.server_ip}
                                        onChange={e => setFormData({...formData, server_ip: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Lokasyon</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Frankfurt, İstanbul..."
                                        value={formData.server_location}
                                        onChange={e => setFormData({...formData, server_location: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Disk Alanı</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="50GB"
                                        value={formData.disk_space}
                                        onChange={e => setFormData({...formData, disk_space: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Bant Genişliği</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Unlimited"
                                        value={formData.bandwidth}
                                        onChange={e => setFormData({...formData, bandwidth: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
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
                            <Col md={3}>
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Aylık Ücret (₺)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        step="0.01"
                                        value={formData.monthly_cost}
                                        onChange={e => setFormData({...formData, monthly_cost: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>cPanel URL</Form.Label>
                                    <Form.Control 
                                        type="url" 
                                        placeholder="https://..."
                                        value={formData.cpanel_url}
                                        onChange={e => setFormData({...formData, cpanel_url: e.target.value})}
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

export default HostingPage;
