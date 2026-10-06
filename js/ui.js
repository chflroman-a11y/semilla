import {
  FONDO_SIEMBRA,
  SEMILLA_FONDO,
  SEMILLA_SOCIOS,
  abonarCisterna,
  abonarPrestamo,
  agregarSocio,
  ahorrar,
  cajaActiva,
  clearState,
  colocarCredito,
  money,
  pedirPrestamo,
  pedirSiembra,
  progresoSiembra,
  proponerPueblo,
  puedeSembrar,
  recargarCisterna,
  resumenCisterna,
  saveState,
  socioActual,
  votar,
} from "./store.js";

let state = null;
let onChange = () => {};

export function bind(next, render) {
  state = next;
  onChange = render;
  persist();
}

function persist() {
  saveState(state);
  onChange(state);
}

export function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("on");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("on"), 1800);
}

export function show(tab) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("on"));
  document.getElementById(`scr-${tab}`).classList.add("on");
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
}

function closeSheet() {
  document.getElementById("sheet").classList.remove("on");
}

function openSheet(html, kicker, title) {
  document.getElementById("sheetKicker").textContent = kicker;
  document.getElementById("sheetTitle").textContent = title;
  document.getElementById("sheetBody").innerHTML = html;
  document.getElementById("sheet").classList.add("on");
  const close = document.getElementById("closeSheet");
  if (close) close.onclick = closeSheet;
}

