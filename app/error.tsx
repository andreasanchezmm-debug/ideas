"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-container empty">
      <h1>No se ha podido cargar la información.</h1>
      <p>
        Los datos no se han sustituido por valores de demostración. Intenta
        cargar la página otra vez.
      </p>
      <button className="button primary" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
