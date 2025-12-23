'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Card, Table, Button, Modal, Form, Spinner, Alert, Badge, Tabs, Tab, InputGroup, Dropdown } from 'react-bootstrap';
import { vaultService } from '@/services/vaultService';
import { customerService } from '@/services/customerService';

const VaultPage = () => {
    const [credentials, setCredentials] = useState([]);
    const [mailAccounts, setMailAccounts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [credentialTypes, setCredentialTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('credentials');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    
    // Debounce ref
    const searchTimeoutRef = useRef(null);

    // Modal states
    const [showCredentialModal, setShowCredentialModal] = useState(false);
    const [showMailModal, setShowMailModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);

    // Password reveal states
    const [revealedPasswords, setRevealedPasswords] = useState({});
    const [revealingId, setRevealingId] = useState(null);

    // Form data
    const [formData, setFormData] = useState({});

    // Fetch filtered data from backend
    const fetchFilteredData = useCallback(async (search = '', customer = '', isMounted = { current: true }) => {
        try {
            const params = {};
            if (search) params.search = search;
            if (customer) params.customer = customer;
            
            const [credsData, mailsData] = await Promise.all([
                vaultService.getCredentials(params),
                vaultService.getMailAccounts(params)
            ]);
            
            // Only update state if component is still mounted
            if (isMounted.current) {
                setCredentials(credsData.results || credsData || []);
                setMailAccounts(mailsData.results || mailsData || []);
            }
        } catch (err) {
            // Ignore errors if component unmounted
            if (isMounted.current) {
                console.error(err);
            }
        }
    }, []);

    // Initial data fetch
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [credsData, mailsData, customersData, typesData] = await Promise.all([
                vaultService.getCredentials(),
                vaultService.getMailAccounts(),
                customerService.getCustomers(),
                vaultService.getCredentialTypes()
            ]);
            setCredentials(credsData.results || credsData || []);
            setMailAccounts(mailsData.results || mailsData || []);
            setCustomers(customersData.results || customersData || []);
            setCredentialTypes(typesData || []);
        } catch (err) {
            console.error(err);
            setError("Veriler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Debounced search effect - only runs when search/filter changes (not initial load)
    const isInitialMount = useRef(true);
    useEffect(() => {
        // Skip on initial mount - data is already loaded by fetchData
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const isMounted = { current: true };
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        searchTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
                fetchFilteredData(searchQuery, filterCustomer, isMounted);
            }
        }, 300);

        return () => {
            isMounted.current = false;
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, filterCustomer, fetchFilteredData]);

    const handleRevealPassword = async (id, type = 'credential') => {
        if (revealedPasswords[`${type}-${id}`]) {
            setRevealedPasswords(prev => ({ ...prev, [`${type}-${id}`]: null }));
            return;
        }

        setRevealingId(id);
        try {
            const result = type === 'credential' 
                ? await vaultService.revealPassword(id)
                : await vaultService.revealMailPassword(id);
            setRevealedPasswords(prev => ({ ...prev, [`${type}-${id}`]: result.password }));
        } catch (err) {
            console.error(err);
            setError("Şifre görüntülenemedi.");
        } finally {
            setRevealingId(null);
        }
    };

    const handleCopyPassword = async (id, type = 'credential') => {
        try {
            let password = revealedPasswords[`${type}-${id}`];
            if (!password) {
                const result = type === 'credential' 
                    ? await vaultService.revealPassword(id)
                    : await vaultService.revealMailPassword(id);
                password = result.password;
            }
            await navigator.clipboard.writeText(password);
            alert('Şifre kopyalandı!');
        } catch (err) {
            console.error(err);
        }
    };

    const openCredentialModal = (credential = null) => {
        setEditingItem(credential);
        setFormData(credential ? {
            customer: credential.customer,
            credential_type: credential.credential_type,
            title: credential.title,
            url: credential.url,
            username: credential.username,
            notes: credential.notes
        } : {
            customer: '',
            credential_type: 'site_admin',
            title: '',
            url: '',
            username: '',
            password: '',
            notes: ''
        });
        setShowCredentialModal(true);
    };

    const openMailModal = (mail = null) => {
        setEditingItem(mail);
        setFormData(mail ? {
            customer: mail.customer,
            email: mail.email,
            smtp_server: mail.smtp_server,
            smtp_port: mail.smtp_port,
            smtp_security: mail.smtp_security,
            imap_server: mail.imap_server,
            imap_port: mail.imap_port,
            notes: mail.notes
        } : {
            customer: '',
            email: '',
            password: '',
            smtp_server: '',
            smtp_port: 587,
            smtp_security: 'TLS',
            imap_server: '',
            imap_port: 993,
            notes: ''
        });
        setShowMailModal(true);
    };

    const handleSaveCredential = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingItem) {
                await vaultService.updateCredential(editingItem.id, formData);
            } else {
                await vaultService.createCredential(formData);
            }
            setShowCredentialModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Kaydetme hatası.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveMail = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingItem) {
                await vaultService.updateMailAccount(editingItem.id, formData);
            } else {
                await vaultService.createMailAccount(formData);
            }
            setShowMailModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Kaydetme hatası.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            if (deleteTarget.type === 'credential') {
                await vaultService.deleteCredential(deleteTarget.id);
            } else {
                await vaultService.deleteMailAccount(deleteTarget.id);
            }
            setShowDeleteModal(false);
            setDeleteTarget(null);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Silme hatası.");
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            site_admin: 'bi-globe',
            hosting: 'bi-server',
            cpanel: 'bi-gear',
            ftp: 'bi-folder2',
            gmail: 'bi-envelope',
            social_media: 'bi-people',
            database: 'bi-database',
            api_key: 'bi-key',
            other: 'bi-asterisk'
        };
        return icons[type] || 'bi-lock';
    };

    const getTypeBadge = (type) => {
        const colors = {
            site_admin: 'primary',
            hosting: 'info',
            cpanel: 'warning',
            ftp: 'secondary',
            gmail: 'danger',
            social_media: 'success',
            database: 'dark',
            api_key: 'purple',
            other: 'secondary'
        };
        return colors[type] || 'secondary';
    };

    // Backend handles filtering now, no need for client-side filter

    return (
        <Container fluid className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">
                        <i className="bi bi-shield-lock me-2 text-primary"></i>
                        Kasa (Vault)
                    </h4>
                    <small className="text-muted">Şifreler güvenli olarak şifrelenerek saklanır</small>
                </div>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            <Card className="mb-3">
                <Card.Body className="py-2">
                    <div className="d-flex gap-3 align-items-center">
                        <InputGroup size="sm" style={{ width: '300px' }}>
                            <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                            <Form.Control
                                placeholder="Ara..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </InputGroup>
                        <Form.Select 
                            size="sm" 
                            style={{ width: '200px' }}
                            value={filterCustomer}
                            onChange={e => setFilterCustomer(e.target.value)}
                        >
                            <option value="">Tüm Müşteriler</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                </Card.Body>
            </Card>

            <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k)} className="mb-3">
                <Tab eventKey="credentials" title={<span><i className="bi bi-key me-1"></i>Şifreler ({credentials.length})</span>}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>Kayıtlı Şifreler</span>
                            <Button size="sm" variant="primary" onClick={() => openCredentialModal()}>
                                <i className="bi bi-plus-lg me-1"></i>Yeni Şifre
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {loading ? (
                                <div className="text-center py-5"><Spinner /></div>
                            ) : (
                                <Table responsive hover className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Tür</th>
                                            <th>Başlık</th>
                                            <th>Müşteri</th>
                                            <th>Kullanıcı Adı</th>
                                            <th>Şifre</th>
                                            <th>Görüntülenme</th>
                                            <th>İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credentials.map(cred => (
                                            <tr key={cred.id}>
                                                <td>
                                                    <Badge bg={getTypeBadge(cred.credential_type)}>
                                                        <i className={`bi ${getTypeIcon(cred.credential_type)} me-1`}></i>
                                                        {cred.credential_type_display}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <strong>{cred.title}</strong>
                                                    {cred.url && (
                                                        <div><a href={cred.url} target="_blank" rel="noopener" className="small">{cred.url}</a></div>
                                                    )}
                                                </td>
                                                <td>{cred.customer_name}</td>
                                                <td><code>{cred.username}</code></td>
                                                <td style={{ minWidth: '150px' }}>
                                                    {revealedPasswords[`credential-${cred.id}`] ? (
                                                        <code>{revealedPasswords[`credential-${cred.id}`]}</code>
                                                    ) : (
                                                        <span className="text-muted">••••••••</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <small className="text-muted">
                                                        {cred.view_count} kez
                                                    </small>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button 
                                                            size="sm" 
                                                            variant={revealedPasswords[`credential-${cred.id}`] ? 'warning' : 'outline-secondary'}
                                                            onClick={() => handleRevealPassword(cred.id)}
                                                            disabled={revealingId === cred.id}
                                                            title={revealedPasswords[`credential-${cred.id}`] ? 'Gizle' : 'Göster'}
                                                        >
                                                            <i className={`bi ${revealedPasswords[`credential-${cred.id}`] ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-primary"
                                                            onClick={() => handleCopyPassword(cred.id)}
                                                            title="Kopyala"
                                                        >
                                                            <i className="bi bi-clipboard"></i>
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-secondary"
                                                            onClick={() => openCredentialModal(cred)}
                                                            title="Düzenle"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline-danger"
                                                            onClick={() => { setDeleteTarget({ id: cred.id, type: 'credential', name: cred.title }); setShowDeleteModal(true); }}
                                                            title="Sil"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {credentials.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="text-center py-5">
                                                    <i className="bi bi-shield-lock display-4 text-muted"></i>
                                                    <p className="text-muted mt-2">Henüz şifre kaydı yok</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="mail" title={<span><i className="bi bi-envelope me-1"></i>Mail Hesapları ({mailAccounts.length})</span>}>
                    <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>Mail Hesapları</span>
                            <Button size="sm" variant="primary" onClick={() => openMailModal()}>
                                <i className="bi bi-plus-lg me-1"></i>Yeni Mail
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Email</th>
                                        <th>Müşteri</th>
                                        <th>SMTP</th>
                                        <th>IMAP</th>
                                        <th>Şifre</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mailAccounts.map(mail => (
                                        <tr key={mail.id}>
                                            <td><code>{mail.email}</code></td>
                                            <td>{mail.customer_name}</td>
                                            <td><small>{mail.smtp_server}:{mail.smtp_port}</small></td>
                                            <td><small>{mail.imap_server}:{mail.imap_port}</small></td>
                                            <td>
                                                {revealedPasswords[`mail-${mail.id}`] ? (
                                                    <code>{revealedPasswords[`mail-${mail.id}`]}</code>
                                                ) : (
                                                    <span className="text-muted">••••••••</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1">
                                                    <Button 
                                                        size="sm" 
                                                        variant={revealedPasswords[`mail-${mail.id}`] ? 'warning' : 'outline-secondary'}
                                                        onClick={() => handleRevealPassword(mail.id, 'mail')}
                                                        title={revealedPasswords[`mail-${mail.id}`] ? 'Gizle' : 'Göster'}
                                                    >
                                                        <i className={`bi ${revealedPasswords[`mail-${mail.id}`] ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-primary"
                                                        onClick={() => handleCopyPassword(mail.id, 'mail')}
                                                    >
                                                        <i className="bi bi-clipboard"></i>
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-secondary"
                                                        onClick={() => openMailModal(mail)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline-danger"
                                                        onClick={() => { setDeleteTarget({ id: mail.id, type: 'mail', name: mail.email }); setShowDeleteModal(true); }}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {mailAccounts.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <i className="bi bi-envelope display-4 text-muted"></i>
                                                <p className="text-muted mt-2">Henüz mail hesabı yok</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Credential Modal */}
            <Modal show={showCredentialModal} onHide={() => setShowCredentialModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? 'Şifre Düzenle' : 'Yeni Şifre Ekle'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveCredential}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Müşteri *</Form.Label>
                                    <Form.Select 
                                        value={formData.customer || ''} 
                                        onChange={e => setFormData({...formData, customer: e.target.value})}
                                        required
                                    >
                                        <option value="">Seçin...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Tür *</Form.Label>
                                    <Form.Select 
                                        value={formData.credential_type || 'site_admin'} 
                                        onChange={e => setFormData({...formData, credential_type: e.target.value})}
                                        required
                                    >
                                        {credentialTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-12">
                                <Form.Group>
                                    <Form.Label>Başlık *</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={formData.title || ''}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        placeholder="Örn: ABC Firma Admin Panel"
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-12">
                                <Form.Group>
                                    <Form.Label>URL</Form.Label>
                                    <Form.Control 
                                        type="url"
                                        value={formData.url || ''}
                                        onChange={e => setFormData({...formData, url: e.target.value})}
                                        placeholder="https://example.com/admin"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Kullanıcı Adı *</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={formData.username || ''}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Şifre {editingItem ? '' : '*'}</Form.Label>
                                    <Form.Control 
                                        type="password"
                                        value={formData.password || ''}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        required={!editingItem}
                                        placeholder={editingItem ? 'Değiştirmek için yeni şifre girin' : ''}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-12">
                                <Form.Group>
                                    <Form.Label>Notlar</Form.Label>
                                    <Form.Control 
                                        as="textarea"
                                        rows={2}
                                        value={formData.notes || ''}
                                        onChange={e => setFormData({...formData, notes: e.target.value})}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCredentialModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <Spinner size="sm" /> : 'Kaydet'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Mail Modal */}
            <Modal show={showMailModal} onHide={() => setShowMailModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{editingItem ? 'Mail Hesabı Düzenle' : 'Yeni Mail Hesabı'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSaveMail}>
                    <Modal.Body>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Müşteri *</Form.Label>
                                    <Form.Select 
                                        value={formData.customer || ''} 
                                        onChange={e => setFormData({...formData, customer: e.target.value})}
                                        required
                                    >
                                        <option value="">Seçin...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Email *</Form.Label>
                                    <Form.Control 
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Şifre {editingItem ? '' : '*'}</Form.Label>
                                    <Form.Control 
                                        type="password"
                                        value={formData.password || ''}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        required={!editingItem}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-6">
                                <Form.Group>
                                    <Form.Label>Güvenlik</Form.Label>
                                    <Form.Select 
                                        value={formData.smtp_security || 'TLS'} 
                                        onChange={e => setFormData({...formData, smtp_security: e.target.value})}
                                    >
                                        <option value="TLS">TLS</option>
                                        <option value="SSL">SSL</option>
                                        <option value="NONE">Yok</option>
                                    </Form.Select>
                                </Form.Group>
                            </div>
                            <div className="col-md-4">
                                <Form.Group>
                                    <Form.Label>SMTP Sunucu</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={formData.smtp_server || ''}
                                        onChange={e => setFormData({...formData, smtp_server: e.target.value})}
                                        placeholder="smtp.gmail.com"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-2">
                                <Form.Group>
                                    <Form.Label>Port</Form.Label>
                                    <Form.Control 
                                        type="number"
                                        value={formData.smtp_port || 587}
                                        onChange={e => setFormData({...formData, smtp_port: parseInt(e.target.value)})}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-4">
                                <Form.Group>
                                    <Form.Label>IMAP Sunucu</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        value={formData.imap_server || ''}
                                        onChange={e => setFormData({...formData, imap_server: e.target.value})}
                                        placeholder="imap.gmail.com"
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-md-2">
                                <Form.Group>
                                    <Form.Label>Port</Form.Label>
                                    <Form.Control 
                                        type="number"
                                        value={formData.imap_port || 993}
                                        onChange={e => setFormData({...formData, imap_port: parseInt(e.target.value)})}
                                    />
                                </Form.Group>
                            </div>
                            <div className="col-12">
                                <Form.Group>
                                    <Form.Label>Notlar</Form.Label>
                                    <Form.Control 
                                        as="textarea"
                                        rows={2}
                                        value={formData.notes || ''}
                                        onChange={e => setFormData({...formData, notes: e.target.value})}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowMailModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit" disabled={saving}>
                            {saving ? <Spinner size="sm" /> : 'Kaydet'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Silme Onayı</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>{deleteTarget?.name}</strong> kaydını silmek istediğinizden emin misiniz?</p>
                    <Alert variant="warning">Bu işlem geri alınamaz!</Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>İptal</Button>
                    <Button variant="danger" onClick={handleDelete}>Sil</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default VaultPage;