export function render(current) {
  state = current;
  const caja = cajaActiva(state);
  const yo = socioActual(state);
  document.getElementById("eyebrow").textContent = `Semilla · ${caja.estado}`;
  document.getElementById("title").textContent = caja.name;
  document.getElementById("saldo").textContent = money(yo ? yo.ahorro : 0);
  document.getElementById("fondo").textContent = money(caja.fondo);
  document.getElementById("socios").textContent = caja.socios.length;
  document.getElementById("cajaName").textContent = caja.name;
  document.getElementById("socioCount").textContent = `${caja.socios.length} en ${caja.name}`;

  document.getElementById("moves").innerHTML = caja.moves.length
    ? caja.moves.map((m) => `
      <div class="card move">
        <div class="dot">${m.a < 0 ? "–" : "+"}</div>
        <div class="grow"><div class="name">${m.t}</div><div class="sub">${caja.name}</div></div>
        <div class="amt ${m.a >= 0 ? "pos" : "neg"}">${m.a >= 0 ? "+" : ""}${money(m.a)}</div>
      </div>`).join("")
    : `<div class="card"><div class="sub">Aún no hay movimientos en ${caja.name}.</div></div>`;

  document.getElementById("votes").innerHTML = caja.votes.length
    ? caja.votes.map((v) => `
      <div class="card">
        <span class="pill ${v.done ? "live" : "wait"}">${v.done ? "cerrada" : v.kind}</span>
        <h3 style="margin:8px 0 4px;font-size:20px">${v.title}</h3>
        <div class="sub">${v.detail}</div>
        <div class="bar"><i style="width:${Math.min(100, (v.yes / v.need) * 100)}%"></i></div>
        <div class="sub" style="margin-top:8px">${v.yes} a favor · ${v.no} en contra · se necesitan ${v.need}</div>
        ${v.done ? "" : `<div class="actions">
          <button class="btn olive small" data-vote="${v.id}" data-yes="1">A favor</button>
          <button class="btn ghost small" data-vote="${v.id}" data-yes="0">En contra</button>
        </div>`}
      </div>`).join("")
    : `<div class="card"><div class="sub">No hay nada en asamblea. Un préstamo o una caja nueva aparece aquí.</div></div>`;

  document.getElementById("loans").innerHTML = caja.loans.length
    ? caja.loans.map((l) => `
      <div class="card">
        <div class="loan">
          <div class="avatar">${l.who.slice(0, 1)}</div>
          <div class="grow"><div class="name">${l.who}</div><div class="sub">${l.why}</div></div>
          <div class="amt">${money(l.left)}</div>
        </div>
        <div class="sub" style="margin-top:8px">Saldo de ${money(l.amount)} · ${l.status}</div>
        ${l.left > 0 ? `<div class="actions"><button class="btn olive small" data-pay="${l.id}">Abonar</button></div>` : ""}
      </div>`).join("")
    : `<div class="card"><div class="sub">Sin préstamos vivos. El fondo común está libre.</div></div>`;

  document.getElementById("people").innerHTML = caja.socios.map((s) => `
    <div class="card person">
      <div class="avatar">${s.name.slice(0, 1)}</div>
      <div class="grow"><div class="name">${s.name}</div><div class="sub">${s.rol}</div></div>
      <div class="amt">${money(s.ahorro)}</div>
    </div>`).join("") || `<div class="card"><div class="sub">Esta caja todavía no tiene socios.</div></div>`;

  const origen = state.pueblos[0];
  const listo = puedeSembrar(origen);
  document.getElementById("expBar").style.width = `${progresoSiembra(origen)}%`;
  document.getElementById("expHint").textContent = listo
    ? `${origen.name} ya puede sembrar. Falta el voto si la vecina lo pide.`
    : `${origen.socios.length}/${SEMILLA_SOCIOS} socios · ${money(origen.fondo)} / ${money(SEMILLA_FONDO)} de fondo.`;

  document.getElementById("map").innerHTML = state.pueblos.map((t) => {
    const pill = t.status === "viva" ? "live" : t.status === "lista" ? "wait" : "lock";
    const label = t.status === "viva" ? "caja viva" : t.status === "lista" ? "lista para abrir" : "en espera";
    const action = t.status === "lista"
      ? `<button class="btn olive small" data-seed="${t.id}">Pedir voto</button>`
      : t.id === state.active
        ? ""
        : `<button class="btn ghost small" data-go="${t.id}">Ver</button>`;
    return `<div class="card town">
      <div class="avatar">${t.name.slice(0, 1)}</div>
      <div class="grow">
        <div class="name">${t.name}</div>
        <div class="sub">${t.estado} · ${t.born}</div>
        <div style="margin-top:8px"><span class="pill ${pill}">${label}</span></div>
      </div>
      ${action}
    </div>`;
  }).join("");

  const cisterna = resumenCisterna(state);
  const nivel = Math.round(cisterna.nivel * 100);
  document.getElementById("tankFill").style.height = `${nivel}%`;
  document.getElementById("tankLabel").textContent = `${nivel}% colocado`;
  document.getElementById("cisternaLibre").textContent = money(cisterna.disponible);
  document.getElementById("cisternaMora").textContent = money(cisterna.mora);
  document.getElementById("cisternaRegla").textContent = `Tanque de ${money(cisterna.capacidad)}. Tope por cliente ${money(cisterna.tope)}. Plazo ${cisterna.plazoDias} días. Comisión ${Math.round(cisterna.comision * 100)}%, se suma al saldo.`;
  document.getElementById("cisternaCreditos").innerHTML = cisterna.creditos.length
    ? cisterna.creditos.map((c) => `
      <div class="card">
        <div class="loan">
          <div class="avatar">${c.who.slice(0, 1)}</div>
          <div class="grow"><div class="name">${c.who}</div><div class="sub">${c.why} · ${c.plazo} días</div></div>
          <div class="amt">${money(c.left)}</div>
        </div>
        <div style="margin-top:8px"><span class="pill ${c.status === "en mora" ? "wait" : c.status === "liquidado" ? "live" : "lock"}">${c.status}</span></div>
        ${c.left > 0 ? `<div class="actions"><button class="btn olive small" data-cisterna-pay="${c.id}">Abonar y rellenar</button></div>` : ""}
      </div>`).join("")
    : `<div class="card"><div class="sub">La cisterna está llena. Todavía no hay crédito colocado.</div></div>`;
}

