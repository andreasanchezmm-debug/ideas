import AdminPanel from "@/components/admin-panel";
export const metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="page-container">
      <div className="page-title">
        <div className="eyebrow">ESPACIO PRIVADO</div>
        <h1>Cuidar los datos también es cuidar la ciudad.</h1>
        <p>
          Catálogo, fuentes, observaciones e informes con revisión y
          trazabilidad.
        </p>
      </div>
      <AdminPanel />
    </div>
  );
}
