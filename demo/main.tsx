import { createRoot } from "react-dom/client";
import DemoExplorer from "../components/demo-explorer";
import "../app/globals.css";
import "./style.css";
createRoot(document.getElementById("root")!).render(<DemoExplorer />);
