export default function DashboardPage() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium">Toplam Müşteri</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">124</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium">Aktif Projeler</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">8</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-gray-500 text-sm font-medium">Bekleyen Tahsilat</h3>
                <p className="text-2xl font-bold text-gray-900 mt-2">₺ 45,250</p>
            </div>

            <div className="col-span-full bg-white p-6 rounded-lg shadow-sm mt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Son Aktiviteler</h3>
                <div className="text-gray-500 text-sm">Henüz aktivite yok.</div>
            </div>
        </div>
    )
}
