import { useCine } from './store';

export default function Dulceria() {
  const cine = useCine();

  return (
    <div className="max-w-5xl mx-auto animate-fade-in py-6">
      <div className="flex justify-between items-center mb-8 border-b border-red-500/20 pb-4">
        <div>
          <h2 className="text-3xl font-black text-red-600 dark:text-red-500 tracking-wide flex items-center gap-3">
            Dulcería
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">Acompaña tu función con nuestros combos oficiales</p>
        </div>
        {cine.seleccionPelicula ? (
          <button onClick={() => cine.setVistaActual('asientos')} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition shadow-md">&larr; Volver a Butacas</button>
        ) : (
          <button onClick={() => cine.setVistaActual('cartelera')} className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition shadow-md">&larr; Volver a Cartelera</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {cine.snacks.map((snk: any) => (
          <div key={snk.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-amber-500/50 transition">
            <img src={snk.imagen} alt={snk.nombre} className="w-full h-44 object-cover rounded-xl mb-4 border border-zinc-100 dark:border-zinc-800" />
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">{snk.nombre}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{snk.descripcion}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xl font-black text-amber-500">S/. {snk.precio.toFixed(2)}</span>
              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700">
                <button onClick={() => cine.modificarSnack(snk, -1)} className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-lg hover:bg-red-500 hover:text-white transition">-</button>
                <span className="text-sm font-bold w-6 text-center text-zinc-900 dark:text-white">{cine.getCantidadSnack(snk.id)}</span>
                <button onClick={() => cine.modificarSnack(snk, 1)} className="w-8 h-8 bg-amber-500 text-zinc-950 font-bold rounded-lg hover:bg-amber-400 transition">+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl">
        <div>
          <p className="text-xs text-amber-500 uppercase font-extrabold tracking-wider">Resumen Global de Orden</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">
            {cine.asientosSeleccionados.length > 0 && <span>Entradas ({cine.asientosSeleccionados.length}): S/.{cine.subtotalEntradas.toFixed(2)} | </span>}
            Dulcería: S/.{cine.subtotalSnacks.toFixed(2)}
          </p>
          <p className="text-3xl font-black text-red-600 dark:text-red-500 mt-1">Total: S/. {cine.totalPagar.toFixed(2)}</p>
        </div>
        <button 
          onClick={() => cine.setVistaActual('pago')} 
          disabled={cine.totalPagar === 0} 
          className="px-10 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black rounded-xl text-base disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-red-600/20"
        >
          Continuar al Pago &rarr;
        </button>
      </div>
    </div>
  );
}