export function wire() {
  document.querySelectorAll(".nav button").forEach((b) => {
    b.onclick = () => show(b.dataset.tab);
  });
  document.body.addEventListener("click", (event) => {
    const el = event.target.closest("[data-open],[data-vote],[data-pay],[data-seed],[data-go],[data-cisterna-pay]");
    if (!el) return;
    if (el.dataset.open) return openAction(el.dataset.open);
    if (el.dataset.vote) return cast(el.dataset.vote, el.dataset.yes === "1");
    if (el.dataset.pay) return pay(el.dataset.pay);
    if (el.dataset.cisternaPay) return payCisterna(el.dataset.cisternaPay);
    if (el.dataset.seed) return seed(el.dataset.seed);
    if (el.dataset.go) return go(el.dataset.go);
  });
  document.getElementById("switchBtn").onclick = () => openAction("switch");
  document.getElementById("addSocio").onclick = () => openAction("socio");
  document.getElementById("addPueblo").onclick = () => openAction("pueblo");
  document.getElementById("resetBtn").onclick = () => {
    clearState();
    location.reload();
  };
  document.getElementById("sheet").addEventListener("click", (e) => {
    if (e.target.id === "sheet") closeSheet();
  });
}

function go(id) {
  const town = state.pueblos.find((p) => p.id === id);
  if (!town || town.status !== "viva") return toast("Esa caja todavía no está abierta");
  state.active = id;
  persist();
  toast(`Estás en ${town.name}`);
}

function cast(id, yes) {
  const result = votar(state, id, yes);
  if (!result.ok) return toast(result.error);
  persist();
  toast(result.message || (yes ? "Voto a favor" : "Voto en contra"));
}

function seed(id) {
  const result = pedirSiembra(state, id);
  if (!result.ok && !result.go) return toast(result.error);
  if (result.go) state.active = result.go;
  persist();
  toast(result.ok ? "La asamblea ya puede votar" : result.error);
  show("asamblea");
}

function pay(loanId) {
  openSheet(`
    <label>Abono</label>
    <input id="amt" type="number" min="50" step="50" value="200" />
    <div class="actions">
      <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
      <button class="btn solid" id="doPay" type="button">Abonar</button>
    </div>`, "Recuperación", "Abonar al préstamo");
  document.getElementById("doPay").onclick = () => {
    const result = abonarPrestamo(state, loanId, document.getElementById("amt").value);
    if (!result.ok) return toast(result.error);
    closeSheet();
    persist();
    toast(`Abono de ${money(result.pago)}`);
  };
}

function payCisterna(creditId) {
  openSheet(`
    <label>Abono</label>
    <input id="amt" type="number" min="50" step="50" value="500" />
    <div class="actions">
      <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
      <button class="btn solid" id="doCisternaPay" type="button">Abonar</button>
    </div>
    <p class="note">Lo cobrado vuelve al disponible. No se va a la caja del pueblo.</p>`, "Rellena el tanque", "Abono a la cisterna");
  document.getElementById("doCisternaPay").onclick = () => {
    const result = abonarCisterna(state, creditId, document.getElementById("amt").value);
    if (!result.ok) return toast(result.error);
    closeSheet();
    persist();
    toast(`Volvieron ${money(result.pago)}`);
  };
}

