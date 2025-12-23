'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Spinner, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import { financeService } from '@/services/financeService';

const FinancePage = () => {
    const [invoiceSummary, setInvoiceSummary] = useState({});
    const [incomeSummary, setIncomeSummary] = useState({});
    const [expenseSummary, setExpenseSummary] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [inv, inc, exp] = await Promise.all([
                financeService.getInvoicesSummary(),
                financeService.getIncomesSummary(),
                financeService.getExpensesSummary()
            ]);
            setInvoiceSummary(inv);
            setIncomeSummary(inc);
            setExpenseSummary(exp);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    return (
        <Container fluid>
            <div className="nk-content-inner">
                <div className="nk-content-body">
                    <div className="nk-block-head nk-block-head-sm">
                        <div className="nk-block-head-content">
                            <h3 className="nk-block-title page-title">Finans Özeti</h3>
                        </div>
                    </div>

                    <div className="nk-block">
                        <Row className="g-4">
                            {/* Invoices Card */}
                            <Col md={4}>
                                <Link href="/dashboard/finance/invoices" className="text-decoration-none">
                                    <Card className="h-100 shadow-sm border-0 hover-shadow">
                                        <Card.Body className="text-center py-4">
                                            <div className="text-primary mb-3">
                                                <i className="bi bi-receipt" style={{fontSize: '2.5rem'}}></i>
                                            </div>
                                            <h5 className="mb-3">Faturalar</h5>
                                            <Row className="g-2">
                                                <Col>
                                                    <div className="text-muted small">Toplam</div>
                                                    <div className="fw-bold">{invoiceSummary.total_invoices || 0}</div>
                                                </Col>
                                                <Col>
                                                    <div className="text-muted small">Bekleyen</div>
                                                    <div className="fw-bold text-warning">₺{(invoiceSummary.pending_amount || 0).toLocaleString('tr-TR')}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>

                            {/* Income Card */}
                            <Col md={4}>
                                <Link href="/dashboard/finance/income" className="text-decoration-none">
                                    <Card className="h-100 shadow-sm border-0 hover-shadow">
                                        <Card.Body className="text-center py-4">
                                            <div className="text-success mb-3">
                                                <i className="bi bi-graph-up-arrow" style={{fontSize: '2.5rem'}}></i>
                                            </div>
                                            <h5 className="mb-3">Gelirler</h5>
                                            <Row className="g-2">
                                                <Col>
                                                    <div className="text-muted small">Bu Ay</div>
                                                    <div className="fw-bold text-success">₺{(incomeSummary.this_month || 0).toLocaleString('tr-TR')}</div>
                                                </Col>
                                                <Col>
                                                    <div className="text-muted small">Bu Yıl</div>
                                                    <div className="fw-bold">₺{(incomeSummary.this_year || 0).toLocaleString('tr-TR')}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>

                            {/* Expenses Card */}
                            <Col md={4}>
                                <Link href="/dashboard/finance/expenses" className="text-decoration-none">
                                    <Card className="h-100 shadow-sm border-0 hover-shadow">
                                        <Card.Body className="text-center py-4">
                                            <div className="text-danger mb-3">
                                                <i className="bi bi-graph-down-arrow" style={{fontSize: '2.5rem'}}></i>
                                            </div>
                                            <h5 className="mb-3">Giderler</h5>
                                            <Row className="g-2">
                                                <Col>
                                                    <div className="text-muted small">Aylık Sabit</div>
                                                    <div className="fw-bold text-danger">₺{(expenseSummary.monthly_recurring || 0).toLocaleString('tr-TR')}</div>
                                                </Col>
                                                <Col>
                                                    <div className="text-muted small">Toplam</div>
                                                    <div className="fw-bold">{expenseSummary.total_records || 0}</div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        </Row>
                    </div>

                    {/* Quick Stats */}
                    <div className="nk-block mt-4">
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-white">
                                <h6 className="mb-0">Finansal Özet</h6>
                            </Card.Header>
                            <Card.Body>
                                <Row className="g-4 text-center">
                                    <Col md={3}>
                                        <div className="text-muted small mb-1">Toplam Fatura</div>
                                        <h4 className="text-primary">₺{(invoiceSummary.total_amount || 0).toLocaleString('tr-TR')}</h4>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-muted small mb-1">Tahsil Edilen</div>
                                        <h4 className="text-success">₺{(invoiceSummary.paid_amount || 0).toLocaleString('tr-TR')}</h4>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-muted small mb-1">Bu Ay Gelir</div>
                                        <h4 className="text-info">₺{(incomeSummary.this_month || 0).toLocaleString('tr-TR')}</h4>
                                    </Col>
                                    <Col md={3}>
                                        <div className="text-muted small mb-1">Aylık Gider</div>
                                        <h4 className="text-danger">₺{(expenseSummary.monthly_recurring || 0).toLocaleString('tr-TR')}</h4>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default FinancePage;
