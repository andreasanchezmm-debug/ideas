import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-container empty">
      <h1>No encontramos esta página.</h1>
      <p>El indicador o territorio puede no estar disponible.</p>
      <Link className="button primary" href="/indicadores">
        Ir al catálogo
      </Link>
    </div>
  );
}