function openAction(kind) {
  if (kind === "ahorro") {
    openSheet(`
      <label>Cantidad</label>
      <input id="amt" type="number" min="50" step="50" value="500" />
      <label>Nota</label>
      <input id="note" value="Ahorro de la semana" />
      <div class="actions">
        <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
        <button class="btn solid" id="doSave" type="button">Ahorrar</button>
      </div>
      <p class="note">El 20% va al fondo común. Con eso se prestan y se siembran cajas nuevas.</p>`, "Ahorro de socio", "Meter dinero a la caja");
    document.getElementById("doSave").onclick = () => {
      const result = ahorrar(state, document.getElementById("amt").value, document.getElementById("note").value);
      if (!result.ok) return toast(result.error);
      closeSheet();
      persist();
      toast("Ahorro anotado");
    };
  }
  if (kind === "prestamo") {
    openSheet(`
      <label>Cantidad</label>
      <input id="amt" type="number" min="500" step="100" value="2500" />
      <label>Para qué</label>
      <textarea id="why">Compra de insumos de la milpa</textarea>
      <div class="actions">
        <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
        <button class="btn solid" id="doLoan" type="button">Mandar a asamblea</button>
      </div>`, "Pasa por asamblea", "Pedir préstamo");
    document.getElementById("doLoan").onclick = () => {
      const result = pedirPrestamo(state, document.getElementById("amt").value, document.getElementById("why").value);
      if (!result.ok) return toast(result.error);
      closeSheet();
      persist();
      toast("La asamblea lo está viendo");
      show("asamblea");
    };
  }
  if (kind === "socio") {
    openSheet(`
      <label>Nombre</label>
      <input id="nombre" placeholder="Nombre del socio" />
      <label>Rol</label>
      <input id="rol" value="Socio" />
      <div class="actions">
        <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
        <button class="btn solid" id="doSocio" type="button">Dar de alta</button>
      </div>`, "Un socio, un voto", "Nuevo socio");
    document.getElementById("doSocio").onclick = () => {
      const result = agregarSocio(state, document.getElementById("nombre").value, document.getElementById("rol").value);
      if (!result.ok) return toast(result.error);
      closeSheet();
      persist();
      toast("Socio dado de alta");
    };
  }
  if (kind === "pueblo") {
    openSheet(`
      <label>Pueblo que pide caja</label>
      <input id="pueblo" placeholder="Ej. San Andrés" />
      <div class="actions">
        <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
        <button class="btn solid" id="doPueblo" type="button">Anotar pedido</button>
      </div>
      <p class="note">Queda en lista. La caja fundadora vota si suelta ${money(FONDO_SIEMBRA)} de fondo semilla.</p>`, "Expansión", "Otro pueblo");
    document.getElementById("doPueblo").onclick = () => {
      const result = proponerPueblo(state, document.getElementById("pueblo").value);
      if (!result.ok) return toast(result.error);
      closeSheet();
      persist();
      toast("Pedido anotado");
    };
  }
  if (kind === "colocar") {
    const r = resumenCisterna(state);
    openSheet(`
      <label>Cliente</label>
      <input id="who" placeholder="Nombre del cliente" />
      <label>Monto a entregar</label>
      <input id="amt" type="number" min="500" step="100" value="5000" />
      <label>Para qué</label>
      <input id="why" value="Capital de trabajo" />
      <div class="actions">
        <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
        <button class="btn solid" id="doColocar" type="button">Colocar</button>
      </div>
      <p class="note">Disponible ${money(r.disponible)}. Tope ${money(r.tope)}. La comisión del 5% se suma a lo que debe.</p>`, "Sale del tanque", "Colocar crédito");
    document.getElementById("doColocar").onclick = () => {
      const result = colocarCredito(state, document.getElementById("who").value, document.getElementById("amt").value, document.getElementById("why").value);
      if (!result.ok) return toast(result.error);
      closeSheet();
      persist();
      toast(`Colocado. Debe ${money(result.cargo)}`);
    };
  }
  if (kind === "recargar") {
    openSheet(`
      <label>Capital propio que entra al tanque</label>
      <input id="amt" type="number" min="500" step="500" value="10000" />
      <div class="actions">
        <button class="btn ghost" id="closeSheet" type="button">Cerrar</button>
        <button class="btn solid" id="doRecarga" type="button">Recargar</button>
      </div>
      <p class="note">Esto sube la capacidad. No es ahorro de socios.</p>`, "Llave de capital", "Recargar cisterna");
    document.getElementById("doRecarga").onclick = () => {
      const result = recargarCisterna(state, document.getElementById("amt").value);
      if (!result.ok) return toast(result.error);
      closeSheet();
      persist();
      toast(`Tanque en ${money(resumenCisterna(state).capacidad)}`);
    };
  }
  if (kind === "switch") {
    const vivas = state.pueblos.filter((t) => t.status === "viva");
    openSheet(`
      ${vivas.map((t) => `<button class="chip" style="width:100%;margin-bottom:8px;text-align:left" data-switch="${t.id}" type="button">${t.name} · ${t.estado}</button>`).join("")}
      <div class="actions"><button class="btn ghost" id="closeSheet" type="button">Cerrar</button></div>`, "Tus cajas", "Cambiar de pueblo");
    document.querySelectorAll("[data-switch]").forEach((b) => {
      b.onclick = () => {
        state.active = b.dataset.switch;
        closeSheet();
        persist();
      };
    });
  }
}
