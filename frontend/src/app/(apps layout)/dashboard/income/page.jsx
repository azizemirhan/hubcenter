'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, Table } from 'react-bootstrap';
import { financeService } from '@/services/financeService';
import { customerService } from '@/services/customerService';

const PAYMENT_METHODS = {
    cash: 'Nakit',
    bank_transfer: 'Havale/EFT',
    credit_card: 'Kredi Kartı',
    check: 'Çek'
};

const IncomePage = () => {
    const [incomes, setIncomes] = useState([]);
    const [summary, setSummary] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer: '', amount: '', payment_method: 'bank_transfer', received_date: '', description: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [incomesData, summaryData, customersData] = await Promise.all([
                financeService.getIncomes(),
                financeService.getIncomesSummary(),
                customerService.getCustomers()
            ]);
            setIncomes(incomesData.results || incomesData);
            setSummary(summaryData);
            setCustomers(customersData.results || customersData);
        } catch (err) { setError("Gelirler yüklenirken bir hata oluştu."); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await financeService.createIncome(formData);
            setShowModal(false);
            setFormData({ customer: '', amount: '', payment_method: 'bank_transfer', received_date: '', description: '' });
            fetchData();
        } catch (err) { console.error(err); } 
        finally { setSaving(false); }
    };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    return (
        <Container fluid>
            <div className="nk-content-inner">
                <div className="nk-content-body">
                    <div className="nk-block-head nk-block-head-sm">
                        <div className="nk-block-between">
                            <div className="nk-block-head-content">
                                <h3 className="nk-block-title page-title">Gelirler</h3>
                            </div>
                            <div className="nk-block-head-content">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg me-2"></i>Yeni Gelir
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="nk-block">
                        <Row className="g-3 mb-4">
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-primary">{summary.total_records || 0}</h4>
                                        <small className="text-muted">Toplam Kayıt</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-success">₺{(summary.this_month || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Bu Ay</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-info">₺{(summary.this_year || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Bu Yıl</small>
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
                                            <th>Tarih</th>
                                            <th>Müşteri</th>
                                            <th>Tutar</th>
                                            <th>Ödeme Yöntemi</th>
                                            <th>Açıklama</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {incomes.length === 0 ? (
                                            <tr><td colSpan="5" className="text-center py-4">Kayıtlı gelir yok.</td></tr>
                                        ) : incomes.map((inc) => (
                                            <tr key={inc.id}>
                                                <td>{inc.received_date}</td>
                                                <td>{inc.customer_name || '-'}</td>
                                                <td className="text-success fw-medium">+₺{parseFloat(inc.amount).toLocaleString('tr-TR')}</td>
                                                <td><Badge bg="light" text="dark">{inc.payment_method_display}</Badge></td>
                                                <td>{inc.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>Yeni Gelir</Modal.Title></Modal.Header>
                <Form onSubmit={handleCreate}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Müşteri</Form.Label>
                                    <Form.Select value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})}>
                                        <option value="">Seçiniz (opsiyonel)...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tutar (₺) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Ödeme Yöntemi <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={formData.payment_method} onChange={e => setFormData({...formData, payment_method: e.target.value})}>
                                        {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tarih <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="date" value={formData.received_date} onChange={e => setFormData({...formData, received_date: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="success" type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Kaydet'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default IncomePage;
