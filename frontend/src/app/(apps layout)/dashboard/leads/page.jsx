'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { leadService } from '@/services/leadService';
import { 
    Plus, Phone, Mail, CurrencyLira, Calendar, User, Building, 
    GripVertical, Clock, Target, TrendingUp, Refresh
} from 'tabler-icons-react';

const STATUS_CONFIG = [
    { key: 'new', label: 'Yeni', color: '#2563eb' },
    { key: 'contacted', label: 'İletişime Geçildi', color: '#0891b2' },
    { key: 'meeting_scheduled', label: 'Toplantı Planlandı', color: '#d97706' },
    { key: 'proposal_sent', label: 'Teklif Gönderildi', color: '#7c3aed' },
    { key: 'negotiation', label: 'Pazarlık', color: '#0e1327' },
    { key: 'won', label: 'Kazanıldı', color: '#059669' },
    { key: 'lost', label: 'Kaybedildi', color: '#dc2626' }
];

const SOURCE_LABELS = {
    website: 'Website', whatsapp: 'WhatsApp', referral: 'Referans',
    social_media: 'Sosyal Medya', google_ads: 'Google Ads', other: 'Diğer'
};

const LeadsPage = () => {
    const [leads, setLeads] = useState({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '', contact_person: '', email: '', phone: '', 
        source: 'website', expected_value: '', notes: '', next_action: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchLeads = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await leadService.getLeadsKanban();
            // Ensure all status keys exist
            const normalizedData = {};
            STATUS_CONFIG.forEach(s => {
                normalizedData[s.key] = data[s.key] || [];
            });
            setLeads(normalizedData);
        } catch (err) {
            console.error(err);
            setError("Lead'ler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeads();
    }, [fetchLeads]);

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        // No destination or same position
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const leadId = parseInt(draggableId.replace('lead-', ''));
        const newStatus = destination.droppableId;
        const oldStatus = source.droppableId;

        // Deep clone the leads
        const newLeads = JSON.parse(JSON.stringify(leads));
        
        // Find and remove from source
        const sourceLeads = newLeads[oldStatus] || [];
        const leadIndex = sourceLeads.findIndex(l => l.id === leadId);
        if (leadIndex === -1) return;
        
        const [movedLead] = sourceLeads.splice(leadIndex, 1);
        movedLead.status = newStatus;
        
        // Add to destination
        const destLeads = newLeads[newStatus] || [];
        destLeads.splice(destination.index, 0, movedLead);
        newLeads[newStatus] = destLeads;
        newLeads[oldStatus] = sourceLeads;
        
        // Update UI immediately (optimistic)
        setLeads(newLeads);
        setUpdating(true);

        try {
            await leadService.updateLeadStatus(leadId, newStatus);
        } catch (err) {
            console.error('Status update failed:', err);
            // Revert on error
            fetchLeads();
        } finally {
            setUpdating(false);
        }
    };

    const handleCreateLead = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await leadService.createLead(formData);
            setShowModal(false);
            setFormData({ company_name: '', contact_person: '', email: '', phone: '', source: 'website', expected_value: '', notes: '', next_action: '' });
            fetchLeads();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Calculate totals
    const allLeads = Object.values(leads).flat();
    const stats = {
        total: allLeads.length,
        totalValue: allLeads.reduce((sum, l) => sum + (parseFloat(l.expected_value) || 0), 0),
        wonValue: (leads.won || []).reduce((sum, l) => sum + (parseFloat(l.expected_value) || 0), 0),
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted">Lead'ler yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-3">
            {/* Header */}
            <Card className="border-0 shadow-sm mb-3">
                <Card.Body className="py-3">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h4 className="mb-1 fw-bold d-flex align-items-center gap-2" style={{ color: '#0e1327' }}>
                                <Target size={24} style={{ color: '#2563eb' }} />
                                Potansiyel Müşteriler
                                {updating && <Spinner animation="border" size="sm" variant="primary" className="ms-2" />}
                            </h4>
                            <div className="d-flex gap-3 flex-wrap">
                                <span className="text-muted small">
                                    <TrendingUp size={14} className="me-1" />
                                    Toplam: <strong>{stats.total}</strong> lead
                                </span>
                                <span className="text-muted small">
                                    <CurrencyLira size={14} className="me-1" />
                                    Potansiyel: <strong className="text-primary">₺{stats.totalValue.toLocaleString('tr-TR')}</strong>
                                </span>
                                <span className="text-muted small">
                                    Kazanılan: <strong className="text-success">₺{stats.wonValue.toLocaleString('tr-TR')}</strong>
                                </span>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" size="sm" onClick={fetchLeads} disabled={loading}>
                                <Refresh size={16} />
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={() => setShowModal(true)}
                                className="d-flex align-items-center gap-2"
                                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', border: 'none' }}
                            >
                                <Plus size={18} />
                                Yeni Lead
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            {/* Kanban Board - Responsive Grid */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Row className="g-2">
                    {STATUS_CONFIG.map(({ key: statusKey, label, color }) => (
                        <Col key={statusKey} xs={12} sm={6} lg={4} xl className="mb-2">
                            <Droppable droppableId={statusKey}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="h-100"
                                        style={{ 
                                            backgroundColor: snapshot.isDraggingOver ? `${color}15` : '#f8fafc',
                                            borderRadius: '12px',
                                            border: snapshot.isDraggingOver ? `2px dashed ${color}` : '1px solid #e5e7eb',
                                            transition: 'all 0.2s ease',
                                            minHeight: '300px'
                                        }}
                                    >
                                        {/* Column Header */}
                                        <div 
                                            className="px-3 py-2 d-flex justify-content-between align-items-center"
                                            style={{ 
                                                background: color,
                                                borderRadius: '12px 12px 0 0'
                                            }}
                                        >
                                            <span className="fw-semibold text-white small">{label}</span>
                                            <Badge bg="light" text="dark" className="rounded-pill">
                                                {(leads[statusKey] || []).length}
                                            </Badge>
                                        </div>
                                        
                                        {/* Column Value */}
                                        {(leads[statusKey] || []).length > 0 && (
                                            <div className="px-3 py-1 bg-white border-bottom">
                                                <small className="text-muted">
                                                    <CurrencyLira size={12} className="me-1" />
                                                    ₺{(leads[statusKey] || []).reduce((s, l) => s + (parseFloat(l.expected_value) || 0), 0).toLocaleString('tr-TR')}
                                                </small>
                                            </div>
                                        )}

                                        {/* Cards */}
                                        <div className="p-2" style={{ minHeight: '250px' }}>
                                            {(leads[statusKey] || []).map((lead, index) => (
                                                <Draggable 
                                                    key={`lead-${lead.id}`} 
                                                    draggableId={`lead-${lead.id}`} 
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="mb-2"
                                                            style={{
                                                                ...provided.draggableProps.style,
                                                                backgroundColor: 'white',
                                                                borderRadius: '8px',
                                                                boxShadow: snapshot.isDragging 
                                                                    ? '0 8px 20px rgba(0,0,0,0.2)' 
                                                                    : '0 1px 3px rgba(0,0,0,0.08)',
                                                                border: snapshot.isDragging 
                                                                    ? `2px solid ${color}` 
                                                                    : '1px solid #e5e7eb',
                                                                cursor: 'grab'
                                                            }}
                                                        >
                                                            {/* Card Header */}
                                                            <div 
                                                                className="px-2 py-1 d-flex align-items-center gap-1 border-bottom"
                                                                style={{ backgroundColor: `${color}10`, borderRadius: '8px 8px 0 0' }}
                                                            >
                                                                <GripVertical size={12} className="text-muted" />
                                                                <span className="small text-muted">#{lead.id}</span>
                                                                {lead.next_contact_date && (
                                                                    <Badge bg="warning" text="dark" className="ms-auto" style={{ fontSize: '10px' }}>
                                                                        <Clock size={10} /> {new Date(lead.next_contact_date).toLocaleDateString('tr-TR')}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Card Body */}
                                                            <div className="p-2">
                                                                <h6 className="mb-1 fw-bold small" style={{ color: '#0e1327', fontSize: '0.85rem' }}>
                                                                    {lead.company_name}
                                                                </h6>
                                                                
                                                                <div className="mb-2">
                                                                    <div className="d-flex align-items-center gap-1 mb-1">
                                                                        <User size={12} className="text-muted" />
                                                                        <span className="small text-truncate" style={{ fontSize: '0.75rem' }}>{lead.contact_person}</span>
                                                                    </div>
                                                                    {lead.phone && (
                                                                        <div className="d-flex align-items-center gap-1">
                                                                            <Phone size={12} className="text-muted" />
                                                                            <a href={`tel:${lead.phone}`} className="small text-decoration-none" style={{ fontSize: '0.75rem' }}>
                                                                                {lead.phone}
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="d-flex justify-content-between align-items-center pt-1 border-top">
                                                                    <Badge bg="light" text="dark" style={{ fontSize: '10px' }}>
                                                                        {SOURCE_LABELS[lead.source] || lead.source}
                                                                    </Badge>
                                                                    {lead.expected_value && (
                                                                        <span className="fw-bold small" style={{ color: '#059669', fontSize: '0.75rem' }}>
                                                                            ₺{parseFloat(lead.expected_value).toLocaleString('tr-TR')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            
                                            {(leads[statusKey] || []).length === 0 && (
                                                <div className="text-center text-muted py-4">
                                                    <Target size={24} className="mb-2 opacity-25" />
                                                    <p className="small mb-0">Boş</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        </Col>
                    ))}
                </Row>
            </DragDropContext>

            {/* New Lead Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
                    <Modal.Title className="text-white">
                        <Plus size={20} className="me-2" />
                        Yeni Potansiyel Müşteri
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateLead}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Firma Adı <span className="text-danger">*</span></Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Building size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Şirket adı"
                                            value={formData.company_name}
                                            onChange={e => setFormData({...formData, company_name: e.target.value})}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Yetkili Kişi <span className="text-danger">*</span></Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><User size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Ad Soyad"
                                            value={formData.contact_person}
                                            onChange={e => setFormData({...formData, contact_person: e.target.value})}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Mail size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="email" 
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Telefon <span className="text-danger">*</span></Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><Phone size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="tel" 
                                            placeholder="05XX XXX XX XX"
                                            value={formData.phone}
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Kaynak</Form.Label>
                                    <Form.Select 
                                        value={formData.source}
                                        onChange={e => setFormData({...formData, source: e.target.value})}
                                    >
                                        <option value="website">Website</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="referral">Referans</option>
                                        <option value="social_media">Sosyal Medya</option>
                                        <option value="google_ads">Google Ads</option>
                                        <option value="other">Diğer</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tahmini Değer (₺)</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text><CurrencyLira size={16} /></InputGroup.Text>
                                        <Form.Control 
                                            type="number" 
                                            placeholder="50000"
                                            value={formData.expected_value}
                                            onChange={e => setFormData({...formData, expected_value: e.target.value})}
                                        />
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Sonraki Aksiyon</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Örn: Teklif hazırla, Toplantı ayarla..."
                                        value={formData.next_action}
                                        onChange={e => setFormData({...formData, next_action: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Notlar</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={2} 
                                        placeholder="Lead hakkında notlar..."
                                        value={formData.notes}
                                        onChange={e => setFormData({...formData, notes: e.target.value})}
                                    />
                                </Form.Group>
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
                            Lead Ekle
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </Container>
    );
};

export default LeadsPage;
