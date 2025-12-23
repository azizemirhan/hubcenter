'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, InputGroup, ProgressBar, Tab, Nav } from 'react-bootstrap';
import { projectService } from '@/services/projectService';
import { customerService } from '@/services/customerService';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
    Folder, Calendar, CurrencyLira, User, Building, Clock, ArrowLeft,
    Edit, Trash, Check, X, Target, ChartBar, ListCheck, Notes, FileText
} from 'tabler-icons-react';

const STATUS_CONFIG = {
    planning: { label: 'Planlama', color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.1)' },
    in_progress: { label: 'Devam Ediyor', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' },
    on_hold: { label: 'Beklemede', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    completed: { label: 'Tamamlandı', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    cancelled: { label: 'İptal', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' }
};

const ProjectDetailPage = () => {
    const router = useRouter();
    const params = useParams();
    const projectId = params.id;

    const [project, setProject] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [projectData, customersData] = await Promise.all([
                projectService.getProject(projectId),
                customerService.getCustomers()
            ]);
            setProject(projectData);
            setFormData({
                name: projectData.name || '',
                description: projectData.description || '',
                customer: projectData.customer || '',
                status: projectData.status || 'planning',
                start_date: projectData.start_date || '',
                deadline: projectData.deadline || '',
                budget: projectData.budget || '',
                hourly_rate: projectData.hourly_rate || '',
                is_billable: projectData.is_billable || false
            });
            setCustomers(customersData.results || customersData);
        } catch (err) {
            console.error(err);
            setError("Proje bilgileri yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId, fetchData]);

    const handleSave = async () => {
        try {
            setSaving(true);
            await projectService.updateProject(projectId, {
                ...formData,
                customer: formData.customer || null,
                budget: formData.budget || null,
                hourly_rate: formData.hourly_rate || null
            });
            await fetchData();
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            setError("Proje güncellenirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await projectService.deleteProject(projectId);
            router.push('/dashboard/projects');
        } catch (err) {
            console.error(err);
            setError("Proje silinirken bir hata oluştu.");
        } finally {
            setDeleting(false);
        }
    };

    const calculateProgress = () => {
        if (!project) return 0;
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

    const getDaysUntilDeadline = () => {
        if (!project?.deadline) return null;
        return Math.ceil((new Date(project.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">Proje yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <Container fluid className="py-4">
                <Alert variant="danger">Proje bulunamadı.</Alert>
                <Link href="/dashboard/projects">
                    <Button variant="outline-secondary">
                        <ArrowLeft size={16} className="me-2" />
                        Projelere Dön
                    </Button>
                </Link>
            </Container>
        );
    }

    const statusCfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.planning;
    const progress = calculateProgress();
    const daysUntil = getDaysUntilDeadline();

    return (
        <Container fluid className="py-3">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                <div>
                    <Link href="/dashboard/projects" className="text-muted text-decoration-none d-flex align-items-center gap-1 mb-2 small">
                        <ArrowLeft size={14} />
                        Projelere Dön
                    </Link>
                    <div className="d-flex align-items-center gap-3">
                        <div 
                            className="rounded d-flex align-items-center justify-content-center"
                            style={{ width: 48, height: 48, backgroundColor: statusCfg.bgColor }}
                        >
                            <Folder size={24} style={{ color: statusCfg.color }} />
                        </div>
                        <div>
                            <h4 className="mb-1 fw-bold" style={{ color: '#0e1327' }}>
                                {project.name}
                            </h4>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <Badge style={{ backgroundColor: statusCfg.color }}>{statusCfg.label}</Badge>
                                {project.is_billable && <Badge bg="success">Faturalanabilir</Badge>}
                                {project.customer_name && (
                                    <span className="text-muted small">
                                        <Building size={12} className="me-1" />
                                        {project.customer_name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline-secondary" onClick={() => { setIsEditing(false); fetchData(); }} disabled={saving}>
                                <X size={16} className="me-1" /> İptal
                            </Button>
                            <Button 
                                variant="success" 
                                onClick={handleSave} 
                                disabled={saving}
                                className="d-flex align-items-center gap-2"
                            >
                                {saving ? <Spinner size="sm" /> : <Check size={16} />}
                                Kaydet
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                                <Edit size={16} className="me-1" /> Düzenle
                            </Button>
                            <Button variant="outline-danger" onClick={() => setShowDeleteModal(true)}>
                                <Trash size={16} />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <Row className="g-3">
                {/* Main Content */}
                <Col lg={8}>
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Body>
                            {isEditing ? (
                                <Form>
                                    <Row className="g-3">
                                        <Col md={8}>
                                            <Form.Group>
                                                <Form.Label>Proje Adı</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    value={formData.name}
                                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                                />
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
                                                <Form.Label>Açıklama</Form.Label>
                                                <Form.Control 
                                                    as="textarea" 
                                                    rows={4}
                                                    value={formData.description}
                                                    onChange={e => setFormData({...formData, description: e.target.value})}
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
                                                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                        <option key={key} value={key}>{cfg.label}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Başlangıç Tarihi</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={formData.start_date}
                                                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Bitiş Tarihi</Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    value={formData.deadline}
                                                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Bütçe (₺)</Form.Label>
                                                <Form.Control 
                                                    type="number" 
                                                    value={formData.budget}
                                                    onChange={e => setFormData({...formData, budget: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Saatlik Ücret (₺)</Form.Label>
                                                <Form.Control 
                                                    type="number" 
                                                    value={formData.hourly_rate}
                                                    onChange={e => setFormData({...formData, hourly_rate: e.target.value})}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="d-flex align-items-end">
                                            <Form.Check 
                                                type="switch"
                                                id="billable-switch"
                                                label="Faturalanabilir"
                                                checked={formData.is_billable}
                                                onChange={e => setFormData({...formData, is_billable: e.target.checked})}
                                            />
                                        </Col>
                                    </Row>
                                </Form>
                            ) : (
                                <>
                                    <h6 className="text-muted mb-3 d-flex align-items-center gap-2">
                                        <Notes size={16} />
                                        Proje Açıklaması
                                    </h6>
                                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                        {project.description || <span className="text-muted">Açıklama eklenmemiş.</span>}
                                    </p>
                                </>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Tasks Section Placeholder */}
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 d-flex align-items-center gap-2">
                                <ListCheck size={18} />
                                Görevler
                            </h6>
                            <Link href={`/dashboard/tasks?project=${projectId}`}>
                                <Button variant="outline-primary" size="sm">
                                    Görevleri Görüntüle
                                </Button>
                            </Link>
                        </Card.Header>
                        <Card.Body className="text-center py-4 text-muted">
                            <ListCheck size={32} className="mb-2 opacity-25" />
                            <p className="mb-0">Görevler için Görevler sayfasını ziyaret edin</p>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Sidebar */}
                <Col lg={4}>
                    {/* Progress Card */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0 d-flex align-items-center gap-2">
                                <ChartBar size={18} />
                                İlerleme
                            </h6>
                        </Card.Header>
                        <Card.Body>
                            <div className="text-center mb-3">
                                <div 
                                    className="mx-auto mb-2 d-flex align-items-center justify-content-center rounded-circle"
                                    style={{ 
                                        width: 80, 
                                        height: 80, 
                                        backgroundColor: statusCfg.bgColor,
                                        border: `3px solid ${statusCfg.color}`
                                    }}
                                >
                                    <span className="h4 mb-0 fw-bold" style={{ color: statusCfg.color }}>{progress}%</span>
                                </div>
                            </div>
                            <ProgressBar 
                                now={progress} 
                                style={{ height: 10 }}
                                variant={progress === 100 ? 'success' : progress > 50 ? 'primary' : 'info'}
                            />
                            
                            {daysUntil !== null && project.status !== 'completed' && (
                                <div className="mt-3 text-center">
                                    {daysUntil < 0 ? (
                                        <Badge bg="danger" className="px-3 py-2">
                                            <Clock size={14} className="me-1" />
                                            {Math.abs(daysUntil)} gün gecikti!
                                        </Badge>
                                    ) : daysUntil === 0 ? (
                                        <Badge bg="warning" className="px-3 py-2">
                                            <Clock size={14} className="me-1" />
                                            Bugün bitiyor!
                                        </Badge>
                                    ) : (
                                        <Badge bg={daysUntil < 7 ? 'warning' : 'info'} className="px-3 py-2">
                                            <Clock size={14} className="me-1" />
                                            {daysUntil} gün kaldı
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Details Card */}
                    <Card className="border-0 shadow-sm mb-3">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0">Proje Detayları</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="list-group list-group-flush">
                                <div className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted"><Calendar size={14} className="me-2" />Başlangıç</span>
                                    <strong>{project.start_date ? new Date(project.start_date).toLocaleDateString('tr-TR') : '-'}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted"><Target size={14} className="me-2" />Bitiş</span>
                                    <strong>{project.deadline ? new Date(project.deadline).toLocaleDateString('tr-TR') : '-'}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted"><CurrencyLira size={14} className="me-2" />Bütçe</span>
                                    <strong className="text-success">
                                        {project.budget ? `₺${parseFloat(project.budget).toLocaleString('tr-TR')}` : '-'}
                                    </strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted"><Clock size={14} className="me-2" />Saatlik Ücret</span>
                                    <strong>
                                        {project.hourly_rate ? `₺${parseFloat(project.hourly_rate).toLocaleString('tr-TR')}/saat` : '-'}
                                    </strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted"><User size={14} className="me-2" />Yönetici</span>
                                    <strong>{project.manager_name || '-'}</strong>
                                </div>
                                <div className="list-group-item d-flex justify-content-between">
                                    <span className="text-muted"><FileText size={14} className="me-2" />Oluşturulma</span>
                                    <strong>{new Date(project.created_at).toLocaleDateString('tr-TR')}</strong>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Projeyi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>{project.name}</strong> projesini silmek istediğinize emin misiniz?</p>
                    <Alert variant="warning" className="mb-0">
                        Bu işlem geri alınamaz. Projeye bağlı tüm görevler de silinecektir.
                    </Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>İptal</Button>
                    <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Spinner size="sm" className="me-2" /> : <Trash size={16} className="me-2" />}
                        Evet, Sil
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ProjectDetailPage;
