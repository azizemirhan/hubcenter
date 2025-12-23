import * as Icons from 'tabler-icons-react';

export const SidebarMenu = [
    {
        group: '',
        contents: [
            {
                name: 'Dashboard',
                icon: <Icons.LayoutDashboard />,
                path: '/dashboard',
            },
        ]
    },
    {
        group: 'CRM',
        contents: [
            {
                name: 'Müşteriler',
                icon: <Icons.Users />,
                path: '/dashboard/customers',
            },
            {
                name: 'Potansiyel Müşteriler',
                icon: <Icons.Target />,
                path: '/dashboard/leads',
            },
        ]
    },
    {
        group: 'Projeler',
        contents: [
            {
                name: 'Projeler',
                icon: <Icons.Briefcase />,
                path: '/dashboard/projects',
            },
            {
                name: 'Görevler',
                icon: <Icons.Checkbox />,
                path: '/dashboard/tasks',
            },
        ]
    },
    {
        group: 'Hizmetler',
        contents: [
            {
                name: 'Domainler',
                icon: <Icons.World />,
                path: '/dashboard/domains',
            },
            {
                name: 'Hosting',
                icon: <Icons.Server />,
                path: '/dashboard/hosting',
            },
            {
                name: 'SEO',
                icon: <Icons.ChartLine />,
                path: '/dashboard/seo',
            },
        ]
    },
    {
        group: 'Finans',
        contents: [
            {
                name: 'Faturalar',
                icon: <Icons.FileInvoice />,
                path: '/dashboard/invoices',
            },
            {
                name: 'Gelir/Gider',
                icon: <Icons.Wallet />,
                path: '/dashboard/finance',
            },
        ]
    },
    {
        group: 'Yönetim',
        contents: [
            {
                name: 'Dosyalar',
                icon: <Icons.Folder />,
                path: '/dashboard/files',
            },
            {
                name: 'Kasa (Vault)',
                icon: <Icons.Lock />,
                path: '/dashboard/vault',
            },
            {
                name: 'Ayarlar',
                icon: <Icons.Settings />,
                path: '/dashboard/settings',
            },
        ]
    },
]