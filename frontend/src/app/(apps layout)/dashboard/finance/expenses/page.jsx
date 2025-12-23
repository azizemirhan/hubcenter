'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, Table } from 'react-bootstrap';
import { financeService } from '@/services/financeService';

const CATEGORIES = {
    rent: 'Kira', utilities: 'Faturalar', salary: 'Maaş', software: 'Yazılım/Abonelik',
    hardware: 'Donanım', marketing: 'Pazarlama', domain_hosting: 'Domain/Hosting',
    office: 'Ofis Giderleri', tax: 'Vergi', other: 'Diğer'
};

const PERIOD_TYPES = { once: 'Tek Seferlik', monthly: 'Aylık', yearly: 'Yıllık' };

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        category: 'other', title: '', amount: '', period_type: 'once', start_date: '', description: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [expensesData, summaryData] = await Promise.all([
                financeService.getExpenses(),
                financeService.getExpensesSummary()
            ]);
            setExpenses(expensesData.results || expensesData);
            setSummary(summaryData);
        } catch (err) { setError("Giderler yüklenirken bir hata oluştu."); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await financeService.createExpense(formData);
            setShowModal(false);
            setFormData({ category: 'other', title: '', amount: '', period_type: 'once', start_date: '', description: '' });
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
                                <h3 className="nk-block-title page-title">Giderler</h3>
                            </div>
                            <div className="nk-block-head-content">
                                <Button variant="primary" onClick={() => setShowModal(true)}>
                                    <i className="bi bi-plus-lg me-2"></i>Yeni Gider
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
                                        <h4 className="mb-1 text-danger">₺{(summary.monthly_recurring || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Aylık Sabit</small>
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={4}>
                                <Card className="text-center border-0 shadow-sm">
                                    <Card.Body className="py-3">
                                        <h4 className="mb-1 text-warning">₺{(summary.one_time_this_month || 0).toLocaleString('tr-TR')}</h4>
                                        <small className="text-muted">Bu Ay Tek Seferlik</small>
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
                                            <th>Başlık</th>
                                            <th>Kategori</th>
                                            <th>Tutar</th>
                                            <th>Periyot</th>
                                            <th>Başlangıç</th>
                                            <th>Durum</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-4">Kayıtlı gider yok.</td></tr>
                                        ) : expenses.map((exp) => (
                                            <tr key={exp.id}>
                                                <td className="fw-medium">{exp.title}</td>
                                                <td><Badge bg="light" text="dark">{exp.category_display}</Badge></td>
                                                <td className="text-danger fw-medium">-₺{parseFloat(exp.amount).toLocaleString('tr-TR')}</td>
                                                <td>{exp.period_type_display}</td>
                                                <td>{exp.start_date}</td>
                                                <td>
                                                    <Badge bg={exp.is_active ? 'success' : 'secondary'}>
                                                        {exp.is_active ? 'Aktif' : 'Pasif'}
                                                    </Badge>
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

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>Yeni Gider</Modal.Title></Modal.Header>
                <Form onSubmit={handleCreate}>
                    <Modal.Body>
                        <Row className="g-3">
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Başlık <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Kategori <span className="text-danger">*</span></Form.Label>
                                    <Form.Select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
                                    <Form.Label>Periyot</Form.Label>
                                    <Form.Select value={formData.period_type} onChange={e => setFormData({...formData, period_type: e.target.value})}>
                                        {Object.entries(PERIOD_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control as="textarea" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button variant="danger" type="submit" disabled={saving}>{saving ? <Spinner size="sm" /> : 'Kaydet'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default ExpensesPage;
