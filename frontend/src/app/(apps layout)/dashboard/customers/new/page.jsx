'use client'
import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Row, Alert, Spinner, Nav, Tab, Badge, InputGroup } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { customerService } from '@/services/customerService';
import Link from 'next/link';
import { 
    Building, User, Mail, Phone, World, MapPin, FileText, 
    BrandFacebook, BrandInstagram, BrandLinkedin, BrandTwitter,
    Calendar, CurrencyLira, Tags, ArrowLeft, DeviceFloppy
} from 'tabler-icons-react';

const NewCustomerPage = () => {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        defaultValues: {
            status: 'active',
            priority: 'normal',
            country: 'Türkiye'
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('basic');

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError(null);
            
            // Clean empty fields
            Object.keys(data).forEach(key => {
                if (data[key] === '' || data[key] === null) {
                    delete data[key];
                }
            });
            
            await customerService.createCustomer(data);
            router.push('/dashboard/customers');
        } catch (err) {
            console.error(err);
            setError("Müşteri oluşturulurken bir hata oluştu. Lütfen bilgileri kontrol edin.");
        } finally {
            setLoading(false);
        }
    };

    const priorityOptions = [
        { value: 'low', label: 'Düşük', color: 'secondary' },
        { value: 'normal', label: 'Normal', color: 'primary' },
        { value: 'high', label: 'Yüksek', color: 'warning' },
        { value: 'vip', label: 'VIP', color: 'danger' }
    ];

    const sourceOptions = [
        { value: '', label: 'Seçiniz...' },
        { value: 'website', label: 'Web Sitesi' },
        { value: 'referral', label: 'Referans' },
        { value: 'social_media', label: 'Sosyal Medya' },
        { value: 'google_ads', label: 'Google Ads' },
        { value: 'cold_call', label: 'Soğuk Arama' },
        { value: 'event', label: 'Etkinlik/Fuar' },
        { value: 'other', label: 'Diğer' }
    ];

    const industryOptions = [
        { value: '', label: 'Seçiniz...' },
        { value: 'technology', label: 'Teknoloji' },
        { value: 'healthcare', label: 'Sağlık' },
        { value: 'education', label: 'Eğitim' },
        { value: 'retail', label: 'Perakende' },
        { value: 'manufacturing', label: 'Üretim' },
        { value: 'construction', label: 'İnşaat' },
        { value: 'food', label: 'Gıda' },
        { value: 'tourism', label: 'Turizm' },
        { value: 'finance', label: 'Finans' },
        { value: 'real_estate', label: 'Gayrimenkul' },
        { value: 'automotive', label: 'Otomotiv' },
        { value: 'media', label: 'Medya/Reklam' },
        { value: 'legal', label: 'Hukuk' },
        { value: 'consulting', label: 'Danışmanlık' },
        { value: 'other', label: 'Diğer' }
    ];

    const statusOptions = [
        { value: 'active', label: 'Aktif', color: 'success' },
        { value: 'inactive', label: 'Pasif', color: 'secondary' },
        { value: 'suspended', label: 'Askıya Alındı', color: 'warning' }
    ];

    return (
        <Container fluid className="py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold" style={{ color: '#0e1327' }}>Yeni Müşteri Ekle</h2>
                    <p className="text-muted mb-0">Tüm müşteri bilgilerini detaylı olarak girin</p>
                </div>
                <Link href="/dashboard/customers" passHref>
                    <Button variant="outline-secondary" className="d-flex align-items-center gap-2">
                        <ArrowLeft size={18} />
                        Geri Dön
                    </Button>
                </Link>
            </div>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            <Form onSubmit={handleSubmit(onSubmit)}>
                <Row>
                    {/* Left Column - Tabs */}
                    <Col lg={9}>
                        <Card className="border-0 shadow-sm">
                            <Card.Body className="p-0">
                                <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
                                    <Nav variant="tabs" className="px-4 pt-3">
                                        <Nav.Item>
                                            <Nav.Link eventKey="basic" className="d-flex align-items-center gap-2">
                                                <Building size={16} />
                                                Firma Bilgileri
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="contact" className="d-flex align-items-center gap-2">
                                                <Phone size={16} />
                                                İletişim
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="address" className="d-flex align-items-center gap-2">
                                                <MapPin size={16} />
                                                Adres & Vergi
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="social" className="d-flex align-items-center gap-2">
                                                <BrandInstagram size={16} />
                                                Sosyal Medya
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="contract" className="d-flex align-items-center gap-2">
                                                <FileText size={16} />
                                                Sözleşme
                                            </Nav.Link>
                                        </Nav.Item>
                                    </Nav>

                                    <Tab.Content className="p-4">
                                        {/* Basic Info Tab */}
                                        <Tab.Pane eventKey="basic">
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Firma Adı <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Örn: ABC Teknoloji A.Ş."
                                                            {...register('company_name', { required: 'Firma adı zorunludur' })}
                                                            isInvalid={!!errors.company_name}
                                                        />
                                                        <Form.Control.Feedback type="invalid">{errors.company_name?.message}</Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Sektör Kategorisi</Form.Label>
                                                        <Form.Select {...register('industry')}>
                                                            {industryOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Yetkili Kişi <span className="text-danger">*</span></Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Ad Soyad"
                                                            {...register('contact_person', { required: 'Yetkili kişi zorunludur' })}
                                                            isInvalid={!!errors.contact_person}
                                                        />
                                                        <Form.Control.Feedback type="invalid">{errors.contact_person?.message}</Form.Control.Feedback>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Ünvan</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Örn: Genel Müdür, Pazarlama Direktörü"
                                                            {...register('title')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>Sektör</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Detaylı sektör bilgisi"
                                                            {...register('sector')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>Çalışan Sayısı</Form.Label>
                                                        <Form.Control 
                                                            type="number" 
                                                            placeholder="Örn: 50"
                                                            {...register('employee_count')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group>
                                                        <Form.Label>Yıllık Ciro</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Örn: 5-10 Milyon TL"
                                                            {...register('annual_revenue')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Web Sitesi</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><World size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="url" 
                                                                placeholder="https://www.example.com"
                                                                {...register('website')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Müşteri Kaynağı</Form.Label>
                                                        <Form.Select {...register('source')}>
                                                            {sourceOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Etiketler</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Virgülle ayırarak yazın: kurumsal, acil, önemli"
                                                            {...register('tags')}
                                                        />
                                                        <Form.Text className="text-muted">Virgülle ayırarak birden fazla etiket ekleyebilirsiniz</Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab.Pane>

                                        {/* Contact Tab */}
                                        <Tab.Pane eventKey="contact">
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><Mail size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="email" 
                                                                placeholder="email@example.com"
                                                                {...register('email', { required: 'Email zorunludur' })}
                                                                isInvalid={!!errors.email}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>İkinci Email</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><Mail size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="email" 
                                                                placeholder="alternatif@example.com"
                                                                {...register('secondary_email')}
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
                                                                {...register('phone', { required: 'Telefon zorunludur' })}
                                                                isInvalid={!!errors.phone}
                                                            />
                                                            <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>İkinci Telefon</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><Phone size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="tel" 
                                                                placeholder="05XX XXX XX XX"
                                                                {...register('secondary_phone')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Doğum Tarihi</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><Calendar size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="date" 
                                                                {...register('birth_date')}
                                                            />
                                                        </InputGroup>
                                                        <Form.Text className="text-muted">Doğum günü hatırlatması için</Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab.Pane>

                                        {/* Address Tab */}
                                        <Tab.Pane eventKey="address">
                                            <Row className="g-3">
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Adres</Form.Label>
                                                        <Form.Control 
                                                            as="textarea" 
                                                            rows={2} 
                                                            placeholder="Sokak, Mahalle, Bina No, Daire No"
                                                            {...register('address')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label>Şehir</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="İstanbul"
                                                            {...register('city')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label>İlçe</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Kadıköy"
                                                            {...register('district')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label>Posta Kodu</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="34000"
                                                            {...register('postal_code')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={3}>
                                                    <Form.Group>
                                                        <Form.Label>Ülke</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            {...register('country')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                
                                                <Col md={12}><hr className="my-2" /></Col>
                                                
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Vergi Dairesi</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="Örn: Kadıköy"
                                                            {...register('tax_office')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Vergi Numarası</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="10 haneli vergi no"
                                                            {...register('tax_number')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Ticaret Sicil No</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            {...register('trade_registry_no')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>MERSİS No</Form.Label>
                                                        <Form.Control 
                                                            type="text" 
                                                            placeholder="16 haneli MERSİS numarası"
                                                            {...register('mersis_no')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab.Pane>

                                        {/* Social Media Tab */}
                                        <Tab.Pane eventKey="social">
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Facebook</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><BrandFacebook size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="url" 
                                                                placeholder="https://facebook.com/sayfaadi"
                                                                {...register('facebook')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Instagram</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><BrandInstagram size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="text" 
                                                                placeholder="@kullaniciadi"
                                                                {...register('instagram')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>LinkedIn</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><BrandLinkedin size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="url" 
                                                                placeholder="https://linkedin.com/company/sirket"
                                                                {...register('linkedin')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Twitter / X</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><BrandTwitter size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="text" 
                                                                placeholder="@kullaniciadi"
                                                                {...register('twitter')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab.Pane>

                                        {/* Contract Tab */}
                                        <Tab.Pane eventKey="contract">
                                            <Row className="g-3">
                                                <Col md={12}>
                                                    <h6 className="mb-3">Alınan Hizmetler</h6>
                                                    <div className="d-flex flex-wrap gap-3">
                                                        <Form.Check 
                                                            type="switch"
                                                            id="seo-switch"
                                                            label="SEO Optimizasyonu"
                                                            {...register('has_seo_service')}
                                                        />
                                                        <Form.Check 
                                                            type="switch"
                                                            id="hosting-switch"
                                                            label="Hosting / Sunucu"
                                                            {...register('has_hosting_service')}
                                                        />
                                                        <Form.Check 
                                                            type="switch"
                                                            id="social-switch"
                                                            label="Sosyal Medya Yönetimi"
                                                            {...register('has_social_media_service')}
                                                        />
                                                        <Form.Check 
                                                            type="switch"
                                                            id="ads-switch"
                                                            label="Reklam Yönetimi"
                                                            {...register('has_ads_service')}
                                                        />
                                                        <Form.Check 
                                                            type="switch"
                                                            id="webdesign-switch"
                                                            label="Web Tasarım"
                                                            {...register('has_web_design_service')}
                                                        />
                                                    </div>
                                                </Col>
                                                
                                                <Col md={12}><hr className="my-2" /></Col>
                                                
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Sözleşme Başlangıç Tarihi</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><Calendar size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="date" 
                                                                {...register('contract_start_date')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Sözleşme Bitiş Tarihi</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><Calendar size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="date" 
                                                                {...register('contract_end_date')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Aylık Ücret (₺)</Form.Label>
                                                        <InputGroup>
                                                            <InputGroup.Text><CurrencyLira size={16} /></InputGroup.Text>
                                                            <Form.Control 
                                                                type="number" 
                                                                step="0.01"
                                                                placeholder="5000.00"
                                                                {...register('monthly_fee')}
                                                            />
                                                        </InputGroup>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Ödeme Günü</Form.Label>
                                                        <Form.Select {...register('payment_day')}>
                                                            <option value="">Seçiniz...</option>
                                                            {[...Array(28)].map((_, i) => (
                                                                <option key={i+1} value={i+1}>{i+1}</option>
                                                            ))}
                                                        </Form.Select>
                                                        <Form.Text className="text-muted">Her ayın hangi gününde ödeme alınacak</Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={12}>
                                                    <Form.Group>
                                                        <Form.Label>Notlar</Form.Label>
                                                        <Form.Control 
                                                            as="textarea" 
                                                            rows={3} 
                                                            placeholder="Müşteri hakkında önemli notlar..."
                                                            {...register('notes')}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Tab.Container>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Right Column - Status & Actions */}
                    <Col lg={3}>
                        <Card className="border-0 shadow-sm mb-3">
                            <Card.Header className="bg-white border-bottom">
                                <h6 className="mb-0">Durum & Öncelik</h6>
                            </Card.Header>
                            <Card.Body>
                                <Form.Group className="mb-3">
                                    <Form.Label>Durum</Form.Label>
                                    <Form.Select {...register('status')}>
                                        {statusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Öncelik</Form.Label>
                                    <div className="d-flex gap-2 flex-wrap">
                                        {priorityOptions.map(opt => (
                                            <Form.Check
                                                key={opt.value}
                                                type="radio"
                                                id={`priority-${opt.value}`}
                                                label={<Badge bg={opt.color}>{opt.label}</Badge>}
                                                value={opt.value}
                                                {...register('priority')}
                                            />
                                        ))}
                                    </div>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <Card.Body className="d-grid gap-2">
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    type="submit" 
                                    disabled={loading}
                                    className="d-flex align-items-center justify-content-center gap-2"
                                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', border: 'none' }}
                                >
                                    {loading ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <DeviceFloppy size={20} />
                                    )}
                                    Müşteriyi Kaydet
                                </Button>
                                <Button 
                                    variant="outline-secondary" 
                                    onClick={() => router.back()} 
                                    disabled={loading}
                                >
                                    İptal
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
};

export default NewCustomerPage;
