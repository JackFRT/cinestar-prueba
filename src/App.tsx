import React, { useState, useMemo, useEffect } from 'react';
import { useCine, apiUrl } from './store';
import Navbar from './Navbar';
import Admin from './Admin';
import Dulceria from './Dulceria';

export default function App() {
  const cine = useCine();

  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 6;

  const peliculasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return cine.peliculas;
    return cine.peliculas.filter((p: any) => p.titulo.toLowerCase().includes(q) || p.genero.toLowerCase().includes(q));
  }, [busqueda, cine.peliculas]);

  const totalPaginas = Math.ceil(peliculasFiltradas.length / itemsPorPagina);
  const peliculasPaginadas = peliculasFiltradas.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);

  const [modoRegistro, setModoRegistro] = useState(false);
  const [nombreInput, setNombreInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [tipoMetodo, setTipoMetodo] = useState('tarjeta');
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [expTarjeta, setExpTarjeta] = useState('');
  const [cvvTarjeta, setCvvTarjeta] = useState('');
  const [celularYape, setCelularYape] = useState('');
  const [codigoYape, setCodigoYape] = useState('');

  const [ticketSeleccionado, setTicketSeleccionado] = useState<any>(null);

  useEffect(() => { cine.cargarDataInicial(); }, []);

  const actualizarBusqueda = (val: string) => { setBusqueda(val); setPaginaActual(1); };

  const seleccionarPelicula = async (pelicula: any, horario: string) => {
    if (!cine.usuario) { cine.setMostrarModalLogin(true); return; }
    cine.setSeleccionPelicula(pelicula); 
    cine.setSeleccionHorario(horario); 
    
    const salaInicial = [];
    const filas = ['A', 'B', 'C', 'D', 'E'];
    for (let fila of filas) {
      for (let i = 1; i <= 8; i++) {
        salaInicial.push({ id: `${fila}${i}`, estado: 'libre' });
      }
    }
    cine.setAsientos(salaInicial);
    cine.setVistaActual('asientos');

    try {
      const res = await fetch(`${apiUrl}/ocupados?peliculaId=${pelicula.codigoPelicula}&horario=${horario}`);
      const ocupados = await res.json();
      if (ocupados && ocupados.length > 0) {
        cine.setAsientos((list: any[]) => list.map(a => ({ ...a, estado: ocupados.includes(a.id) ? 'ocupado' : 'libre' })));
      }
    } catch (e) { console.error(e); }
  };

  const toggleAsiento = (asiento: any) => {
    if (asiento.estado === 'ocupado') return;
    cine.setAsientos((list: any[]) => list.map(a => a.id === asiento.id ? { ...a, estado: a.estado === 'libre' ? 'seleccionado' : 'libre' } : a));
  };

  const autenticar = async () => {
    const url = modoRegistro ? `${apiUrl}/registro` : `${apiUrl}/login`;
    const body = modoRegistro ? { nombre: nombreInput, email: emailInput, password: passwordInput } : { email: emailInput, password: passwordInput };
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error en autenticación');
      
      cine.setUsuario(data);
      cerrarModalAuth();

      if (data.rol === 'ADMIN') {
        cine.setVistaActual('admin');
      } else {
        cine.setVistaActual('cartelera');
      }
    } catch (e: any) { alert(e.message); }
  };

  const cerrarModalAuth = () => {
    cine.setMostrarModalLogin(false); setEmailInput(''); setPasswordInput(''); setNombreInput(''); setModoRegistro(false);
  };

  const verMisTickets = async () => {
    if (!cine.usuario) return;
    try {
      const res = await fetch(`${apiUrl}/mis-tickets?usuarioId=${cine.usuario.id}`);
      const data = await res.json();
      const formatted = data.map((t: any) => ({
        idCompra: '' + t.id, pelicula: cine.peliculas.find((p: any) => p.codigoPelicula === t.peliculaId)?.titulo || (t.peliculaId === 'COMPRA_DULCERIA' ? 'Dulcería CineStar' : t.peliculaId),
        horario: t.horario, asientos: t.asientos, snacks: t.snacks || [], total: t.totalPagado, estado: t.estado
      }));
      cine.setMisTickets(formatted); cine.setVistaActual('mis-tickets');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      <Navbar />

      {cine.mostrarModalLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black mb-1 text-zinc-900 dark:text-white">{modoRegistro ? 'Crear Cuenta VIP' : 'Iniciar Sesión'}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 font-medium">{modoRegistro ? 'Regístrate para comprar y guardar tus entradas' : 'Ingresa tus credenciales CineStar'}</p>
            {modoRegistro && <input type="text" value={nombreInput} onChange={e => setNombreInput(e.target.value)} placeholder="Nombre completo" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3.5 rounded-xl text-sm mb-3 focus:border-red-600 outline-none text-zinc-900 dark:text-white" />}
            <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="Correo electrónico" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3.5 rounded-xl text-sm mb-3 focus:border-red-600 outline-none text-zinc-900 dark:text-white" />
            <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Contraseña" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3.5 rounded-xl text-sm mb-6 focus:border-red-600 outline-none text-zinc-900 dark:text-white" />
            <div className="flex gap-3 mb-5">
              <button onClick={cerrarModalAuth} className="w-1/2 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-300 transition">Cancelar</button>
              <button onClick={autenticar} className="w-1/2 py-3 bg-red-600 text-white font-black rounded-xl text-sm hover:bg-red-700 transition shadow-md shadow-red-600/30">{modoRegistro ? 'Registrarse' : 'Entrar'}</button>
            </div>
            <p className="text-center text-xs text-zinc-500">
              <button onClick={() => setModoRegistro(!modoRegistro)} className="text-amber-500 font-extrabold hover:underline">{modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</button>
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {cine.vistaActual === 'admin' && cine.usuario?.rol === 'ADMIN' && <Admin />}
        {cine.vistaActual === 'dulceria' && <Dulceria />}
        
        {cine.vistaActual === 'mis-tickets' && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-3xl font-black text-zinc-900 dark:text-white">Mis Entradas Compradas</h2>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">Haz clic en cualquier ticket para ver el código QR ampliado</p>
              </div>
              <button onClick={() => cine.setVistaActual('cartelera')} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition">&larr; Volver</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cine.misTickets.map((tkt: any) => (
                <div 
                  key={tkt.idCompra} 
                  onClick={() => setTicketSeleccionado(tkt)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 flex justify-between items-center shadow-xl cursor-pointer hover:border-amber-500 transition-all group"
                >
                  <div>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase mb-3 inline-block ${tkt.estado === 'USADO' ? 'bg-red-500/10 text-red-600 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'}`}>{tkt.estado || 'PENDIENTE'}</span>
                    <p className="text-xs text-amber-500 font-mono font-black">TKT-{tkt.idCompra}</p>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-1 group-hover:text-amber-500 transition">{tkt.pelicula}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Horario: {tkt.horario}</p>
                    {tkt.asientos.length > 0 && <p className="text-xs text-zinc-600 dark:text-zinc-300 font-bold mt-1">Butacas: {tkt.asientos.join(', ')}</p>}
                    <p className="text-xl font-black text-red-600 dark:text-red-500 mt-3">S/.{tkt.total.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${tkt.idCompra}`} alt="QR" className="w-20 h-20 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm mx-auto mb-1" />
                    <span className="text-[9px] text-zinc-400 font-bold">Ver QR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cine.vistaActual === 'cartelera' && (
          <>
            <div className="relative rounded-3xl overflow-hidden mb-12 shadow-2xl bg-zinc-900 border border-zinc-800">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10 flex flex-col justify-center p-8 md:p-14 max-w-xl">
                <span className="px-3 py-1 bg-red-600 text-white font-black text-[10px] uppercase rounded-full w-max mb-3 tracking-widest shadow-md">Estreno Destacado</span>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Godzilla Minus Zero</h2>
                <p className="text-zinc-300 text-xs md:text-sm mb-6 leading-relaxed">Una nueva amenaza colosal aterroriza Japón en la posguerra. Experimenta la furia en la pantalla IMAX.</p>
                <div className="flex gap-4">
                  <button onClick={() => seleccionarPelicula(cine.peliculas[0] || { codigoPelicula: 'P01', titulo: 'Godzilla Minus Zero' }, '19:30')} className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20">
                    Comprar Entradas
                  </button>
                </div>
              </div>
              <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1200" alt="Banner Cine" className="w-full h-80 md:h-[420px] object-cover opacity-60 scale-105 hover:scale-100 transition duration-700" />
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                🎬 Películas en Cartelera
              </h3>
              <div className="w-full md:w-80">
                <input type="text" value={busqueda} onChange={e => actualizarBusqueda(e.target.value)} placeholder="🔍 Buscar por título o género..." className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-red-600 text-xs shadow-sm text-zinc-900 dark:text-white transition" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peliculasPaginadas.map((pelicula: any) => (
                <div key={pelicula.codigoPelicula} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 flex flex-col justify-between hover:border-red-600/50 transition shadow-xl">
                  <div>
                    <div className="flex gap-3 mb-4">
                      <img src={pelicula.imagen} alt={pelicula.titulo} className="w-28 h-40 object-cover rounded-2xl shadow-md border border-zinc-100 dark:border-zinc-800" />
                      <div className="flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 block mb-1">{pelicula.genero}</span>
                        <h4 className="text-lg font-black text-zinc-900 dark:text-white mb-1 leading-snug">{pelicula.titulo}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">⏱️ {pelicula.duracion}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-extrabold text-red-600 dark:text-red-500 mb-2 uppercase tracking-wide">Selecciona Horario:</p>
                    <div className="flex flex-wrap gap-2">
                      {pelicula.horarios.map((horario: string) => (
                        <button key={horario} onClick={() => seleccionarPelicula(pelicula, horario)} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-800 dark:text-zinc-200 font-extrabold rounded-xl text-xs transition border border-zinc-200 dark:border-zinc-700">{horario}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-6 mt-12 mb-8">
                <button onClick={() => setPaginaActual(p => p - 1)} disabled={paginaActual === 1} className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-red-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs transition shadow-sm">&larr; Anterior</button>
                <span className="text-zinc-700 dark:text-zinc-300 text-xs font-extrabold bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-800 shadow-sm">Página <span className="text-red-600 font-black">{paginaActual}</span> de {totalPaginas}</span>
                <button onClick={() => setPaginaActual(p => p + 1)} disabled={paginaActual === totalPaginas} className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-red-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed font-black text-xs transition shadow-sm">Siguiente &rarr;</button>
              </div>
            )}
          </>
        )}

        {cine.vistaActual === 'asientos' && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <button onClick={() => cine.setVistaActual('cartelera')} className="mb-6 text-red-600 dark:text-red-500 text-sm font-black hover:underline">&larr; Volver a la Cartelera</button>
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 text-center border border-zinc-200 dark:border-zinc-800 shadow-2xl">
              <h2 className="text-2xl font-black mb-1 text-zinc-900 dark:text-white">{cine.seleccionPelicula?.titulo}</h2>
              <p className="text-amber-500 font-extrabold text-sm mb-8">Función Elegida: {cine.seleccionHorario}</p>
              
              <div className="w-full h-12 border-t-4 border-red-600 rounded-t-[50%] mb-12 relative shadow-sm">
                <p className="text-zinc-400 text-[10px] uppercase font-black tracking-widest mt-3">Pantalla Principal IMAX</p>
              </div>

              <div className="grid grid-cols-8 gap-3 max-w-lg mx-auto mb-10">
                {cine.asientos.map((asiento: any, index: number) => (
                  <React.Fragment key={asiento.id}>
                    <button onClick={() => toggleAsiento(asiento)} disabled={asiento.estado === 'ocupado'} className={`w-10 h-10 rounded-t-xl text-xs font-black transition-all shadow-sm ${asiento.estado === 'libre' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700' : asiento.estado === 'ocupado' ? 'bg-red-950 text-red-400 border border-red-800 cursor-not-allowed opacity-50' : 'bg-amber-500 text-zinc-950 scale-110 shadow-lg shadow-amber-500/30 font-black'}`}>{asiento.id}</button>
                    {index % 8 === 3 && <div className="col-span-8 h-1"></div>}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <div className="text-left">
                  <p className="text-[10px] text-zinc-400 uppercase font-black">Subtotal Entradas</p>
                  <p className="text-3xl font-black text-red-600 dark:text-red-500">S/. {cine.subtotalEntradas.toFixed(2)}</p>
                </div>
                <button onClick={() => cine.setVistaActual('dulceria')} disabled={cine.asientosSeleccionados.length === 0} className="px-8 py-3.5 bg-red-600 text-white font-black rounded-xl disabled:opacity-40 hover:bg-red-700 transition shadow-lg shadow-red-600/30">
                  Continuar a Dulcería &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {cine.vistaActual === 'pago' && (
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl animate-fade-in mt-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">Pasarela de Pago Segura</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 font-medium">Seleccione su método de pago y complete sus datos</p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 mb-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase">Total a Pagar</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-500 mt-0.5">S/. {cine.totalPagar.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">🔒 Encriptado SSL</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => setTipoMetodo('tarjeta')} 
                className={`py-3 px-4 rounded-2xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
                  tipoMetodo === 'tarjeta' 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                💳 Tarjeta
              </button>
              <button 
                onClick={() => setTipoMetodo('yape')} 
                className={`py-3 px-4 rounded-2xl border font-bold text-xs transition flex items-center justify-center gap-2 ${
                  tipoMetodo === 'yape' 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                Yape / Plin
              </button>
            </div>

            {tipoMetodo === 'tarjeta' && (
              <div className="space-y-3 mb-6 animate-fade-in">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Número de Tarjeta</label>
                  <input 
                    type="text" 
                    maxLength={19}
                    value={numeroTarjeta} 
                    onChange={e => setNumeroTarjeta(e.target.value)} 
                    placeholder="4532 •••• •••• 8920" 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-red-600" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Expiración (MM/AA)</label>
                    <input 
                      type="text" 
                      maxLength={5}
                      value={expTarjeta} 
                      onChange={e => setExpTarjeta(e.target.value)} 
                      placeholder="12/28" 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-red-600" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Código CVV</label>
                    <input 
                      type="password" 
                      maxLength={4}
                      value={cvvTarjeta} 
                      onChange={e => setCvvTarjeta(e.target.value)} 
                      placeholder="***" 
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-red-600" 
                    />
                  </div>
                </div>
              </div>
            )}

            {tipoMetodo === 'yape' && (
              <div className="space-y-3 mb-6 animate-fade-in text-center">
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 p-4 rounded-2xl mb-4">
                  <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">Escanea el QR o ingresa tus datos</p>
                  <div className="w-28 h-28 bg-white mx-auto p-1.5 rounded-xl border border-purple-200 my-2 flex items-center justify-center font-black text-purple-900 text-xs shadow-inner">
                    [ QR YAPE ]
                  </div>
                  <p className="text-[10px] text-zinc-500">Número asociado: <strong>987 654 321</strong> (CineStar)</p>
                </div>
                
                <div className="text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Número Celular de la Billetera</label>
                  <input 
                    type="text" 
                    maxLength={9}
                    value={celularYape} 
                    onChange={e => setCelularYape(e.target.value)} 
                    placeholder="900000000" 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none focus:border-red-600" 
                  />
                </div>

                <div className="text-left mt-3">
                  <label className="text-[10px] font-black uppercase text-zinc-400 mb-1 block">Código de Confirmación / Aprobación (6 dígitos)</label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={codigoYape} 
                    onChange={e => setCodigoYape(e.target.value)} 
                    placeholder="123456" 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-3 rounded-xl text-xs font-mono tracking-widest text-zinc-900 dark:text-white outline-none focus:border-red-600" 
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => cine.setVistaActual('dulceria')} 
                className="w-1/2 py-3.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl text-xs hover:bg-zinc-300 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (tipoMetodo === 'tarjeta') {
                    if (!numeroTarjeta || !expTarjeta || !cvvTarjeta) {
                      alert('Por favor complete todos los datos de su tarjeta.');
                      return;
                    }
                  } else {
                    if (!celularYape || !codigoYape) {
                      alert('Por favor ingrese su número celular y el código de aprobación de Yape/Plin.');
                      return;
                    }
                  }
                  cine.confirmarCompra();
                }} 
                className="w-1/2 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
              >
                Pagar S/. {cine.totalPagar.toFixed(2)}
              </button>
            </div>
          </div>
        )}

      {ticketSeleccionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-black uppercase px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">Boleto Oficial CineStar</span>
            <h2 className="text-2xl font-black mt-3 mb-1">{ticketSeleccionado.pelicula}</h2>
            <p className="text-xs text-amber-500 font-bold mb-4">Función: {ticketSeleccionado.horario}</p>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-left mb-6 text-xs space-y-2">
              <p><strong className="text-zinc-400">ID Ticket:</strong> <span className="font-mono text-amber-500 font-black">TKT-{ticketSeleccionado.idCompra}</span></p>
              {ticketSeleccionado.asientos.length > 0 && <p><strong className="text-zinc-400">Butacas:</strong> <span className="font-bold text-red-600 dark:text-red-400">{ticketSeleccionado.asientos.join(', ')}</span></p>}
              {ticketSeleccionado.snacks.length > 0 && (
                <div>
                  <strong className="text-zinc-400 block mb-1">Dulcería:</strong>
                  <ul className="list-disc list-inside text-zinc-600 dark:text-zinc-300">
                    {ticketSeleccionado.snacks.map((s: any) => <li key={s.nombre}>{s.cantidad}x {s.nombre}</li>)}
                  </ul>
                </div>
              )}
              <p className="pt-2 border-t border-zinc-200 dark:border-zinc-700 flex justify-between font-black text-sm">
                <span>Total:</span>
                <span className="text-red-600 dark:text-red-500">S/. {ticketSeleccionado.total.toFixed(2)}</span>
              </p>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-zinc-200 inline-block shadow-md mb-6">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${ticketSeleccionado.idCompra}`} alt="QR Grande" className="w-40 h-40 mx-auto" />
              <p className="text-[10px] font-mono font-bold text-zinc-500 mt-2">Presente este código en puerta</p>
            </div>

            <button 
              onClick={() => setTicketSeleccionado(null)} 
              className="w-full py-3.5 bg-zinc-900 dark:bg-zinc-800 text-white font-black rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-700 transition shadow-lg text-xs uppercase tracking-wider"
            >
              Cerrar Comprobante
            </button>
          </div>
        </div>
      )}

        {cine.vistaActual === 'ticket' && cine.ticketComprado && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white text-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl animate-fade-in-up border border-zinc-200">
              <span className="text-[10px] font-black uppercase px-3 py-1 bg-amber-100 text-amber-700 rounded-full">¡Pago Exitoso!</span>
              <h2 className="text-2xl font-black mt-2 mb-1">Ticket CineStar</h2>
              <p className="text-xs text-zinc-500 mb-4 font-semibold">{cine.ticketComprado.pelicula} - {cine.ticketComprado.horario}</p>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-left mb-5 text-xs">
                {cine.ticketComprado.asientos.length > 0 && <p className="mb-1"><strong className="text-zinc-900">Butacas:</strong> {cine.ticketComprado.asientos.join(', ')}</p>}
                {cine.ticketComprado.snacks.length > 0 && <div><p className="mt-2 font-bold text-zinc-900">Dulcería:</p><ul className="list-disc list-inside text-zinc-600">{cine.ticketComprado.snacks.map((s: any) => <li key={s.nombre}>{s.cantidad}x {s.nombre}</li>)}</ul></div>}
                <p className="mt-3 text-sm font-black text-red-600">Total Pagado: S/.{cine.ticketComprado.total.toFixed(2)}</p>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${cine.ticketComprado.idCompra}`} alt="QR Code" className="w-32 h-32 mx-auto mb-2 border-2 border-zinc-200 p-1.5 rounded-2xl shadow-sm" />
              <p className="text-xs font-mono font-black text-zinc-400 mb-6">ID: TKT-{cine.ticketComprado.idCompra}</p>
              <button onClick={() => { cine.resetearCompra(); cine.setVistaActual('cartelera'); }} className="w-full py-3.5 bg-zinc-900 text-white font-black rounded-xl hover:bg-zinc-800 transition shadow-lg">Finalizar y Volver</button>
            </div>
          </div>
        )}
      </main>

    </div>

    
  );
}