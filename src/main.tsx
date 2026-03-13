<<<<<<< HEAD
import { Buffer } from "buffer";
window.Buffer = Buffer;

=======
>>>>>>> ab58d28a426bb25a3e6b9a070ae41febba4566b0
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
