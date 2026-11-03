import { useState } from 'react';
import { useCine } from './store';

export default function Navbar() {
  const cine = useCine();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cambiarVista = (vista: string) => {
    cine.resetearCompra();
    cine.setVistaActual(vista);
    setMenuAbierto(false);
  };

  return (
    <header className="bg-red-700 dark:bg-zinc-950 text-white shadow-xl sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => cambiarVista('cartelera')}
        >
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-zinc-950 shadow-md group-hover:scale-105 transition">
            CS
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wider text-white">CineStar</h1>
            <p className="text-[9px] md:text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">Multicines VIP</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-black/20 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-white/10 dark:border-zinc-800">
          <button 
            onClick={() => cambiarVista('cartelera')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              cine.vistaActual === 'cartelera' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            Inicio / Cartelera
          </button>
          <button 
            onClick={() => cambiarVista('dulceria')}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
              cine.vistaActual === 'dulceria' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            Chocolatería
          </button>
          {cine.usuario && cine.usuario.rol === 'CLIENTE' && (
            <button 
              onClick={() => {
                if (typeof cine.verMisTickets === 'function') cine.verMisTickets();
                else cine.setVistaActual('mis-tickets');
                setMenuAbierto(false);
              }}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                cine.vistaActual === 'mis-tickets' ? 'bg-amber-500 text-zinc-950 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Mis Entradas
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => cine.setDarkMode(!cine.darkMode)} 
            className="p-2.5 bg-black/20 dark:bg-zinc-900 rounded-xl text-xs font-bold text-amber-400 hover:bg-black/40 transition border border-white/10 dark:border-zinc-800"
            title="Cambiar Tema"
          >
            {cine.darkMode ? '☀️' : '🌙'}
          </button>

          {cine.usuario ? (
            <div className="hidden sm:flex items-center gap-3 bg-black/20 dark:bg-zinc-900 px-4 py-2 rounded-xl border border-white/10 dark:border-zinc-800">
              <span className="text-xs font-extrabold text-white">👤 {cine.usuario.nombre}</span>
              {cine.usuario.rol === 'ADMIN' && (
                <button onClick={() => cambiarVista('admin')} className="px-3 py-1 bg-amber-500 text-zinc-950 rounded-lg text-xs font-black uppercase">Admin</button>
              )}
              <button onClick={cine.cerrarSesion} className="text-xs font-bold text-red-300 hover:text-white transition underline ml-1">Salir</button>
            </div>
          ) : (
            <button 
              onClick={() => cine.setMostrarModalLogin(true)} 
              className="hidden sm:block px-5 py-2.5 bg-amber-500 text-zinc-950 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
              Iniciar Sesión
            </button>
          )}

          <button 
            onClick={() => setMenuAbierto(!menuAbierto)} 
            className="md:hidden p-2.5 bg-black/20 dark:bg-zinc-900 rounded-xl text-white text-lg border border-white/10"
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-800 px-6 py-4 space-y-3 animate-fade-in">
          <button onClick={() => cambiarVista('cartelera')} className="block w-full text-left py-2 font-bold text-sm text-zinc-200 border-b border-zinc-900">🎬 Inicio / Cartelera</button>
          <button onClick={() => cambiarVista('dulceria')} className="block w-full text-left py-2 font-bold text-sm text-zinc-200 border-b border-zinc-900">🍿 Chocolatería & Dulcería</button>
          {cine.usuario && cine.usuario.rol === 'CLIENTE' && (
            <button onClick={() => { if (typeof cine.verMisTickets === 'function') cine.verMisTickets(); setMenuAbierto(false); }} className="block w-full text-left py-2 font-bold text-sm text-zinc-200 border-b border-zinc-900">🎟️ Mis Entradas</button>
          )}
          {cine.usuario?.rol === 'ADMIN' && (
            <button onClick={() => cambiarVista('admin')} className="block w-full text-left py-2 font-bold text-sm text-amber-400 border-b border-zinc-900">⚙️ Panel Admin</button>
          )}
          {cine.usuario ? (
            <button onClick={() => { cine.cerrarSesion(); setMenuAbierto(false); }} className="block w-full text-left py-2 font-bold text-sm text-red-400">Cerrar Sesión ({cine.usuario.nombre})</button>
          ) : (
            <button onClick={() => { cine.setMostrarModalLogin(true); setMenuAbierto(false); }} className="w-full py-3 bg-amber-500 text-zinc-950 font-black rounded-xl text-xs uppercase">Iniciar Sesión</button>
          )}
        </div>
      )}
    </header>
  );
}