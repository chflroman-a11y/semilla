import { crearDemo, crearEstadoNuevo, loadState } from "./store.js";
import { bind, render, show, wire } from "./ui.js";

const welcome = document.getElementById("welcome");

function boot(next) {
  document.body.classList.add("ready");
  welcome.hidden = true;
  bind(next, render);
  wire();
  show("home");
}

document.getElementById("startBtn").onclick = () => {
  boot(crearEstadoNuevo({
    me: document.getElementById("inName").value.trim() || "Socio",
    pueblo: document.getElementById("inPueblo").value.trim() || "El Pueblo",
    estado: document.getElementById("inEstado").value.trim() || "Puebla",
  }));
};

document.getElementById("demoBtn").onclick = () => boot(crearDemo());

const saved = loadState();
if (saved) boot(saved);
