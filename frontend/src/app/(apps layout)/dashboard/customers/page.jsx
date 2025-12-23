'use client'
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Button, Card, Col, Container, Row, Table, Badge, Spinner, Alert, Form, InputGroup, Dropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { customerService } from '@/services/customerService';
import Link from 'next/link';
import { Search, SortAscending, SortDescending, Eye, Trash, Plus, Refresh, Users, Building, Phone, Mail, World, X } from 'tabler-icons-react';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [serviceFilter, setServiceFilter] = useState('all');
    const [sortField, setSortField] = useState('company_name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showFilters, setShowFilters] = useState(false);
    
    // Debounce ref
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const data = await customerService.getCustomers();
            if (data.results) {
                setCustomers(data.results);
            } else if (Array.isArray(data)) {
                setCustomers(data);
            } else {
                setCustomers([]);
            }
        } catch (err) {
            console.error(err);
            setError("Müşteriler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    // Filtered and sorted customers
    const filteredCustomers = useMemo(() => {
        let result = [...customers];
        
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c => 
                c.company_name?.toLowerCase().includes(query) ||
                c.contact_person?.toLowerCase().includes(query) ||
                c.email?.toLowerCase().includes(query) ||
                c.phone?.includes(query)
            );
        }
        
        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(c => c.status === statusFilter);
        }
        
        // Service filter
        if (serviceFilter === 'seo') {
            result = result.filter(c => c.has_seo_service);
        } else if (serviceFilter === 'hosting') {
            result = result.filter(c => c.has_hosting_service);
        } else if (serviceFilter === 'both') {
            result = result.filter(c => c.has_seo_service && c.has_hosting_service);
        }
        
        // Sort
        result.sort((a, b) => {
            let aVal = a[sortField] || '';
            let bVal = b[sortField] || '';
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            
            if (sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
        
        return result;
    }, [customers, searchQuery, statusFilter, serviceFilter, sortField, sortDirection]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setServiceFilter('all');
        setSortField('company_name');
        setSortDirection('asc');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || serviceFilter !== 'all';

    const handleDelete = async (id, companyName) => {
        if (window.confirm(`"${companyName}" müşterisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            try {
                await customerService.deleteCustomer(id);
                setCustomers(customers.filter(c => c.id !== id));
            } catch (err) {
                console.error(err);
                alert('Müşteri silinirken bir hata oluştu.');
            }
        }
    };

    // Stats
    const stats = useMemo(() => ({
        total: customers.length,
        active: customers.filter(c => c.status === 'active').length,
        inactive: customers.filter(c => c.status === 'inactive').length,
        withSeo: customers.filter(c => c.has_seo_service).length,
        withHosting: customers.filter(c => c.has_hosting_service).length,
    }), [customers]);

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? 
            <SortAscending size={14} className="ms-1" /> : 
            <SortDescending size={14} className="ms-1" />;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">Müşteriler yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold" style={{ color: '#0e1327' }}>Müşteriler</h2>
                    <p className="text-muted mb-0">Toplam {stats.total} müşteri · {stats.active} aktif</p>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" size="sm" onClick={fetchCustomers} disabled={loading}>
                        <Refresh size={16} className={loading ? 'spin' : ''} />
                    </Button>
                    <Link href="/dashboard/customers/new" passHref>
                        <Button variant="primary" className="d-flex align-items-center gap-2" 
                            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', border: 'none' }}>
                            <Plus size={18} />
                            Yeni Müşteri
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
                        <Card.Body className="text-white">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="mb-1 opacity-75 small">Toplam Müşteri</p>
                                    <h3 className="mb-0 fw-bold">{stats.total}</h3>
                                </div>
                                <div className="p-2 rounded-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                    <Users size={24} />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="mb-1 text-muted small">Aktif</p>
                                    <h3 className="mb-0 fw-bold text-success">{stats.active}</h3>
                                </div>
                                <div className="p-2 rounded-3 bg-success-subtle">
                                    <Building size={24} className="text-success" />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="mb-1 text-muted small">SEO Hizmeti</p>
                                    <h3 className="mb-0 fw-bold" style={{ color: '#2563eb' }}>{stats.withSeo}</h3>
                                </div>
                                <div className="p-2 rounded-3" style={{ background: 'rgba(37, 99, 235, 0.1)' }}>
                                    <World size={24} style={{ color: '#2563eb' }} />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="border-0 shadow-sm h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <p className="mb-1 text-muted small">Hosting Hizmeti</p>
                                    <h3 className="mb-0 fw-bold" style={{ color: '#0e1327' }}>{stats.withHosting}</h3>
                                </div>
                                <div className="p-2 rounded-3" style={{ background: 'rgba(14, 19, 39, 0.1)' }}>
                                    <Building size={24} style={{ color: '#0e1327' }} />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            {/* Filter Card */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="py-3">
                    <Row className="g-3 align-items-center">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <Search size={18} className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control 
                                    placeholder="Müşteri ara (isim, email, telefon)" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="border-start-0 ps-0"
                                    style={{ boxShadow: 'none' }}
                                />
                                {searchQuery && (
                                    <Button variant="link" className="text-muted" onClick={() => setSearchQuery('')}>
                                        <X size={18} />
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>
                        <Col md={2}>
                            <Form.Select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border"
                            >
                                <option value="all">Tüm Durumlar</option>
                                <option value="active">Aktif</option>
                                <option value="inactive">Pasif</option>
                                <option value="pending">Askıda</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Select 
                                value={serviceFilter} 
                                onChange={(e) => setServiceFilter(e.target.value)}
                                className="border"
                            >
                                <option value="all">Tüm Hizmetler</option>
                                <option value="seo">SEO Hizmeti</option>
                                <option value="hosting">Hosting Hizmeti</option>
                                <option value="both">Her İkisi</option>
                            </Form.Select>
                        </Col>
                        <Col md={4} className="text-end">
                            {hasActiveFilters && (
                                <Button variant="outline-secondary" size="sm" onClick={clearFilters} className="me-2">
                                    <X size={14} className="me-1" />
                                    Filtreleri Temizle
                                </Button>
                            )}
                            <span className="text-muted small">
                                {filteredCustomers.length} / {customers.length} sonuç
                            </span>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Table Card */}
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="mb-0 align-middle">
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th 
                                        className="border-0 py-3 px-4 cursor-pointer user-select-none"
                                        onClick={() => handleSort('company_name')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            Firma Adı
                                            <SortIcon field="company_name" />
                                        </div>
                                    </th>
                                    <th 
                                        className="border-0 py-3 cursor-pointer"
                                        onClick={() => handleSort('contact_person')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            Yetkili
                                            <SortIcon field="contact_person" />
                                        </div>
                                    </th>
                                    <th className="border-0 py-3">İletişim</th>
                                    <th 
                                        className="border-0 py-3 cursor-pointer"
                                        onClick={() => handleSort('status')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            Durum
                                            <SortIcon field="status" />
                                        </div>
                                    </th>
                                    <th className="border-0 py-3">Hizmetler</th>
                                    <th className="border-0 py-3 text-end pe-4">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-5">
                                            <div className="text-muted">
                                                <Users size={48} className="mb-3 opacity-25" />
                                                <p className="mb-0">
                                                    {hasActiveFilters 
                                                        ? 'Filtrelere uygun müşteri bulunamadı.' 
                                                        : 'Henüz kayıtlı müşteri yok.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <Button variant="link" onClick={clearFilters} className="p-0 mt-2">
                                                        Filtreleri temizle
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="border-bottom">
                                            <td className="py-3 px-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div 
                                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                                        style={{ 
                                                            width: 40, 
                                                            height: 40, 
                                                            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        {customer.company_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold" style={{ color: '#0e1327' }}>
                                                            {customer.company_name}
                                                        </div>
                                                        {customer.website && (
                                                            <small className="text-muted">
                                                                <World size={12} className="me-1" />
                                                                {customer.website}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className="fw-medium">{customer.contact_person || '-'}</span>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex flex-column gap-1">
                                                    {customer.email && (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Mail size={14} className="text-muted" />
                                                            <a href={`mailto:${customer.email}`} className="text-decoration-none small">
                                                                {customer.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Phone size={14} className="text-muted" />
                                                            <a href={`tel:${customer.phone}`} className="text-decoration-none text-muted small">
                                                                {customer.phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <Badge 
                                                    pill
                                                    bg={
                                                        customer.status === 'active' ? 'success' : 
                                                        customer.status === 'inactive' ? 'secondary' : 'warning'
                                                    }
                                                    className="px-3 py-2"
                                                >
                                                    {customer.status === 'active' ? 'Aktif' :
                                                     customer.status === 'inactive' ? 'Pasif' : 'Askıda'}
                                                </Badge>
                                            </td>
                                            <td className="py-3">
                                                <div className="d-flex gap-2">
                                                    {customer.has_seo_service && (
                                                        <Badge 
                                                            bg="primary" 
                                                            className="px-2 py-1"
                                                            style={{ background: '#2563eb' }}
                                                        >
                                                            SEO
                                                        </Badge>
                                                    )}
                                                    {customer.has_hosting_service && (
                                                        <Badge 
                                                            bg="dark" 
                                                            className="px-2 py-1"
                                                            style={{ background: '#0e1327' }}
                                                        >
                                                            Hosting
                                                        </Badge>
                                                    )}
                                                    {!customer.has_seo_service && !customer.has_hosting_service && (
                                                        <span className="text-muted small">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 text-end pe-4">
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>Görüntüle / Düzenle</Tooltip>}
                                                    >
                                                        <Link href={`/dashboard/customers/${customer.id}`} className="btn btn-sm btn-light">
                                                            <Eye size={16} />
                                                        </Link>
                                                    </OverlayTrigger>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>Sil</Tooltip>}
                                                    >
                                                        <Button 
                                                            variant="light" 
                                                            size="sm" 
                                                            className="text-danger"
                                                            onClick={() => handleDelete(customer.id, customer.company_name)}
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
                                                    </OverlayTrigger>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Custom styles */}
            <style jsx global>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .cursor-pointer {
                    cursor: pointer !important;
                }
                .bg-success-subtle {
                    background-color: rgba(0, 214, 127, 0.1) !important;
                }
            `}</style>
        </Container>
    );
};

export default CustomersPage;
