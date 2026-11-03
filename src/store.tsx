import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

// export const apiUrl = 'http://MiIP:8080/api/cine';

export const apiUrl = 'http://localhost:8080/api/cine';

const CineContext = createContext<any>(null);
export const useCine = () => useContext(CineContext);

export const CineProvider = ({ children }: { children: React.ReactNode }) => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [vistaActual, setVistaActual] = useState('cartelera');
  const [usuario, setUsuario] = useState<any>(null);
  const [mostrarModalLogin, setMostrarModalLogin] = useState(false);
  const [peliculas, setPeliculas] = useState<any[]>([]);
  const [snacks, setSnacks] = useState<any[]>([]);
  const [misTickets, setMisTickets] = useState<any[]>([]);
  const [ticketComprado, setTicketComprado] = useState<any>(null);
  const [seleccionPelicula, setSeleccionPelicula] = useState<any>(null);
  const [seleccionHorario, setSeleccionHorario] = useState<any>(null);
  const [asientos, setAsientos] = useState<any[]>([]);
  const [carritoSnacks, setCarritoSnacks] = useState<any[]>([]);
  
  const precioPorBoleto = 14.00;

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const asientosSeleccionados = useMemo(() => asientos.filter(a => a.estado === 'seleccionado'), [asientos]);
  const subtotalEntradas = useMemo(() => asientosSeleccionados.length * precioPorBoleto, [asientosSeleccionados]);
  const subtotalSnacks = useMemo(() => carritoSnacks.reduce((acc, item) => acc + (item.snack.precio * item.cantidad), 0), [carritoSnacks]);
  const totalPagar = useMemo(() => subtotalEntradas + subtotalSnacks, [subtotalEntradas, subtotalSnacks]);

  const cargarDataInicial = async () => {
    try {
      const [pRes, sRes] = await Promise.all([fetch(`${apiUrl}/peliculas`), fetch(`${apiUrl}/snacks`)]);
      if (pRes.ok) setPeliculas(await pRes.json());
      if (sRes.ok) setSnacks(await sRes.json());
    } catch (e) { console.error('Error conectando con el backend de Go', e); }
  };

  const iniciarSesionBackend = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error de credenciales');
      
      setUsuario(data);
      setMostrarModalLogin(false);

      if (data.rol === 'ADMIN') {
        setVistaActual('admin');
      } else {
        setVistaActual('cartelera');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const cerrarSesion = () => { setUsuario(null); setVistaActual('cartelera'); };

  const resetearCompra = () => {
    setSeleccionPelicula(null); setSeleccionHorario(null);
    setAsientos([]); setCarritoSnacks([]); setTicketComprado(null);
  };

  const modificarSnack = (snack: any, cambio: number) => {
    setCarritoSnacks(prev => {
      const idx = prev.findIndex((i: any) => i.snack.id === snack.id);
      if (idx > -1) {
        const nuevaCant = prev[idx].cantidad + cambio;
        if (nuevaCant <= 0) return prev.filter((i: any) => i.snack.id !== snack.id);
        const copia = [...prev]; copia[idx].cantidad = nuevaCant; return copia;
      } else if (cambio > 0) { return [...prev, { snack, cantidad: 1 }]; }
      return prev;
    });
  };

  const getCantidadSnack = (id: number) => {
    const item = carritoSnacks.find(i => i.snack.id === id);
    return item ? item.cantidad : 0;
  };

  const confirmarCompra = async () => {
    if (!usuario) { setMostrarModalLogin(true); return; }
    const asientosIds = asientosSeleccionados.map(a => a.id);
    const listSnacks = carritoSnacks.map(i => ({ nombre: i.snack.nombre, cantidad: i.cantidad, precio: i.snack.precio }));

    if (asientosIds.length === 0 && listSnacks.length === 0) { alert('Debe seleccionar al menos un asiento o un snack.'); return; }

    const payload = {
      peliculaId: seleccionPelicula ? seleccionPelicula.codigoPelicula : 'COMPRA_DULCERIA',
      horario: seleccionHorario ? seleccionHorario : 'Venta Directa',
      asientos: asientosIds, snacks: listSnacks, totalPagado: totalPagar, usuarioId: usuario.id
    };

    try {
      const res = await fetch(`${apiUrl}/comprar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const ticketBD = await res.json();
      if (!res.ok) throw new Error(ticketBD.mensaje || 'Error en compra');
      
      setTicketComprado({
        idCompra: '' + ticketBD.id, pelicula: seleccionPelicula ? seleccionPelicula.titulo : 'Dulcería CineStar',
        horario: payload.horario, asientos: asientosIds, snacks: listSnacks, total: totalPagar
      });
      setVistaActual('ticket');
    } catch (e: any) { alert(e.message || 'Error registrando la transacción'); }
  };

  const verMisTickets = async () => {
    if (!usuario) return;
    try {
      const res = await fetch(`${apiUrl}/mis-tickets?usuarioId=${usuario.id}`);
      const data = await res.json();
      const formatted = data.map((t: any) => ({
        idCompra: '' + t.id, 
        pelicula: peliculas.find((p: any) => p.codigoPelicula === t.peliculaId)?.titulo || (t.peliculaId === 'COMPRA_DULCERIA' ? 'Dulcería CineStar' : t.peliculaId),
        horario: t.horario, 
        asientos: t.asientos, 
        snacks: t.snacks || [], 
        total: t.totalPagado, 
        estado: t.estado
      }));
      setMisTickets(formatted);
      setVistaActual('mis-tickets');
    } catch (e) { 
      console.error('Error cargando tickets:', e); 
    }
  };

  return (
    <CineContext.Provider value={{
      darkMode, setDarkMode, vistaActual, setVistaActual, usuario, setUsuario, mostrarModalLogin, setMostrarModalLogin,
      peliculas, setPeliculas, snacks, setSnacks, misTickets, setMisTickets, ticketComprado, setTicketComprado,
      seleccionPelicula, setSeleccionPelicula, seleccionHorario, setSeleccionHorario, asientos, setAsientos,
      carritoSnacks, setCarritoSnacks, precioPorBoleto, asientosSeleccionados, subtotalEntradas, subtotalSnacks, totalPagar,
      cargarDataInicial, cerrarSesion, resetearCompra, modificarSnack, getCantidadSnack, confirmarCompra, iniciarSesionBackend, verMisTickets
    }}>
      {children}
    </CineContext.Provider>
  );
};