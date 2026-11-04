// Mientras carga la pantalla: bloques con la forma del contenido, sin saltos al aparecer
export default function DashboardLoading() {
    return (
        <div role="status" aria-busy="true" className="animate-pulse space-y-4 py-6">
            <span className="sr-only">Cargando</span>
            <div className="h-9 w-56 max-w-full bg-gray-100" />
            <div className="h-5 w-80 max-w-full bg-gray-100" />
            <div className="grid grid-cols-2 gap-3 pt-4 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-24 bg-gray-100" />
                ))}
            </div>
            <div className="h-64 bg-gray-100" />
        </div>
    );
}
