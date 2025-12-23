'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Container, Card, Spinner, Alert, Button, Modal, Form, Dropdown, InputGroup, Badge, Table } from 'react-bootstrap';
import { filesService } from '@/services/filesService';

const FilesPage = () => {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [driveFiles, setDriveFiles] = useState([]);
    const [driveStatus, setDriveStatus] = useState({ is_configured: false, is_connected: false });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDriveModal, setShowDriveModal] = useState(false);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showTreeModal, setShowTreeModal] = useState(false);
    const [treeData, setTreeData] = useState({ folders: [], root_files: [] });
    const [expandedFolders, setExpandedFolders] = useState({});
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [filesData, foldersData, statusData] = await Promise.all([
                filesService.getFiles({ folder: currentFolder || 'root' }),
                filesService.getFolders(currentFolder),
                filesService.getDriveStatus()
            ]);
            
            setFiles(filesData.results || filesData || []);
            setFolders(foldersData.results || foldersData || []);
            setDriveStatus(statusData);
        } catch (err) {
            console.error(err);
            setError("Dosyalar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [currentFolder]);


    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('connected') === 'true') {
            window.history.replaceState({}, '', '/dashboard/files');
            fetchData();
        }
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        const file = fileInputRef.current?.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('name', file.name);
            if (currentFolder) formData.append('folder', currentFolder);
            
            await filesService.uploadFile(formData);
            setShowUploadModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Dosya yüklenirken hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!folderName.trim()) return;
        
        try {
            await filesService.createFolder({
                name: folderName,
                parent: currentFolder,
                folder_type: 'general'
            });
            setShowFolderModal(false);
            setFolderName('');
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Klasör oluşturulamadı.");
        }
    };

    const handleOpenFolder = (folder) => {
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
        setCurrentFolder(folder.id);
    };

    const handleGoToFolder = (index) => {
        if (index === -1) {
            setFolderPath([]);
            setCurrentFolder(null);
        } else {
            const newPath = folderPath.slice(0, index + 1);
            setFolderPath(newPath);
            setCurrentFolder(newPath[newPath.length - 1]?.id || null);
        }
    };

    const handleConnectDrive = async () => {
        try {
            const { authorization_url } = await filesService.getConnectUrl();
            window.location.href = authorization_url;
        } catch (err) {
            console.error(err);
            setError("Drive bağlantısı başlatılamadı.");
        }
    };

    const handleDisconnectDrive = async () => {
        try {
            await filesService.disconnect();
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleShowDriveFiles = async () => {
        try {
            const files = await filesService.getDriveFiles();
            setDriveFiles(files);
            setShowDriveModal(true);
        } catch (err) {
            console.error(err);
            setError("Drive dosyaları yüklenemedi.");
        }
    };

    const handleImportFromDrive = async (fileId) => {
        try {
            await filesService.importFromDrive(fileId);
            setShowDriveModal(false);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSyncToDrive = async (id) => {
        try {
            await filesService.syncToDrive(id);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await filesService.deleteFile(deleteTarget.id);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Dosya silinirken hata oluştu.");
        }
    };

    const handleCopy = async (file) => {
        try {
            await filesService.copyFile(file.id);
            fetchData();
        } catch (err) {
            console.error(err);
            setError("Dosya kopyalanırken hata oluştu.");
        }
    };

    const handleDownload = async (file) => {
        if (file.drive_view_link) {
            window.open(file.drive_view_link, '_blank');
        } else {
            try {
                const blob = await filesService.downloadFile(file.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.original_name;
                a.click();
            } catch (err) {
                console.error(err);
            }
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e, file) => {
        e.dataTransfer.setData('fileId', file.id);
    };

    const handleDragOver = (e, folderId) => {
        e.preventDefault();
        setDragOverFolder(folderId);
    };

    const handleDragLeave = () => {
        setDragOverFolder(null);
    };

    const handleDrop = async (e, folderId) => {
        e.preventDefault();
        setDragOverFolder(null);
        const fileId = e.dataTransfer.getData('fileId');
        if (fileId) {
            try {
                await filesService.moveToFolder(fileId, folderId);
                fetchData();
            } catch (err) {
                console.error(err);
                setError("Dosya taşınırken hata oluştu.");
            }
        }
    };

    // Tree View
    const handleShowTree = async () => {
        try {
            const data = await filesService.getTree();
            setTreeData(data);
            setExpandedFolders({});
            setShowTreeModal(true);
        } catch (err) {
            console.error(err);
            setError("Dizin yapısı yüklenemedi.");
        }
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => ({
            ...prev,
            [folderId]: !prev[folderId]
        }));
    };

    const renderTreeFolder = (folder, level = 0) => {
        const isExpanded = expandedFolders[folder.id];
        const hasChildren = folder.children?.length > 0 || folder.files?.length > 0;
        
        return (
            <div key={folder.id}>
                <div 
                    style={{ 
                        paddingLeft: `${level * 20}px`,
                        padding: '8px',
                        paddingLeft: `${level * 20 + 8}px`,
                        cursor: hasChildren ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '4px'
                    }}
                    className="hover-bg-light"
                    onClick={() => hasChildren && toggleFolder(folder.id)}
                >
                    {hasChildren && (
                        <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} text-muted`} style={{fontSize: '12px'}}></i>
                    )}
                    {!hasChildren && <span style={{width: '12px'}}></span>}
                    <i className="bi bi-folder-fill text-warning"></i>
                    <span>{folder.name}</span>
                    <Badge bg="secondary" className="ms-auto">{(folder.files?.length || 0) + (folder.children?.length || 0)}</Badge>
                </div>
                
                {isExpanded && (
                    <div>
                        {folder.children?.map(child => renderTreeFolder(child, level + 1))}
                        {folder.files?.map(file => (
                            <div 
                                key={`file-${file.id}`}
                                style={{
                                    paddingLeft: `${(level + 1) * 20 + 20}px`,
                                    padding: '6px',
                                    paddingLeft: `${(level + 1) * 20 + 28}px`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <i className={`bi ${getFileIcon(file.mime_type).icon}`} style={{color: getFileIcon(file.mime_type).color}}></i>
                                <span className="text-muted">{file.name || file.original_name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const getFileIcon = (mimeType, isFolder = false) => {
        if (isFolder) return { icon: 'bi-folder-fill', color: '#FFC107' };
        if (mimeType?.startsWith('image/')) return { icon: 'bi-file-image-fill', color: '#E91E63' };
        if (mimeType?.includes('pdf')) return { icon: 'bi-file-pdf-fill', color: '#F44336' };
        if (mimeType?.includes('word') || mimeType?.includes('document')) return { icon: 'bi-file-word-fill', color: '#2196F3' };
        if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return { icon: 'bi-file-excel-fill', color: '#4CAF50' };
        if (mimeType?.includes('zip') || mimeType?.includes('archive')) return { icon: 'bi-file-zip-fill', color: '#FF9800' };
        return { icon: 'bi-file-earmark-fill', color: '#607D8B' };
    };

    const filteredFolders = folders.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredFiles = files.filter(f => 
        (f.name || f.original_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1">
                        <i className="bi bi-hdd me-2 text-primary"></i>
                        Dosya Yöneticisi
                    </h4>
                    <div className="d-flex align-items-center gap-2">
                        {driveStatus.is_connected ? (
                            <Badge bg="success">
                                <i className="bi bi-cloud-check me-1"></i>Drive Bağlı
                            </Badge>
                        ) : driveStatus.is_configured ? (
                            <Badge bg="warning" text="dark">
                                <i className="bi bi-cloud me-1"></i>Bağlı Değil
                            </Badge>
                        ) : (
                            <Badge bg="secondary">Yapılandırılmamış</Badge>
                        )}
                    </div>
                </div>
                
                <div className="d-flex gap-2">
                    {!driveStatus.is_connected && driveStatus.is_configured && (
                        <Button variant="success" size="sm" onClick={handleConnectDrive}>
                            <i className="bi bi-google me-1"></i>Drive Bağla
                        </Button>
                    )}
                    {driveStatus.is_connected && (
                        <Button variant="outline-danger" size="sm" onClick={handleDisconnectDrive}>
                            <i className="bi bi-x-circle me-1"></i>Bağlantıyı Kes
                        </Button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <Card className="mb-3">
                <Card.Body className="py-2">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2 align-items-center">
                            <Dropdown>
                                <Dropdown.Toggle variant="primary" size="sm">
                                    <i className="bi bi-plus-lg me-1"></i>Yeni
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => setShowFolderModal(true)}>
                                        <i className="bi bi-folder-plus me-2 text-warning"></i>Klasör
                                    </Dropdown.Item>
                                    <Dropdown.Item onClick={() => setShowUploadModal(true)}>
                                        <i className="bi bi-upload me-2 text-success"></i>Dosya Yükle
                                    </Dropdown.Item>
                                    {driveStatus.is_connected && (
                                        <Dropdown.Item onClick={handleShowDriveFiles}>
                                            <i className="bi bi-cloud-download me-2 text-primary"></i>Drive'dan Aktar
                                        </Dropdown.Item>
                                    )}
                                </Dropdown.Menu>
                            </Dropdown>

                            <Button variant="outline-secondary" size="sm" onClick={handleShowTree} title="Dizin Yapısı">
                                <i className="bi bi-diagram-3"></i>
                            </Button>

                            <InputGroup size="sm" style={{ width: '300px' }}>
                                <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                                <Form.Control
                                    placeholder="Dosya ara..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                        </div>

                        <div className="btn-group btn-group-sm">
                            <Button 
                                variant={viewMode === 'list' ? 'secondary' : 'outline-secondary'}
                                onClick={() => setViewMode('list')}
                            >
                                <i className="bi bi-list"></i>
                            </Button>
                            <Button 
                                variant={viewMode === 'grid' ? 'secondary' : 'outline-secondary'}
                                onClick={() => setViewMode('grid')}
                            >
                                <i className="bi bi-grid-3x3-gap"></i>
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-3">
                <ol className="breadcrumb mb-0">
                    <li className={`breadcrumb-item ${folderPath.length === 0 ? 'active' : ''}`}>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleGoToFolder(-1); }}>
                            <i className="bi bi-house me-1"></i>Ana Klasör
                        </a>
                    </li>
                    {folderPath.map((folder, index) => (
                        <li key={folder.id} className={`breadcrumb-item ${index === folderPath.length - 1 ? 'active' : ''}`}>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleGoToFolder(index); }}>
                                {folder.name}
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

            {/* Content */}
            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <Card>
                    <Card.Body className="p-0">
                        {viewMode === 'list' ? (
                            <Table responsive hover className="mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{width: 40}}></th>
                                        <th>Ad</th>
                                        <th style={{width: 100}}>Boyut</th>
                                        <th style={{width: 120}}>Tarih</th>
                                        <th style={{width: 80}}>Drive</th>
                                        <th style={{width: 150}}>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Folders */}
                                    {filteredFolders.map(folder => (
                                        <tr 
                                            key={`folder-${folder.id}`} 
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: dragOverFolder === folder.id ? '#e3f2fd' : 'transparent'
                                            }} 
                                            onClick={() => handleOpenFolder(folder)}
                                            onDragOver={(e) => handleDragOver(e, folder.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, folder.id)}
                                        >
                                            <td className="text-center">
                                                <i className="bi bi-folder-fill fs-5 text-warning"></i>
                                            </td>
                                            <td>
                                                <div className="fw-medium">{folder.name}</div>
                                                <small className="text-muted">{folder.file_count || 0} dosya</small>
                                            </td>
                                            <td className="text-muted">—</td>
                                            <td className="text-muted">{new Date(folder.created_at).toLocaleDateString('tr-TR')}</td>
                                            <td>
                                                {folder.drive_folder_id ? (
                                                    <i className="bi bi-cloud-check-fill text-success"></i>
                                                ) : '—'}
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <Dropdown>
                                                    <Dropdown.Toggle variant="link" size="sm" className="text-muted p-0">
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item><i className="bi bi-pencil me-2"></i>Yeniden Adlandır</Dropdown.Item>
                                                        <Dropdown.Item className="text-danger"><i className="bi bi-trash me-2"></i>Sil</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Files */}
                                    {filteredFiles.map(file => {
                                        const { icon, color } = getFileIcon(file.mime_type);
                                        return (
                                            <tr 
                                                key={`file-${file.id}`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, file)}
                                                style={{cursor: 'grab'}}
                                            >
                                                <td className="text-center">
                                                    <i className={`bi ${icon} fs-5`} style={{color}}></i>
                                                </td>
                                                <td>
                                                    <div className="fw-medium">{file.name || file.original_name}</div>
                                                    <small className="text-muted">{file.mime_type}</small>
                                                </td>
                                                <td className="text-muted">{file.size_display}</td>
                                                <td className="text-muted">{new Date(file.created_at).toLocaleDateString('tr-TR')}</td>
                                                <td>
                                                    {file.is_synced_to_drive ? (
                                                        <i className="bi bi-cloud-check-fill text-success"></i>
                                                    ) : driveStatus.is_connected ? (
                                                        <Button size="sm" variant="link" className="p-0 text-muted" onClick={() => handleSyncToDrive(file.id)}>
                                                            <i className="bi bi-cloud-upload"></i>
                                                        </Button>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <Button size="sm" variant="outline-primary" title="İndir" onClick={() => handleDownload(file)}>
                                                            <i className="bi bi-download"></i>
                                                        </Button>
                                                        <Button size="sm" variant="outline-secondary" title="Kopyala" onClick={() => handleCopy(file)}>
                                                            <i className="bi bi-copy"></i>
                                                        </Button>
                                                        <Button size="sm" variant="outline-danger" title="Sil" onClick={() => { setDeleteTarget(file); setShowDeleteModal(true); }}>
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {filteredFolders.length === 0 && filteredFiles.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-5">
                                                <i className="bi bi-folder2-open display-4 text-muted"></i>
                                                <p className="text-muted mt-2">Bu klasör boş</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="p-3">
                                <div className="row g-3">
                                    {filteredFolders.map(folder => (
                                        <div 
                                            key={`folder-${folder.id}`} 
                                            className="col-6 col-md-4 col-lg-3 col-xl-2"
                                            onDragOver={(e) => handleDragOver(e, folder.id)}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, folder.id)}
                                        >
                                            <Card 
                                                className="h-100 text-center" 
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: dragOverFolder === folder.id ? '#e3f2fd' : undefined
                                                }} 
                                                onClick={() => handleOpenFolder(folder)}
                                            >
                                                <Card.Body>
                                                    <i className="bi bi-folder-fill display-4 text-warning"></i>
                                                    <div className="mt-2 text-truncate fw-medium">{folder.name}</div>
                                                    <small className="text-muted">{folder.file_count || 0} dosya</small>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    ))}
                                    {filteredFiles.map(file => {
                                        const { icon, color } = getFileIcon(file.mime_type);
                                        return (
                                            <div 
                                                key={`file-${file.id}`} 
                                                className="col-6 col-md-4 col-lg-3 col-xl-2"
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, file)}
                                            >
                                                <Card className="h-100 text-center" style={{cursor: 'grab'}}>
                                                    <Card.Body>
                                                        <i className={`bi ${icon} display-4`} style={{color}}></i>
                                                        <div className="mt-2 text-truncate fw-medium" title={file.name || file.original_name}>
                                                            {(file.name || file.original_name)?.substring(0, 15)}...
                                                        </div>
                                                        <small className="text-muted">{file.size_display}</small>
                                                    </Card.Body>
                                                </Card>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* Folder Modal */}
            <Modal show={showFolderModal} onHide={() => setShowFolderModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Yeni Klasör</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreateFolder}>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Klasör Adı</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Adsız klasör"
                                value={folderName}
                                onChange={e => setFolderName(e.target.value)}
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowFolderModal(false)}>İptal</Button>
                        <Button variant="primary" type="submit">Oluştur</Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Upload Modal */}
            <Modal show={showUploadModal} onHide={() => !uploading && setShowUploadModal(false)} centered>
                <Modal.Header closeButton={!uploading}>
                    <Modal.Title>Dosya Yükle</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleUpload}>
                    <Modal.Body>
                        <div 
                            className="border border-2 border-dashed rounded p-5 text-center"
                            style={{cursor: 'pointer'}}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <i className="bi bi-cloud-upload display-4 text-primary"></i>
                            <p className="mt-2 mb-0 text-muted">Dosya seçmek için tıklayın</p>
                        </div>
                        <Form.Control type="file" ref={fileInputRef} className="d-none" />
                        {driveStatus.is_connected && (
                            <Alert variant="info" className="mt-3 mb-0">
                                <small><i className="bi bi-info-circle me-1"></i>Dosya otomatik olarak Drive'a yüklenecek</small>
                            </Alert>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowUploadModal(false)} disabled={uploading}>İptal</Button>
                        <Button variant="primary" type="submit" disabled={uploading}>
                            {uploading ? <Spinner size="sm" /> : 'Yükle'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Dosyayı Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p><strong>{deleteTarget?.name || deleteTarget?.original_name}</strong> dosyasını silmek istediğinizden emin misiniz?</p>
                    {deleteTarget?.is_synced_to_drive && (
                        <Alert variant="warning">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Bu dosya Google Drive'dan da silinecektir!
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>İptal</Button>
                    <Button variant="danger" onClick={handleDelete}>Sil</Button>
                </Modal.Footer>
            </Modal>

            {/* Drive Files Modal */}
            <Modal show={showDriveModal} onHide={() => setShowDriveModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title><i className="bi bi-google me-2"></i>Google Drive Dosyaları</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {driveFiles.length === 0 ? (
                        <div className="text-center py-4 text-muted">Drive'da dosya bulunamadı</div>
                    ) : (
                        <Table hover>
                            <tbody>
                                {driveFiles.map(file => {
                                    const { icon, color } = getFileIcon(file.mimeType);
                                    return (
                                        <tr key={file.id}>
                                            <td style={{width: 40}}><i className={`bi ${icon}`} style={{color}}></i></td>
                                            <td>{file.name}</td>
                                            <td style={{width: 100}}>
                                                <Button size="sm" variant="success" onClick={() => handleImportFromDrive(file.id)}>
                                                    <i className="bi bi-download me-1"></i>Aktar
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
            </Modal>

            {/* Tree View Modal */}
            <Modal show={showTreeModal} onHide={() => setShowTreeModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title><i className="bi bi-diagram-3 me-2"></i>Dizin Yapısı</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{maxHeight: '500px', overflowY: 'auto'}}>
                    {/* Root files */}
                    {treeData.root_files?.length > 0 && (
                        <div className="mb-3">
                            <div className="text-muted small mb-2">Ana Klasör</div>
                            {treeData.root_files.map(file => (
                                <div 
                                    key={`root-file-${file.id}`}
                                    style={{
                                        padding: '6px 8px',
                                        paddingLeft: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <i className={`bi ${getFileIcon(file.mime_type).icon}`} style={{color: getFileIcon(file.mime_type).color}}></i>
                                    <span className="text-muted">{file.name || file.original_name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Folder tree */}
                    {treeData.folders?.map(folder => renderTreeFolder(folder))}
                    
                    {treeData.folders?.length === 0 && treeData.root_files?.length === 0 && (
                        <div className="text-center py-4 text-muted">
                            <i className="bi bi-folder2-open display-4"></i>
                            <p className="mt-2">Henüz dosya veya klasör yok</p>
                        </div>
                    )}
                </Modal.Body>
            </Modal>

            <style jsx global>{`
                .hover-bg-light:hover {
                    background-color: rgba(0,0,0,0.05);
                }
            `}</style>
        </Container>
    );
};

export default FilesPage;
