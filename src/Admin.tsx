import { useState, useEffect } from 'react';
import { useCine, apiUrl } from './store';

export default function Admin() {
  const cine = useCine();
  const [pestana, setPestana] = useState('dashboard');
  
  const [modalPeliculaAbierto, setModalPeliculaAbierto] = useState(false);
  const [modalSnackAbierto, setModalSnackAbierto] = useState(false);

  const [ventasGlobales, setVentasGlobales] = useState<any[]>([]);

  const [formPelicula, setFormPelicula] = useState({ codigoPelicula: '', titulo: '', genero: '', duracion: '', imagen: '', horarios: ['16:00', '19:00', '21:30'] });
  const [formSnack, setFormSnack] = useState({ nombre: '', descripcion: '', precio: '', imagen: '' });
  
  const [ticketId, setTicketId] = useState('');
  const [resultadoValidacion, setResultadoValidacion] = useState<any>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [resultadoQrAuto, setResultadoQrAuto] = useState<any>(null);

  useEffect(() => {
    if (pestana === 'ventas') {
      cargarVentasGlobales();
    }
  }, [pestana]);

  const cargarVentasGlobales = async () => {
    try {
      const res = await fetch(`${apiUrl}/admin/ventas`);
      if (res.ok) {
        const data = await res.json();
        setVentasGlobales(data);
      }
    } catch (e) {
      console.error('Error cargando reporte de ventas', e);
    }
  };

  const manejarImagenLocal = (e: any, tipo: 'pelicula' | 'snack') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (tipo === 'pelicula') {
          setFormPelicula({ ...formPelicula, imagen: reader.result as string });
        } else {
          setFormSnack({ ...formSnack, imagen: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarPelicula = async () => {
    if (!formPelicula.codigoPelicula || !formPelicula.titulo) { alert('Complete los campos obligatorios'); return; }
    await fetch(`${apiUrl}/admin/peliculas`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formPelicula) });
    cine.cargarDataInicial(); 
    setFormPelicula({ codigoPelicula: '', titulo: '', genero: '', duracion: '', imagen: '', horarios: ['16:00', '19:00', '21:30'] });
    setModalPeliculaAbierto(false);
    alert('Película registrada con éxito');
  };

  const eliminarPelicula = async (id: number) => {
    if (window.confirm('¿Dar de baja esta película?')) { await fetch(`${apiUrl}/admin/peliculas/${id}`, { method: 'DELETE' }); cine.cargarDataInicial(); }
  };

  const guardarSnack = async () => {
    if (!formSnack.nombre || !formSnack.precio) { alert('Complete nombre y precio'); return; }
    await fetch(`${apiUrl}/admin/snacks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({...formSnack, precio: parseFloat(formSnack.precio)}) });
    cine.cargarDataInicial(); 
    setFormSnack({ nombre: '', descripcion: '', precio: '', imagen: '' }); 
    setModalSnackAbierto(false);
    alert('Snack registrado');
  };

  const eliminarSnack = async (id: number) => {
    if (window.confirm('¿Eliminar este snack?')) { await fetch(`${apiUrl}/admin/snacks/${id}`, { method: 'DELETE' }); cine.cargarDataInicial(); }
  };

  const validarTicket = async () => {
    const idClean = ticketId.replace('TKT-', '').trim();
    if (!idClean) return;
    try {
      const res = await fetch(`${apiUrl}/admin/validar-ticket/${idClean}`, { method: 'POST' });
      const data = await res.json();
      setResultadoValidacion({ ...data, valido: res.ok });
    } catch (e) { setResultadoValidacion({ valido: false, mensaje: 'Error al conectar' }); }
  };

  const encenderCamaraPuerta = async () => {
    try {
      setEscaneando(true);
      const videoEl = document.getElementById('video-qr') as HTMLVideoElement;
      if (!videoEl) return;
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoEl.srcObject = stream;
      (window as any).__mediaStream = stream;
    } catch (e) {
      setEscaneando(false);
      alert('No se pudo acceder a la cámara del dispositivo.');
    }
  };

  const apagarCamaraPuerta = () => {
    if ((window as any).__mediaStream) {
      (window as any).__mediaStream.getTracks().forEach((track: any) => track.stop());
    }
    const videoEl = document.getElementById('video-qr') as HTMLVideoElement;
    if (videoEl) videoEl.srcObject = null;
    setEscaneando(false);
  };

  const totalVentasDinero = ventasGlobales.reduce((acc, t) => acc + (t.totalPagado || 0), 0);

  return (
    <div className="fixed inset-0 bg-zinc-100 text-zinc-900 z-50 flex font-sans overflow-hidden">
      <aside className="w-64 bg-zinc-950 text-white flex flex-col shadow-2xl z-20 border-r border-zinc-800">
        <div className="p-6 text-center border-b border-zinc-800/80">
          <h2 className="text-2xl font-black text-red-600 tracking-wider">CineStar</h2>
          <p className="text-[10px] text-amber-400 font-bold tracking-widest mt-1 uppercase">ERP Operativo & Control</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <button onClick={() => setPestana('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${pestana === 'dashboard' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>📊 Resumen General</button>
          <button onClick={() => setPestana('peliculas')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${pestana === 'peliculas' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>🎬 Cartelera Activa</button>
          <button onClick={() => setPestana('snacks')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${pestana === 'snacks' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>🍿 Inventario Dulcería</button>
          <button onClick={() => setPestana('ventas')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${pestana === 'ventas' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>💰 Reporte de Ventas</button>
          <button onClick={() => setPestana('qr')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition flex items-center gap-3 ${pestana === 'qr' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}>🔍 Validador de Puerta</button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button onClick={() => cine.setVistaActual('cartelera')} className="w-full flex justify-between items-center px-4 py-3 text-xs font-black text-red-400 hover:bg-zinc-900 rounded-xl transition uppercase tracking-wider">Volver al Sitio <span>&rarr;</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-50">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 shrink-0 border-b border-zinc-200">
          <h1 className="text-lg font-black text-zinc-800 capitalize tracking-wide flex items-center gap-2">⚙️ Módulo: {pestana}</h1>
          <div className="flex items-center gap-3 bg-zinc-100 px-4 py-2 rounded-full border border-zinc-200">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-extrabold text-zinc-700">Administrador: {cine.usuario?.nombre}</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {pestana === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">🎬</div>
                <div><p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Películas</p><p className="text-3xl font-black text-zinc-900 mt-1">{cine.peliculas.length}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">🍿</div>
                <div><p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Snacks</p><p className="text-3xl font-black text-zinc-900 mt-1">{cine.snacks.length}</p></div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner">💰</div>
                <div><p className="text-xs text-zinc-400 font-extrabold uppercase tracking-wider">Ingresos Totales</p><p className="text-2xl font-black text-emerald-600 mt-1">S/. {totalVentasDinero.toFixed(2)}</p></div>
              </div>
            </div>
          )}

          {pestana === 'peliculas' && (
            <div className="max-w-6xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-zinc-700 uppercase tracking-wider">Gestión de Funciones en Cartelera</h3>
                <button onClick={() => setModalPeliculaAbierto(true)} className="px-5 py-3 bg-red-600 text-white font-black rounded-xl text-xs hover:bg-red-700 shadow-lg shadow-red-600/20 transition">
                  + Registrar Nueva Película
                </button>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="bg-zinc-100 text-zinc-500 text-[11px] uppercase tracking-wider border-b border-zinc-200"><th className="p-4 font-bold">Afiche</th><th className="p-4 font-bold">Detalles de Película</th><th className="p-4 font-bold">Duración</th><th className="p-4 font-bold text-right">Gestión</th></tr></thead>
                  <tbody className="divide-y divide-zinc-100">
                    {cine.peliculas.map((p: any) => (
                      <tr key={p.id} className="hover:bg-zinc-50/80 transition">
                        <td className="p-4"><img src={p.imagen} className="w-12 h-16 object-cover rounded-lg shadow-sm border border-zinc-200" /></td>
                        <td className="p-4"><p className="font-bold text-zinc-900">{p.titulo}</p><p className="text-xs text-zinc-500 font-medium">{p.codigoPelicula} | {p.genero}</p></td>
                        <td className="p-4 text-sm text-zinc-700 font-bold">{p.duracion}</td>
                        <td className="p-4 text-right"><button onClick={() => eliminarPelicula(p.id)} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl text-xs font-black transition">Dar de Baja</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pestana === 'snacks' && (
            <div className="max-w-6xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-zinc-700 uppercase tracking-wider">Inventario de Chocolatería y Snacks</h3>
                <button onClick={() => setModalSnackAbierto(true)} className="px-5 py-3 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition">
                  + Registrar Nuevo Snack
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cine.snacks.map((s: any) => (
                  <div key={s.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <img src={s.imagen} className="w-20 h-20 object-cover rounded-xl border border-zinc-200" />
                    <div className="flex-1">
                      <h4 className="font-bold text-zinc-900 text-sm mb-0.5 line-clamp-1">{s.nombre}</h4>
                      <p className="text-xs text-amber-600 font-black mb-2">S/. {s.precio.toFixed(2)}</p>
                      <button onClick={() => eliminarSnack(s.id)} className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-[10px] font-black uppercase tracking-wider transition">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pestana === 'ventas' && (
            <div className="max-w-6xl">
              <h3 className="text-sm font-black text-zinc-700 uppercase tracking-wider mb-6">Reporte General de Transacciones y Ventas</h3>
              <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 text-zinc-500 text-[11px] uppercase tracking-wider border-b border-zinc-200">
                      <th className="p-4 font-bold">ID Ticket</th>
                      <th className="p-4 font-bold">Cliente ID</th>
                      <th className="p-4 font-bold">Función / Ítem</th>
                      <th className="p-4 font-bold">Horario</th>
                      <th className="p-4 font-bold">Estado</th>
                      <th className="p-4 font-bold text-right">Total Pagado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {ventasGlobales.map((v: any) => (
                      <tr key={v.id} className="hover:bg-zinc-50 transition">
                        <td className="p-4 font-mono font-black text-amber-600">TKT-{v.id}</td>
                        <td className="p-4 font-bold text-zinc-700">USR-{v.usuarioId}</td>
                        <td className="p-4 font-bold text-zinc-900">{v.peliculaId} {v.asientos?.length > 0 ? `(${v.asientos.join(', ')})` : ''}</td>
                        <td className="p-4 text-zinc-500">{v.horario}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${v.estado === 'USADO' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{v.estado}</span></td>
                        <td className="p-4 text-right font-black text-zinc-900 text-sm">S/. {(v.totalPagado || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pestana === 'qr' && (
            <div className="max-w-md mx-auto text-center mt-6">
              <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-xl mb-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">📱</div>
                <h2 className="text-2xl font-black text-zinc-900 mb-1">Control de Puerta</h2>
                <p className="text-zinc-500 text-xs mb-6 font-medium">Validación de Tickets en Acceso</p>
                
                <div className="mb-4 rounded-2xl overflow-hidden bg-black border-2 border-zinc-800 relative aspect-video flex items-center justify-center">
                  <video id="video-qr" autoPlay playsInline className="w-full h-full object-cover"></video>
                  <div className="absolute inset-0 border-2 border-red-500/30 pointer-events-none flex items-center justify-center">
                    <span className="bg-black/70 text-amber-400 text-[10px] px-3 py-1 rounded-lg font-bold">Cámara Operativa</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={encenderCamaraPuerta} 
                    className="flex-1 py-3 bg-zinc-900 text-white font-black rounded-xl text-xs hover:bg-zinc-800 transition shadow-md"
                  >
                    ▶ Encender Cámara
                  </button>
                  <button 
                    onClick={apagarCamaraPuerta} 
                    className="py-3 px-4 bg-red-50 text-red-600 font-black rounded-xl text-xs hover:bg-red-100 transition"
                  >
                    Apagar
                  </button>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={ticketId} 
                    onChange={(e) => setTicketId(e.target.value)} 
                    placeholder="Ingresa ID del ticket (Ej: 1)" 
                    className="flex-1 bg-zinc-50 border border-zinc-300 p-3.5 rounded-xl text-zinc-900 text-center font-mono text-sm outline-none focus:border-red-600 uppercase" 
                  />
                  <button onClick={validarTicket} className="px-5 py-3 bg-red-600 text-white font-black text-xs rounded-xl hover:bg-red-700 transition">Validar</button>
                </div>
              </div>

              {resultadoValidacion && (
                <div className={`p-6 rounded-3xl border-2 shadow-sm bg-white animate-fade-in ${resultadoValidacion.valido ? 'border-emerald-500' : 'border-red-500'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black ${resultadoValidacion.valido ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {resultadoValidacion.valido ? '✓' : '✗'}
                  </div>
                  <p className={`text-xl font-black mb-1 ${resultadoValidacion.valido ? 'text-emerald-600' : 'text-red-600'}`}>
                    {resultadoValidacion.valido ? 'ACCESO APROBADO' : 'ACCESO DENEGADO'}
                  </p>
                  <p className="text-xs font-bold text-zinc-600 mb-4">{resultadoValidacion.mensaje}</p>
                  {resultadoValidacion.ticket && (
                    <div className="text-xs bg-zinc-50 p-4 rounded-xl text-left text-zinc-700 border border-zinc-200 space-y-1">
                      <p><strong className="text-zinc-900">Película:</strong> {resultadoValidacion.ticket.peliculaId}</p>
                      <p><strong className="text-zinc-900">Horario:</strong> {resultadoValidacion.ticket.horario}</p>
                      <p><strong className="text-zinc-900">Butacas:</strong> <span className="text-red-600 font-bold">{resultadoValidacion.ticket.asientos.join(', ')}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {modalPeliculaAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-zinc-200">
            <h3 className="text-xl font-black text-zinc-900 mb-1">Registrar Nueva Película</h3>
            <p className="text-xs text-zinc-500 mb-6">Complete la información de cartelera</p>
            
            <div className="space-y-4 mb-6">
              <input type="text" value={formPelicula.codigoPelicula} onChange={(e) => setFormPelicula({...formPelicula, codigoPelicula: e.target.value})} placeholder="Código (ej. P25)" className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-red-600" />
              <input type="text" value={formPelicula.titulo} onChange={(e) => setFormPelicula({...formPelicula, titulo: e.target.value})} placeholder="Título Oficial" className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-red-600" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formPelicula.genero} onChange={(e) => setFormPelicula({...formPelicula, genero: e.target.value})} placeholder="Género" className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-red-600" />
                <input type="text" value={formPelicula.duracion} onChange={(e) => setFormPelicula({...formPelicula, duracion: e.target.value})} placeholder="Duración (ej. 120 min)" className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-red-600" />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Afiche (URL o Imagen Local)</label>
                <div className="flex gap-2">
                  <input type="text" value={formPelicula.imagen} onChange={(e) => setFormPelicula({...formPelicula, imagen: e.target.value})} placeholder="https://... o sube archivo" className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs text-zinc-900 outline-none focus:border-red-600" />
                  <input type="file" accept="image/*" onChange={(e) => manejarImagenLocal(e, 'pelicula')} className="text-xs text-zinc-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalPeliculaAbierto(false)} className="w-1/2 py-3 bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs">Cancelar</button>
              <button onClick={guardarPelicula} className="w-1/2 py-3 bg-red-600 text-white font-black rounded-xl text-xs shadow-lg shadow-red-600/30">Guardar Película</button>
            </div>
          </div>
        </div>
      )}

      {modalSnackAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-zinc-200">
            <h3 className="text-xl font-black text-zinc-900 mb-1">Registrar Nuevo Snack</h3>
            <p className="text-xs text-zinc-500 mb-6">Añada productos al Candy Bar</p>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={formSnack.nombre} onChange={(e) => setFormSnack({...formSnack, nombre: e.target.value})} placeholder="Nombre Comercial" className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-500" />
                <input type="number" value={formSnack.precio} onChange={(e) => setFormSnack({...formSnack, precio: e.target.value})} placeholder="Precio (S/.)" className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-500" />
              </div>
              <input type="text" value={formSnack.descripcion} onChange={(e) => setFormSnack({...formSnack, descripcion: e.target.value})} placeholder="Descripción e ingredientes" className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-500" />
              
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Fotografía (URL o Archivo Local)</label>
                <div className="flex gap-2">
                  <input type="text" value={formSnack.imagen} onChange={(e) => setFormSnack({...formSnack, imagen: e.target.value})} placeholder="https://... o sube archivo" className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl text-xs text-zinc-900 outline-none focus:border-amber-500" />
                  <input type="file" accept="image/*" onChange={(e) => manejarImagenLocal(e, 'snack')} className="text-xs text-zinc-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalSnackAbierto(false)} className="w-1/2 py-3 bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs">Cancelar</button>
              <button onClick={guardarSnack} className="w-1/2 py-3 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20">Guardar Snack</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}