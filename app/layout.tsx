import type { Metadata } from "next";
import Link from "next/link";
import { Globe2, ArrowUpRight } from "lucide-react";
import "./globals.css";
export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  title: {
    default: "Donut Alicante · Una ciudad para vivir bien",
    template: "%s · Donut Alicante",
  },
  description:
    "Observatorio ciudadano del bienestar social y los límites ambientales de Alicante. Datos verificables, metodología abierta y perspectiva territorial.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a className="skip" href="#contenido">
          Saltar al contenido
        </a>
        <header className="header">
          <Link className="brand" href="/" aria-label="Donut Alicante, inicio">
            <span className="brand-ring" />
            <span>
              donut<span className="brand-city">alicante</span>
            </span>
          </Link>
          <nav aria-label="Navegación principal">
            <Link href="/">Visión general</Link>
            <Link href="/indicadores">Indicadores</Link>
            <Link href="/territorio">Territorio</Link>
            <Link href="/metodologia">El modelo</Link>
            <Link href="/informes">Informes</Link>
          </nav>
          <Link className="header-download" href="/descargas">
            Datos abiertos <ArrowUpRight size={16} />
          </Link>
        </header>
        <main id="contenido">{children}</main>
        <footer>
          <div className="footer-top">
            <Link className="brand" href="/">
              <span className="brand-ring" />
              <span>donut alicante</span>
            </Link>
            <p>
              Una mirada compartida.
              <br />
              Un futuro dentro de los límites del planeta.
            </p>
            <Globe2 size={34} strokeWidth={1} />
          </div>
          <div className="footer-bottom">
            <span>Observatorio independiente · Metodología abierta</span>
            <div>
              <Link href="/metodologia">Transparencia y privacidad</Link>
              <Link href="/admin">Administración</Link>
              <a
                href="https://doughnuteconomics.org/"
                target="_blank"
                rel="noreferrer"
              >
                Sobre el modelo ↗
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
