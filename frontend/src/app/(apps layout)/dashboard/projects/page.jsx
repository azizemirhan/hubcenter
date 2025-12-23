'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, InputGroup, ProgressBar, Dropdown } from 'react-bootstrap';
import { projectService } from '@/services/projectService';
import { customerService } from '@/services/customerService';
import Link from 'next/link';
import { 
    Folder, Plus, Calendar, CurrencyLira, User, Building, Clock,
    ChartBar, Filter, Search, LayoutGrid, List, DotsVertical,
    Edit, Trash, Eye, CalendarEvent, Target, TrendingUp, Refresh
} from 'tabler-icons-react';

const STATUS_CONFIG = {
    planning: { label: 'Planlama', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
    in_progress: { label: 'Devam Ediyor', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' },
    on_hold: { label: 'Beklemede', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    completed: { label: 'Tamamlandı', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    cancelled: { label: 'İptal', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
};

const ProjectsPage = () => {
    const [projects, setProjects] = useState([]);
    const [summary, setSummary] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '', description: '', customer: '', status: 'planning',
        start_date: '', deadline: '', budget: '', hourly_rate: '',
        is_billable: true, priority: 'medium'
    });
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [projectsData, summaryData, customersData] = await Promise.all([
                projectService.getProjects(),
                projectService.getProjectsSummary(),
                customerService.getCustomers()
            ]);
            
            const projectsList = projectsData.results || projectsData;
            const customersList = customersData.results || customersData;
            
            setProjects(projectsList);
            setSummary(summaryData);
            setCustomers(customersList);
        } catch (err) {
            console.error(err);
            setError("Projeler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...formData,
                customer: formData.customer || null,
                budget: formData.budget || null,
                hourly_rate: formData.hourly_rate || null
            };
            await projectService.createProject(payload);
            setShowModal(false);
            setFormData({ name: '', description: '', customer: '', status: 'planning', start_date: '', deadline: '', budget: '', hourly_rate: '', is_billable: true, priority: 'medium' });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (projectId, newStatus) => {
        try {
            await projectService.updateProjectStatus(projectId, newStatus);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    // Calculate progress based on dates
    const calculateProgress = (project) => {
        if (project.status === 'completed') return 100;
        if (project.status === 'cancelled') return 0;
        if (!project.start_date || !project.deadline) return 0;
        
        const start = new Date(project.start_date);
        const end = new Date(project.deadline);
        const now = new Date();
        
        if (now <= start) return 0;
        if (now >= end) return 100;
        
        const total = end - start;
        const elapsed = now - start;
        return Math.round((elapsed / total) * 100);
    };

    // Days until deadline
    const getDaysUntilDeadline = (deadline) => {
        if (!deadline) return null;
        const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    // Filter projects
    const filteredProjects = projects.filter(p => {
        const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.customer_name && p.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Stats
    const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">Projeler yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-3">
            {/* Header */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h4 className="mb-1 fw-bold d-flex align-items-center gap-2" style={{ color: '#0e1327' }}>
                                <Folder size={24} style={{ color: '#2563eb' }} />
                                Projeler
                            </h4>
                            <div className="d-flex gap-3 flex-wrap">
                                <span className="text-muted small">
                                    <ChartBar size={14} className="me-1" />
                                    Toplam: <strong>{projects.length}</strong> proje
                                </span>
                                <span className="text-muted small">
                                    <TrendingUp size={14} className="me-1" />
                                    Devam Eden: <strong className="text-primary">{summary.in_progress || 0}</strong>
                                </span>
                                <span className="text-muted small">
                                    <CurrencyLira size={14} className="me-1" />
                                    Toplam Bütçe: <strong className="text-success">₺{totalBudget.toLocaleString('tr-TR')}</strong>
                                </span>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" size="sm" onClick={fetchData}>
                                <Refresh size={16} />
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => setShowModal(true)}
                                className="d-flex align-items-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', border: 'none' }}
                            >
                                <Plus size={18} />
                                Yeni Proje
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <Col xs={6} md={4} lg key={key}>
                        <Card 
                            className="border-0 shadow-sm h-100 cursor-pointer"
                            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
                            style={{ 
                                border: filterStatus === key ? `2px solid ${cfg.color}` : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Card.Body className="py-3 text-center">
                                <div 
                                    className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle"
                                    style={{ width: 40, height: 40, backgroundColor: cfg.bgColor }}
                                >
                                    <span style={{ color: cfg.color, fontWeight: 'bold' }}>{summary[key] || 0}</span>
                                </div>
                                <small className="text-muted">{cfg.label}</small>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Filters & View Toggle */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex gap-2 flex-grow-1" style={{ maxWidth: '400px' }}>
                            <InputGroup size="sm">
                                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                                <Form.Control 
                                    type="text" 
                                    placeholder="Proje veya müşteri ara..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>
                        <div className="d-flex gap-2">
                            <Form.Select 
                                size="sm" 
                                style={{ width: 'auto' }}
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">Tüm Durumlar</option>
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </Form.Select>
                            <div className="btn-group">
                                <Button 
                                    variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'} 
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                >
                                    <LayoutGrid size={16} />
                                </Button>
                                <Button 
                                    variant={viewMode === 'list' ? 'primary' : 'outline-secondary'} 
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List size={16} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            {/* Projects Grid/List */}
            {filteredProjects.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <Card.Body className="text-center py-5">
                        <Folder size={48} className="text-muted mb-3" />
                        <h5>Proje Bulunamadı</h5>
                        <p className="text-muted mb-3">Aramanızla eşleşen proje yok.</p>
                        <Button variant="primary" onClick={() => { setFilterStatus('all'); setSearchTerm(''); }}>
                            Filtreleri Temizle
                        </Button>
                    </Card.Body>
                </Card>
            ) : viewMode === 'grid' ? (
                <Row className="g-3">
                    {filteredProjects.map((project) => {
                        const progress = calculateProgress(project);
                        const daysUntil = getDaysUntilDeadline(project.deadline);
                        const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
                        
                        return (
                            <Col key={project.id} xs={12} sm={6} lg={4} xl={3}>
                                <Card className="border-0 shadow-sm h-100 project-card" style={{ transition: 'all 0.2s ease' }}>
                                    {/* Card Header */}
                                    <div 
                                        className="px-3 py-2 d-flex justify-content-between align-items-center"
                                        style={{ backgroundColor: statusCfg.bgColor, borderRadius: '8px 8px 0 0' }}
                                    >
                                        <Badge 
                                            style={{ backgroundColor: statusCfg.color, border: 'none' }}
                                        >
                                            {statusCfg.label}
                                        </Badge>
                                        <Dropdown>
                                            <Dropdown.Toggle variant="link" size="sm" className="p-0 text-muted">
                                                <DotsVertical size={16} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu align="end">
                                                <Dropdown.Item as={Link} href={`/dashboard/projects/${project.id}`}>
                                                    <Eye size={14} className="me-2" /> Detay
                                                </Dropdown.Item>
                                                <Dropdown.Item href="#">
                                                    <Edit size={14} className="me-2" /> Düzenle
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item className="text-danger">
                                                    <Trash size={14} className="me-2" /> Sil
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                    
                                    <Card.Body className="p-3">
                                        {/* Project Name */}
                                        <h6 className="fw-bold mb-2" style={{ color: '#0e1327' }}>
                                            <Link href={`/dashboard/projects/${project.id}`} className="text-decoration-none text-dark">
                                                {project.name}
                                            </Link>
                                        </h6>
                                        
                                        {/* Customer */}
                                        {project.customer_name && (
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <Building size={14} className="text-muted" />
                                                <span className="small text-muted">{project.customer_name}</span>
                                            </div>
                                        )}
                                        
                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <small className="text-muted">İlerleme</small>
                                                <small className="fw-bold">{progress}%</small>
                                            </div>
                                            <ProgressBar 
                                                now={progress} 
                                                style={{ height: '6px' }}
                                                variant={progress === 100 ? 'success' : progress > 50 ? 'primary' : 'info'}
                                            />
                                        </div>
                                        
                                        {/* Dates */}
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            {project.start_date && (
                                                <div className="d-flex align-items-center gap-1">
                                                    <Calendar size={12} className="text-muted" />
                                                    <small className="text-muted">{new Date(project.start_date).toLocaleDateString('tr-TR')}</small>
                                                </div>
                                            )}
                                            {project.deadline && (
                                                <div className="d-flex align-items-center gap-1">
                                                    <Target size={12} className={daysUntil !== null && daysUntil < 7 ? 'text-danger' : 'text-muted'} />
                                                    <small className={daysUntil !== null && daysUntil < 7 ? 'text-danger fw-bold' : 'text-muted'}>
                                                        {new Date(project.deadline).toLocaleDateString('tr-TR')}
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Deadline Warning */}
                                        {daysUntil !== null && daysUntil >= 0 && daysUntil < 14 && project.status !== 'completed' && (
                                            <Badge 
                                                bg={daysUntil < 3 ? 'danger' : daysUntil < 7 ? 'warning' : 'info'} 
                                                className="w-100 mb-2"
                                            >
                                                <Clock size={12} className="me-1" />
                                                {daysUntil === 0 ? 'Bugün!' : `${daysUntil} gün kaldı`}
                                            </Badge>
                                        )}
                                    </Card.Body>
                                    
                                    {/* Card Footer */}
                                    <Card.Footer className="bg-white border-top py-2 px-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            {project.budget && (
                                                <span className="fw-bold text-success small">
                                                    <CurrencyLira size={14} />
                                                    {parseFloat(project.budget).toLocaleString('tr-TR')}
                                                </span>
                                            )}
                                            {project.is_billable && (
                                                <Badge bg="light" text="dark" className="small">
                                                    Faturalanabilir
                                                </Badge>
                                            )}
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            ) : (
                /* List View */
                <Card className="border-0 shadow-sm">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Proje</th>
                                    <th>Müşteri</th>
                                    <th>Durum</th>
                                    <th>İlerleme</th>
                                    <th>Tarihler</th>
                                    <th>Bütçe</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.map((project) => {
                                    const progress = calculateProgress(project);
                                    const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
                                    
                                    return (
                                        <tr key={project.id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div 
                                                        className="rounded d-flex align-items-center justify-content-center"
                                                        style={{ width: 36, height: 36, backgroundColor: statusCfg.bgColor }}
                                                    >
                                                        <Folder size={18} style={{ color: statusCfg.color }} />
                                                    </div>
                                                    <div>
                                                        <Link href={`/dashboard/projects/${project.id}`} className="fw-bold text-decoration-none text-dark">
                                                            {project.name}
                                                        </Link>
                                                        {project.is_billable && (
                                                            <Badge bg="light" text="muted" className="ms-2 small">₺</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted">{project.customer_name || '-'}</td>
                                            <td>
                                                <Form.Select 
                                                    size="sm" 
                                                    value={project.status}
                                                    onChange={(e) => handleStatusChange(project.id, e.target.value)}
                                                    style={{ width: 'auto', backgroundColor: statusCfg.bgColor, color: statusCfg.color, fontWeight: 500 }}
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                        <option key={key} value={key}>{cfg.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td style={{ minWidth: 120 }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <ProgressBar now={progress} style={{ height: 6, flex: 1 }} />
                                                    <small className="text-muted">{progress}%</small>
                                                </div>
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {project.start_date && new Date(project.start_date).toLocaleDateString('tr-TR')}
                                                    {project.start_date && project.deadline && ' → '}
                                                    {project.deadline && new Date(project.deadline).toLocaleDateString('tr-TR')}
                                                </small>
                                            </td>
                                            <td>
                                                {project.budget && (
                                                    <span className="fw-bold text-success">
                                                        ₺{parseFloat(project.budget).toLocaleString('tr-TR')}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <Link href={`/dashboard/projects/${project.id}`} className="btn btn-sm btn-outline-primary">
                                                    <Eye size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* New Project Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
                    <Modal.Title className="text-white">
                        <Plus size={20} className="me-2" />
                        Yeni Proje Oluştur
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateProject}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Proje Adı <span className="text-danger">*</span></Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Folder size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Proje adı girin"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Müşteri</Form.Label>
                                    <Form.Select 
                                        value={formData.customer}
                                        onChange={e => setFormData({...formData, customer: e.target.value})}
                                    >
                                        <option value="">Seçiniz...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.company_name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Proje Açıklaması</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3}
                                        placeholder="Proje hakkında detaylı açıklama..."
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            
                            <Col md={12}><hr className="my-1" /></Col>
                            
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Başlangıç Tarihi</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Calendar size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="date" 
                                            value={formData.start_date}
                                            onChange={e => setFormData({...formData, start_date: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Target size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="date" 
                                            value={formData.deadline}
                                            onChange={e => setFormData({...formData, deadline: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Durum</Form.Label>
                                    <Form.Select 
                                        value={formData.status}
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            
                            <Col md={12}><hr className="my-1" /></Col>
                            
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Bütçe (₺)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><CurrencyLira size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="number" 
                                            placeholder="50000"
                                            value={formData.budget}
                                            onChange={e => setFormData({...formData, budget: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Saatlik Ücret (₺)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Clock size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="number" 
                                            placeholder="500"
                                            value={formData.hourly_rate}
                                            onChange={e => setFormData({...formData, hourly_rate: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={4} className="d-flex align-items-end">
                                <Form.Check 
                                    type="switch"
                                    id="billable-switch"
                                    label="Faturalanabilir Proje"
                                    checked={formData.is_billable}
                                    onChange={e => setFormData({...formData, is_billable: e.target.checked})}
                                    className="mb-2"
                                />
                            </Col>
                        </Row>
                    </Modal.Body>
                    <Modal.Footer className="bg-light">
                        <Button variant="secondary" onClick={() => setShowModal(false)}>İptal</Button>
                        <Button 
                            variant="primary" 
                            type="submit" 
                            disabled={saving}
                            style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', border: 'none' }}
                        >
                            {saving ? <Spinner size="sm" className="me-2" /> : <Plus size={16} className="me-2" />}
                            Proje Oluştur
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Custom Styles */}
            <style jsx global>{`
                .project-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}</style>
        </Container>
    );
};

export default ProjectsPage;
