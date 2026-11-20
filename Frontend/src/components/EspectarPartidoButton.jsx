function EspectarPartidoButton({ onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border border-cyan-300 px-3 py-1 text-xs font-semibold text-cyan-200 transition-colors hover:bg-cyan-300 hover:text-slate-950 ${className}`}
    >
      Espectar partido
    </button>
  );
}

export default EspectarPartidoButton;
