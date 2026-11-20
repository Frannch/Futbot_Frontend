function InputTexto({ label, tipo = "text", id, valor, alCambiar, placeholder, error, required = false, maxLength, textoAccion, alAccionar }) {
  return (
    // flex y flex-col obligan al input a colocarse DEBAJO del label
    // gap-1 añade un pequeño espacio vertical entre el texto y la caja
    <div className="flex flex-col gap-1">
      {/* Texto del label para que sea blanco */}
      <label htmlFor={id} className="text-sm font-medium text-white">
        {label}
      </label>
      {/*Estilizar Input*/}
      <div className="relative">
        <input
          type={tipo}
          id={id}
          value={valor}
          onChange={alCambiar}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-md border bg-[#111827] px-3 py-2 text-white placeholder-gray-400 focus:border-[#00e676] focus:outline-none transition-colors ${textoAccion ? 'pr-20' : ''} ${error ? 'border-red-400' : 'border-gray-500'}`}
        />
        {textoAccion && (
          <button
            type="button"
            onClick={alAccionar}
            className="absolute inset-y-0 right-2 text-sm font-semibold text-[#00e676] hover:text-white"
            aria-label={`${textoAccion} ${label.toLowerCase()}`}
          >
            {textoAccion}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} className="text-sm text-red-200">{error}</p>}
    </div>
  );
}

export default InputTexto;