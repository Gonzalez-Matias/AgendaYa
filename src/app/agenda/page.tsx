"use client";

import { useState, useEffect } from "react";
import { CalendarToolbar } from "./components/CalendarToolbar";
import { CalendarioMensual } from "./components/CalendarioMensual";
import { CalendarioSemanal } from "./components/CalendarioSemanal";
import { ListaReservas } from "./components/ListaReservas";
import { Sidebar } from "./components/Sidebar";
import type { ModoVista, ReservaVista } from "@/services/visualizacion";
import styles from "./page.module.css";

export default function AgendaPage() {
  const [modoVista, setModoVista] = useState<ModoVista>("calendario");
  const [subVista, setSubVista] = useState<"semanal" | "mensual">("mensual");
  const [fechaActual, setFechaActual] = useState(new Date());
  const [reservas, setReservas] = useState<ReservaVista[]>([]);
  const [adminId, setAdminId] = useState<number | null>(null);
  const [adminNombre, setAdminNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    fetch("/api/administradores")
      .then((r) => r.json())
      .then((data) => {
        if (data.administradores?.length > 0) {
          setAdminId(data.administradores[0].id);
          setAdminNombre(data.administradores[0].nombre);
        }
      })
      .catch(() => setAdminId(1));
  }, []);

  useEffect(() => {
    if (!adminId) return;
    cargarReservas();
  }, [adminId, fechaActual, subVista]);

  async function cargarReservas() {
    setCargando(true);
    try {
      let desde: Date;
      let hasta: Date;

      if (subVista === "semanal") {
        const day = fechaActual.getDay();
        const diff = fechaActual.getDate() - day + (day === 0 ? -6 : 1);
        desde = new Date(fechaActual);
        desde.setDate(diff);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 6);
        hasta.setHours(23, 59, 59, 999);
      } else {
        desde = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        desde.setHours(0, 0, 0, 0);
        hasta = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        hasta.setHours(23, 59, 59, 999);
      }

      const res = await fetch("/api/visualizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          administradorId: adminId,
          fechaDesde: desde.toISOString(),
          fechaHasta: hasta.toISOString(),
          modoVista,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReservas(data.reservas || []);
      }
    } catch (e) {
      console.error("Error cargando reservas", e);
    } finally {
      setCargando(false);
    }
  }

  function cambiarFecha(delta: number) {
    setFechaActual((prev) => {
      const nueva = new Date(prev);
      if (subVista === "semanal") {
        nueva.setDate(nueva.getDate() + delta * 7);
      } else {
        nueva.setMonth(nueva.getMonth() + delta);
      }
      return nueva;
    });
  }

  function goToMonth(year: number, month: number) {
    setFechaActual(new Date(year, month, 1));
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" fill="white" />
            </svg>
          </div>
          <span className={styles.logoText}>AgendaYa</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navItem}>
            <span className={styles.navLabel}>Tipos de Eventos</span>
          </div>
          <div className={styles.navItem}>
            <span className={styles.navLabel}>Notificaciones</span>
          </div>
          <div className={styles.navItem}>
            <span className={styles.navLabel}>Disponibilidad</span>
          </div>
          <div className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={`${styles.navLabel} ${styles.navLabelActive}`}>Gestión de Reservas</span>
          </div>
        </nav>

        <div className={styles.userArea}>
          <div className={styles.userIcon}>
            {adminNombre ? adminNombre.split(" ").map(p => p.charAt(0)).join("").toUpperCase().slice(0, 2) : "A"}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <div className={`${styles.main} ${modoVista === "calendario" && subVista === "semanal" ? styles.mainFull : ""}`}>
          <CalendarToolbar
            fechaActual={fechaActual}
            modoVista={modoVista}
            subVista={subVista}
            onChangeFecha={cambiarFecha}
            onGoToMonth={goToMonth}
            onChangeModo={setModoVista}
            onChangeSubVista={setSubVista}
          />

          {cargando ? (
            <div style={{ padding: 40, textAlign: "center", color: "#737688" }}>
              Cargando reservas...
            </div>
          ) : modoVista === "calendario" ? (
            subVista === "semanal" ? (
              <CalendarioSemanal reservas={reservas} fechaActual={fechaActual} />
            ) : (
              <CalendarioMensual reservas={reservas} fechaActual={fechaActual} />
            )
          ) : (
            <ListaReservas reservas={reservas} fechaActual={fechaActual} subVista={subVista} />
          )}
        </div>

        <Sidebar reservas={reservas} />
      </div>
    </div>
  );
}
