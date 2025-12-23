'use client'
import React, { useEffect, useState, useCallback } from 'react';
import { Container, Card, Badge, Spinner, Alert, Button, Modal, Form, Row, Col, InputGroup, Nav, Offcanvas, Tab, Dropdown } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskService } from '@/services/taskService';
import { projectService } from '@/services/projectService';
import SimpleBar from 'simplebar-react';
import { 
    Plus, Calendar, User, Folder, Clock, Star, GripVertical,
    ListCheck, Search, X, Check, Edit, Trash, Link as LinkIcon,
    DotsVertical, CircleCheck, Hourglass, Eye, Flag, Tag,
    Refresh, CalendarEvent, FileText, Message, Activity, ClipboardList
} from 'tabler-icons-react';

const STATUS_CONFIG = {
    backlog: { label: 'Backlog', color: '#6b7280', bgColor: 'rgba(107, 114, 128, 0.1)' },
    todo: { label: 'Yapılacak', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    in_progress: { label: 'Devam Ediyor', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    review: { label: 'İncelemede', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
    completed: { label: 'Tamamlandı', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' }
};

const PRIORITY_CONFIG = {
    urgent: { label: 'Acil', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)' },
    high: { label: 'Yüksek', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
    medium: { label: 'Orta', color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.1)' },
    low: { label: 'Düşük', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.1)' }
};

const DATE_FILTERS = [
    { value: 'all', label: 'Tüm Zamanlar' },
    { value: 'today', label: 'Bugün' },
    { value: 'week', label: 'Bu Hafta' },
    { value: 'month', label: 'Bu Ay' },
    { value: 'overdue', label: 'Gecikmiş' }
];

const TasksPage = () => {
    const [tasks, setTasks] = useState({});
    const [allTasks, setAllTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetail, setShowTaskDetail] = useState(false);
    
    // Filters
    const [filterProject, setFilterProject] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterDate, setFilterDate] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form
    const [formData, setFormData] = useState({
        title: '', description: '', project: '', priority: 'medium', 
        due_date: '', estimated_hours: '', status: 'todo'
    });
    const [saving, setSaving] = useState(false);
    
    // Task detail state
    const [taskChecklist, setTaskChecklist] = useState([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');
    const [taskLabels, setTaskLabels] = useState([]);
    const [newLabel, setNewLabel] = useState('');
    const [isStarred, setIsStarred] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [tasksData, projectsData] = await Promise.all([
                taskService.getTasksKanban(filterProject || null),
                projectService.getProjects()
            ]);
            
            const normalizedTasks = {};
            Object.keys(STATUS_CONFIG).forEach(key => {
                normalizedTasks[key] = tasksData[key] || [];
            });
            setTasks(normalizedTasks);
            setAllTasks(Object.values(normalizedTasks).flat());
            
            const projectsList = projectsData.results || projectsData;
            setProjects(projectsList);
        } catch (err) {
            console.error(err);
            setError("Görevler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [filterProject]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Date filter logic
    const filterByDate = (task) => {
        if (filterDate === 'all') return true;
        if (!task.due_date) return filterDate === 'all';
        
        const dueDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        switch (filterDate) {
            case 'today':
                return dueDate.toDateString() === today.toDateString();
            case 'week':
                const weekEnd = new Date(today);
                weekEnd.setDate(today.getDate() + 7);
                return dueDate >= today && dueDate <= weekEnd;
            case 'month':
                return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
            case 'overdue':
                return dueDate < today && task.status !== 'completed';
            default:
                return true;
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const taskId = parseInt(draggableId.replace('task-', ''));
        const newStatus = destination.droppableId;
        const oldStatus = source.droppableId;

        const newTasks = JSON.parse(JSON.stringify(tasks));
        
        const sourceList = newTasks[oldStatus] || [];
        const taskIndex = sourceList.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const [movedTask] = sourceList.splice(taskIndex, 1);
        movedTask.status = newStatus;
        
        const destList = newTasks[newStatus] || [];
        destList.splice(destination.index, 0, movedTask);
        newTasks[newStatus] = destList;
        newTasks[oldStatus] = sourceList;
        
        setTasks(newTasks);
        setUpdating(true);

        try {
            await taskService.updateTaskStatus(taskId, newStatus);
        } catch (err) {
            console.error(err);
            fetchData();
        } finally {
            setUpdating(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await taskService.createTask({
                ...formData,
                project: formData.project || null,
                estimated_hours: formData.estimated_hours || null
            });
            setShowModal(false);
            setFormData({ title: '', description: '', project: '', priority: 'medium', due_date: '', estimated_hours: '', status: 'todo' });
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const openTaskDetail = (task) => {
        setSelectedTask(task);
        setTaskChecklist([
            { id: 1, text: 'Alt görev örneği 1', checked: true },
            { id: 2, text: 'Alt görev örneği 2', checked: false },
        ]);
        setTaskLabels(task.labels || ['Geliştirme', 'Frontend']);
        setIsStarred(false);
        setShowTaskDetail(true);
    };

    const handleChecklistToggle = (id) => {
        setTaskChecklist(prev => prev.map(item => 
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const addChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        setTaskChecklist(prev => [...prev, { 
            id: Date.now(), 
            text: newChecklistItem, 
            checked: false 
        }]);
        setNewChecklistItem('');
    };

    const deleteChecklistItem = (id) => {
        setTaskChecklist(prev => prev.filter(item => item.id !== id));
    };

    const addLabel = () => {
        if (!newLabel.trim() || taskLabels.includes(newLabel)) return;
        setTaskLabels(prev => [...prev, newLabel]);
        setNewLabel('');
    };

    const removeLabel = (label) => {
        setTaskLabels(prev => prev.filter(l => l !== label));
    };

    // Stats
    const stats = {
        total: allTasks.length,
        completed: (tasks.completed || []).length,
        inProgress: (tasks.in_progress || []).length,
        overdue: allTasks.filter(t => {
            if (!t.due_date || t.status === 'completed') return false;
            return new Date(t.due_date) < new Date();
        }).length
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
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
                            <h4 className="mb-1 fw-bold d-flex align-items-center gap-2">
                                <ListCheck size={24} style={{ color: '#2563eb' }} />
                                Görevler
                                {updating && <Spinner animation="border" size="sm" variant="primary" />}
                            </h4>
                            <div className="d-flex gap-3 flex-wrap">
                                <span className="text-muted small">
                                    Toplam: <strong>{stats.total}</strong>
                                </span>
                                <span className="text-muted small">
                                    Devam Eden: <strong className="text-warning">{stats.inProgress}</strong>
                                </span>
                                <span className="text-muted small">
                                    Tamamlanan: <strong className="text-success">{stats.completed}</strong>
                                </span>
                                {stats.overdue > 0 && (
                                    <span className="text-danger small">
                                        Gecikmiş: <strong>{stats.overdue}</strong>
                                    </span>
                                )}
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
                                Yeni Görev
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Filters */}
            <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex gap-2 flex-wrap flex-grow-1">
                            <InputGroup size="sm" style={{ maxWidth: 200 }}>
                                <InputGroup.Text><Search size={14} /></InputGroup.Text>
                                <Form.Control 
                                    placeholder="Görev ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                            
                            <Form.Select 
                                size="sm" 
                                style={{ width: 'auto' }}
                                value={filterProject}
                                onChange={(e) => setFilterProject(e.target.value)}
                            >
                                <option value="">Tüm Projeler</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </Form.Select>
                            
                            <Form.Select 
                                size="sm" 
                                style={{ width: 'auto' }}
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                            >
                                <option value="">Tüm Öncelikler</option>
                                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </Form.Select>
                            
                            <Form.Select 
                                size="sm" 
                                style={{ width: 'auto' }}
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                            >
                                {DATE_FILTERS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </Form.Select>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            {/* Kanban Board - Responsive Grid */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Row className="g-3">
                    {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
                        const filteredTasks = (tasks[statusKey] || []).filter(task => {
                            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchesPriority = !filterPriority || task.priority === filterPriority;
                            const matchesDate = filterByDate(task);
                            return matchesSearch && matchesPriority && matchesDate;
                        });
                        
                        return (
                            <Col key={statusKey} xs={12} sm={6} lg={4} xl>
                                <Droppable droppableId={statusKey}>
                                    {(provided, snapshot) => (
                                        <Card
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="border-0 h-100"
                                            style={{ 
                                                backgroundColor: snapshot.isDraggingOver ? cfg.bgColor : '#f8fafc',
                                                border: snapshot.isDraggingOver ? `2px dashed ${cfg.color}` : '1px solid #e5e7eb',
                                                minHeight: 400
                                            }}
                                        >
                                            {/* Column Header */}
                                            <Card.Header 
                                                className="bg-white py-2 d-flex align-items-center justify-content-between"
                                                style={{ borderBottom: `3px solid ${cfg.color}` }}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <span 
                                                        className="rounded-circle" 
                                                        style={{ width: 10, height: 10, backgroundColor: cfg.color }}
                                                    />
                                                    <span className="fw-semibold small">{cfg.label}</span>
                                                </div>
                                                <Badge bg="light" text="dark" className="rounded-pill">
                                                    {filteredTasks.length}
                                                </Badge>
                                            </Card.Header>

                                            {/* Tasks */}
                                            <Card.Body className="p-2" style={{ minHeight: 300 }}>
                                                {filteredTasks.map((task, index) => {
                                                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                                                    
                                                    return (
                                                        <Draggable 
                                                            key={`task-${task.id}`} 
                                                            draggableId={`task-${task.id}`} 
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className="mb-2 task-card"
                                                                    onClick={() => openTaskDetail(task)}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        backgroundColor: 'white',
                                                                        borderRadius: 8,
                                                                        borderLeft: `4px solid ${priorityCfg.color}`,
                                                                        boxShadow: snapshot.isDragging 
                                                                            ? '0 8px 20px rgba(0,0,0,0.15)' 
                                                                            : '0 1px 3px rgba(0,0,0,0.08)',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    <div className="p-3">
                                                                        {/* Task Header */}
                                                                        <div className="d-flex align-items-start justify-content-between mb-2">
                                                                            <div className="d-flex align-items-start gap-2">
                                                                                <Form.Check 
                                                                                    type="checkbox"
                                                                                    checked={task.status === 'completed'}
                                                                                    onChange={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleDragEnd({
                                                                                            destination: { droppableId: task.status === 'completed' ? 'todo' : 'completed', index: 0 },
                                                                                            source: { droppableId: task.status, index },
                                                                                            draggableId: `task-${task.id}`
                                                                                        });
                                                                                    }}
                                                                                    className="mt-1"
                                                                                />
                                                                                <div>
                                                                                    <h6 className={`mb-1 fw-semibold ${task.status === 'completed' ? 'text-decoration-line-through text-muted' : ''}`} style={{ fontSize: '0.9rem' }}>
                                                                                        {task.title}
                                                                                    </h6>
                                                                                    {task.project_name && (
                                                                                        <small className="text-muted d-flex align-items-center gap-1">
                                                                                            <Folder size={12} />
                                                                                            {task.project_name}
                                                                                        </small>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <Badge 
                                                                                style={{ 
                                                                                    backgroundColor: priorityCfg.bgColor, 
                                                                                    color: priorityCfg.color,
                                                                                    fontSize: '0.65rem'
                                                                                }}
                                                                            >
                                                                                {priorityCfg.label}
                                                                            </Badge>
                                                                        </div>
                                                                        
                                                                        {/* Task Footer */}
                                                                        <div className="d-flex justify-content-between align-items-center mt-2">
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                {task.due_date && (
                                                                                    <Badge 
                                                                                        bg={isOverdue ? 'danger' : 'light'} 
                                                                                        text={isOverdue ? 'white' : 'dark'} 
                                                                                        className="d-flex align-items-center gap-1"
                                                                                    >
                                                                                        <Calendar size={10} />
                                                                                        {new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {task.assigned_to_name && (
                                                                                <div 
                                                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                                                    style={{ 
                                                                                        width: 24, 
                                                                                        height: 24, 
                                                                                        backgroundColor: '#e5e7eb',
                                                                                        fontSize: '0.65rem',
                                                                                        fontWeight: 600
                                                                                    }}
                                                                                    title={task.assigned_to_name}
                                                                                >
                                                                                    {task.assigned_to_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {provided.placeholder}
                                                
                                                {filteredTasks.length === 0 && (
                                                    <div className="text-center text-muted py-4">
                                                        <ListCheck size={32} className="opacity-25 mb-2" />
                                                        <p className="small mb-0">Görev yok</p>
                                                    </div>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    )}
                                </Droppable>
                            </Col>
                        );
                    })}
                </Row>
            </DragDropContext>

            {/* Task Detail Panel */}
            <Offcanvas 
                show={showTaskDetail} 
                onHide={() => setShowTaskDetail(false)} 
                placement="end" 
                style={{ width: 450 }}
            >
                {selectedTask && (
                    <>
                        {/* Header */}
                        <Offcanvas.Header className="border-bottom bg-light">
                            <div className="d-flex align-items-center gap-3">
                                <Form.Check 
                                    type="checkbox" 
                                    checked={selectedTask.status === 'completed'}
                                    label="Tamamlandı"
                                    onChange={() => {}}
                                />
                                <Button variant="link" size="sm" className="text-muted p-0">
                                    <LinkIcon size={16} className="me-1" />
                                    Link Kopyala
                                </Button>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <Button 
                                    variant="link" 
                                    className={`p-0 ${isStarred ? 'text-warning' : 'text-muted'}`}
                                    onClick={() => setIsStarred(!isStarred)}
                                >
                                    <Star size={20} fill={isStarred ? '#f59e0b' : 'none'} />
                                </Button>
                                <Dropdown>
                                    <Dropdown.Toggle variant="link" className="p-0 text-muted">
                                        <DotsVertical size={20} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu align="end">
                                        <Dropdown.Item><Edit size={14} className="me-2" /> Düzenle</Dropdown.Item>
                                        <Dropdown.Item><User size={14} className="me-2" /> Atama Yap</Dropdown.Item>
                                        <Dropdown.Item><Tag size={14} className="me-2" /> Etiket Ekle</Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item className="text-danger"><Trash size={14} className="me-2" /> Sil</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                <Button variant="link" className="p-0 text-muted" onClick={() => setShowTaskDetail(false)}>
                                    <X size={20} />
                                </Button>
                            </div>
                        </Offcanvas.Header>

                        <Offcanvas.Body className="p-0">
                            <SimpleBar style={{ height: 'calc(100vh - 120px)' }}>
                                <div className="p-4">
                                    {/* Task Title */}
                                    <h4 className="fw-bold mb-2">{selectedTask.title}</h4>
                                    <p className="text-muted">{selectedTask.description || 'Açıklama eklenmemiş...'}</p>
                                    
                                    {/* Assigned Users */}
                                    <div className="d-flex align-items-center gap-2 mb-4">
                                        {selectedTask.assigned_to_name && (
                                            <div 
                                                className="avatar rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ 
                                                    width: 36, 
                                                    height: 36, 
                                                    backgroundColor: '#2563eb',
                                                    color: 'white',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {selectedTask.assigned_to_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                        )}
                                        <Button variant="outline-secondary" size="sm" className="rounded-circle p-0" style={{ width: 36, height: 36 }}>
                                            <Plus size={16} />
                                        </Button>
                                    </div>
                                    
                                    {/* Due Date & Status */}
                                    <Row className="g-3 mb-4">
                                        <Col xs={6}>
                                            <div className="border-top pt-3">
                                                <small className="text-muted d-block mb-2">Bitiş Tarihi</small>
                                                <Form.Control 
                                                    type="date" 
                                                    size="sm"
                                                    defaultValue={selectedTask.due_date}
                                                />
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="border-top pt-3">
                                                <small className="text-muted d-block mb-2">Durum</small>
                                                <Dropdown>
                                                    <Dropdown.Toggle 
                                                        size="sm"
                                                        style={{ 
                                                            backgroundColor: STATUS_CONFIG[selectedTask.status]?.color,
                                                            border: 'none'
                                                        }}
                                                    >
                                                        {STATUS_CONFIG[selectedTask.status]?.label}
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                            <Dropdown.Item key={key}>
                                                                <span className="rounded-circle me-2" style={{ width: 8, height: 8, backgroundColor: cfg.color, display: 'inline-block' }} />
                                                                {cfg.label}
                                                            </Dropdown.Item>
                                                        ))}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    {/* Labels */}
                                    <div className="border-top pt-3 mb-4">
                                        <small className="text-muted d-block mb-2">Etiketler</small>
                                        <div className="d-flex flex-wrap gap-2">
                                            {taskLabels.map((label, idx) => (
                                                <Badge 
                                                    key={idx} 
                                                    bg="light" 
                                                    text="dark" 
                                                    className="d-flex align-items-center gap-1 px-2 py-1"
                                                >
                                                    {label}
                                                    <X 
                                                        size={12} 
                                                        className="cursor-pointer" 
                                                        onClick={() => removeLabel(label)}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                </Badge>
                                            ))}
                                            <Form.Control 
                                                type="text" 
                                                size="sm"
                                                placeholder="Etiket ekle..."
                                                value={newLabel}
                                                onChange={(e) => setNewLabel(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addLabel()}
                                                style={{ width: 100, border: 'none', outline: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <Tab.Container defaultActiveKey="checklist">
                                        <Nav variant="tabs" className="nav-tabs-line mb-3">
                                            <Nav.Item>
                                                <Nav.Link eventKey="checklist">
                                                    <ClipboardList size={14} className="me-1" /> Checklist
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="comments">
                                                    <Message size={14} className="me-1" /> Yorumlar
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="files">
                                                    <FileText size={14} className="me-1" /> Dosyalar
                                                </Nav.Link>
                                            </Nav.Item>
                                            <Nav.Item>
                                                <Nav.Link eventKey="activity">
                                                    <Activity size={14} className="me-1" /> Aktivite
                                                </Nav.Link>
                                            </Nav.Item>
                                        </Nav>

                                        <Tab.Content>
                                            {/* Checklist Tab */}
                                            <Tab.Pane eventKey="checklist">
                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                    <strong>Checklist</strong>
                                                    <Button variant="link" size="sm" className="p-0" onClick={() => addChecklistItem()}>
                                                        <Plus size={16} />
                                                    </Button>
                                                </div>
                                                
                                                {taskChecklist.map((item) => (
                                                    <div 
                                                        key={item.id} 
                                                        className="d-flex align-items-center justify-content-between py-2 border-bottom"
                                                    >
                                                        <Form.Check 
                                                            type="checkbox"
                                                            checked={item.checked}
                                                            onChange={() => handleChecklistToggle(item.id)}
                                                            label={
                                                                <span className={item.checked ? 'text-decoration-line-through text-muted' : ''}>
                                                                    {item.text}
                                                                </span>
                                                            }
                                                        />
                                                        <Button 
                                                            variant="link" 
                                                            size="sm" 
                                                            className="p-0 text-muted"
                                                            onClick={() => deleteChecklistItem(item.id)}
                                                        >
                                                            <Trash size={14} />
                                                        </Button>
                                                    </div>
                                                ))}
                                                
                                                <InputGroup className="mt-3">
                                                    <Form.Control 
                                                        placeholder="Yeni madde ekle..."
                                                        value={newChecklistItem}
                                                        onChange={(e) => setNewChecklistItem(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                                                    />
                                                    <Button variant="primary" onClick={addChecklistItem}>
                                                        <Plus size={16} />
                                                    </Button>
                                                </InputGroup>
                                            </Tab.Pane>

                                            {/* Comments Tab */}
                                            <Tab.Pane eventKey="comments">
                                                <div className="text-center text-muted py-4">
                                                    <Message size={32} className="opacity-25 mb-2" />
                                                    <p className="mb-3">Henüz yorum yok</p>
                                                    <Form.Control as="textarea" rows={3} placeholder="Yorum ekle..." className="mb-2" />
                                                    <Button variant="primary" size="sm">Gönder</Button>
                                                </div>
                                            </Tab.Pane>

                                            {/* Files Tab */}
                                            <Tab.Pane eventKey="files">
                                                <div 
                                                    className="border-2 border-dashed rounded p-4 text-center text-muted"
                                                    style={{ borderStyle: 'dashed' }}
                                                >
                                                    <FileText size={32} className="opacity-25 mb-2" />
                                                    <p className="mb-2">Dosyaları buraya sürükleyin</p>
                                                    <Button variant="outline-primary" size="sm">Dosya Seç</Button>
                                                </div>
                                            </Tab.Pane>

                                            {/* Activity Tab */}
                                            <Tab.Pane eventKey="activity">
                                                <div className="timeline-alt">
                                                    <div className="d-flex gap-3 mb-3">
                                                        <div 
                                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                                            style={{ width: 32, height: 32, backgroundColor: '#e5e7eb', flexShrink: 0 }}
                                                        >
                                                            <User size={14} />
                                                        </div>
                                                        <div>
                                                            <p className="mb-0 small">
                                                                <strong>Sistem</strong> tarafından oluşturuldu
                                                            </p>
                                                            <small className="text-muted">
                                                                {new Date(selectedTask.created_at).toLocaleDateString('tr-TR')}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Tab.Pane>
                                        </Tab.Content>
                                    </Tab.Container>
                                </div>
                            </SimpleBar>
                        </Offcanvas.Body>
                    </>
                )}
            </Offcanvas>

            {/* New Task Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)' }}>
                    <Modal.Title className="text-white">
                        <Plus size={20} className="me-2" />
                        Yeni Görev
                    </Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateTask}>
                    <Modal.Body className="p-4">
                        <Row className="g-3">
                            <Col md={8}>
                                <Form.Group>
                                    <Form.Label>Görev Başlığı <span className="text-danger">*</span></Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Görev başlığı girin"
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        required
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
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Proje</Form.Label>
                                    <Form.Select 
                                        value={formData.project}
                                        onChange={e => setFormData({...formData, project: e.target.value})}
                                    >
                                        <option value="">Proje Seçiniz...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Açıklama</Form.Label>
                                    <Form.Control 
                                        as="textarea" 
                                        rows={3}
                                        placeholder="Görev açıklaması..."
                                        value={formData.description}
                                        onChange={e => setFormData({...formData, description: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Öncelik</Form.Label>
                                    <Form.Select 
                                        value={formData.priority}
                                        onChange={e => setFormData({...formData, priority: e.target.value})}
                                    >
                                        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                            <option key={key} value={key}>{cfg.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Bitiş Tarihi</Form.Label>
                                    <Form.Control 
                                        type="date" 
                                        value={formData.due_date}
                                        onChange={e => setFormData({...formData, due_date: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Tahmini Süre (saat)</Form.Label>
                                    <Form.Control 
                                        type="number" 
                                        placeholder="8"
                                        value={formData.estimated_hours}
                                        onChange={e => setFormData({...formData, estimated_hours: e.target.value})}
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
                            Görev Oluştur
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            <style jsx global>{`
                .task-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                }
                .nav-tabs-line .nav-link {
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: #6b7280;
                    font-size: 0.85rem;
                    padding: 0.5rem 1rem;
                }
                .nav-tabs-line .nav-link.active {
                    border-bottom-color: #2563eb;
                    color: #2563eb;
                }
            `}</style>
        </Container>
    );
};

export default TasksPage;
