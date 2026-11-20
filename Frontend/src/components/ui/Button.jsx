// Agregamos className a las props
function BotonPrimario({ texto, tipo = "button", onClick, className = "", disabled = false }) {
  return (
    <button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      // Las comillas invertidas permiten mezclar el texto fijo con la variable ${className} al final
      className={`px-8 py-2 rounded-md bg-[#00e676] text-black font-bold transition duration-200 hover:bg-green-500 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {texto}
    </button>
  );
}

export default BotonPrimario;