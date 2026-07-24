export default function Home() {
  const endpoints = [
    { method: "GET", path: "/api/administradores", desc: "Listar administradores", body: null },
    { method: "POST", path: "/api/visualizacion", desc: "Listar reservas (calendario/lista)", body: `{"administradorId": 1, "fechaDesde": "2026-07-20T00:00:00.000Z", "fechaHasta": "2026-08-30T23:59:59.999Z", "modoVista": "lista"}` },
    { method: "POST", path: "/api/disponibilidad", desc: "Consultar slots disponibles", body: `{"tipoEventoId": 1, "fechaDesde": "2026-07-23T00:00:00.000Z", "fechaHasta": "2026-07-24T23:59:59.999Z"}` },
    { method: "POST", path: "/api/reservas/cancelar", desc: "Cancelar una reserva", body: `{"reservaId": 1, "motivo": "Cliente no puede asistir"}` },
    { method: "POST", path: "/api/reservas/completar", desc: "Completar una reserva confirmada", body: `{"reservaId": 1}` },
    { method: "POST", path: "/api/reservas/confirmar", desc: "Confirmar una reserva pendiente", body: `{"reservaId": 1}` },
    { method: "POST", path: "/api/reservas/reagendar", desc: "Reagendar una reserva", body: `{"reservaId": 1, "nuevaFechaHoraInicio": "2026-08-15T10:00:00.000Z", "motivo": "Cambio de horario"}` },
    { method: "GET", path: "/api/reservas/1", desc: "Obtener detalle de reserva", body: null },
  ];

  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>AgendaYa</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>API de gestión de agenda y reservas</p>

      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Endpoints</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {endpoints.map((ep) => (
          <div key={ep.path} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
              <span style={{
                background: ep.method === "GET" ? "#4CAF50" : "#FF9800",
                color: "white", padding: "3px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600
              }}>
                {ep.method}
              </span>
              <code style={{ fontSize: 14, fontWeight: 500 }}>{ep.path}</code>
            </div>
            <p style={{ color: "#555", fontSize: 14, margin: "4px 0" }}>{ep.desc}</p>
            {ep.body && (
              <pre style={{
                background: "#f5f5f5", padding: 10, borderRadius: 4, fontSize: 12,
                overflow: "auto", margin: 0
              }}>
                {ep.body}
              </pre>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 32, color: "#999", fontSize: 12 }}>
        Usar con Postman o curl. Base URL: http://localhost:3000
      </p>
    </main>
  );
}
