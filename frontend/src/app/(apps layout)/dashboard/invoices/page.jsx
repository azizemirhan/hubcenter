'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, Table } from 'react-bootstrap';
import { financeService } from '@/services/financeService';
import { customerService } from '@/services/customerService';

const STATUS_COLORS = {
    draft: 'secondary',
    sent: 'info',
    paid: 'success',
    partial: 'warning',
    overdue: 'danger',
    cancelled: 'dark'
};

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [summary, setSummary] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        customer: '', invoice_no: '', amount: '', tax_rate: '20',
        issue_date: '', due_date: '', description: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [invoicesData, summaryData, customersData] = await Promise.all([
                financeService.getInvoices(),
                financeService.getInvoicesSummary(),
                customerService.getCustomers()
            ]);
            
            setInvoices(invoicesData.results || invoicesData);
            setSummary(summaryData);
            setCustomers(customersData.results || customersData);
        } catch (err) {
            console.error(err);
            setError("Faturalar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await financeService.createInvoice(formData);
            setShowModal(false);
            setFormData({ customer: '', invoice_no: '', amount: '', tax_rate: '20', issue_date: '', due_date: '', description: '' });
            fetchData();
        } catch (err) { console.error(err); } 
        finally { setSaving(false); }
    };

    const handleMarkPaid = async (id) => {
        try {
            await financeService.markInvoicePaid(id);
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    return (
        <Container fluid>
            <div className="nk-content-inner">
                <div className="nk-content-body">
                    <div className="nk-block-head nk-block-head-sm">
                        <div className="nk-block-between">
                            <div className="nk-block-head-content">
                                <h3 className="nk-block-title page-title">Faturalar</h3>
                            </div>
                            <div className="nk-block-head-content">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg me-2"></i>Yeni Fatura
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="nk-block">
                        <Row className="g-3 mb-4">
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-primary">{summary.total_invoices || 0}</h4>
                                        <small className="text-muted">Toplam</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-success">₺{(summary.paid_amount || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Ödenen</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-warning">₺{(summary.pending_amount || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Bekleyen</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={3}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-danger">{summary.overdue || 0}</h4>
                                        <small className="text-muted">Gecikmiş</small>
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
                                            <th>Fatura No</th>
                                            <th>Müşteri</th>
                                            <th>Tutar</th>
                                            <th>Tarih</th>
                                            <th>Vade</th>
                                            <th>Durum</th>
                                            <th>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.length === 0 ? (
                                            <tr><td colSpan="7" className="text-center py-4">Kayıtlı fatura yok.</td></tr>
                                        ) : invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="fw-medium">{inv.invoice_no}</td>
                                                <td>{inv.customer_name}</td>
                                                <td>₺{parseFloat(inv.total_amount).toLocaleString('tr-TR')}</td>
                                                <td>{inv.issue_date}</td>
                                                <td>{inv.due_date}</td>
                                                <td><Badge bg={STATUS_COLORS[inv.status]}>{inv.status_display}</Badge></td>
                                                <td>
                                                    {inv.status !== 'paid' && (
                                                        <Button size="sm" variant="outline-success" onClick={() => handleMarkPaid(inv.id)}>
                                                            Ödendi
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Yeni Fatura</Modal.Title></Modal.Header>
                <Form onSubmit={handleCreate}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Müşteri <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={formData.customer} onChange={e => setFormData({...formData, customer: e.target.value})} required>
                                        <option value="">Seçiniz...</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Fatura No <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" value={formData.invoice_no} onChange={e => setFormData({...formData, invoice_no: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Tutar (₺) <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>KDV Oranı (%)</Form.Label>
                                    <Form.Control type="number" value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Düzenleme Tarihi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Vade Tarihi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="date" value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} required />
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
                        <Button variant="primary" type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Kaydet'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default InvoicesPage;
