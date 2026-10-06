/**
 * Semilla — caja comunitaria expansiva.
 * Reglas de negocio puras. No tocan el DOM.
 */
export const STORAGE_KEY = "semilla-caja-v1";
export const FONDO_RATE = 0.2;
export const MIN_AHORRO = 50;
export const MIN_PRESTAMO = 500;
export const SEMILLA_FONDO = 15000;
export const SEMILLA_SOCIOS = 8;
export const FONDO_SIEMBRA = 3500;
export const CISTERNA_TOPE = 0.15;

export function cisternaBase(capacidad = 100000) {
  return {
    capacidad,
    topePorcentaje: CISTERNA_TOPE,
    plazoDias: 30,
    comision: 0.05,
    creditos: [],
  };
}

export const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

export function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`;
}

export function slug(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || uid("pueblo");
}

function cajaVacia(id, name, estado, status, born) {
  return {
    id,
    name,
    estado,
    status, // viva | lista | lejos
    born,
    socios: [],
    fondo: 0,
    moves: [],
    loans: [],
    votes: [],
  };
}

export function crearEstadoNuevo({ me, pueblo, estado }) {
  const origen = cajaVacia("origen", pueblo, estado, "viva", "Caja fundadora");
  origen.socios = [
    { id: "me", name: me, rol: "Socio fundador", ahorro: 0 },
    { id: "tesorero", name: "Tesorero del pueblo", rol: "Tesorero", ahorro: 800 },
    { id: "vecino", name: "Socio vecino", rol: "Socio", ahorro: 400 },
  ];
  origen.fondo = 600;
  origen.moves = [{ id: uid("m"), t: "Apertura de la caja", a: 600, kind: "in" }];
  return {
    me,
    active: origen.id,
    pueblos: [
      origen,
      cajaVacia("vecino", "Pueblo vecino", estado, "lista", "Puede pedir caja"),
      cajaVacia("cabecera", "Cabecera", estado, "lejos", "Todavía no pide"),
    ],
    cisterna: cisternaBase(),
  };
}

export function crearDemo() {
  return {
    me: "Roman",
    active: "san-lucas",
    pueblos: [
      {
        id: "san-lucas",
        name: "San Lucas",
        estado: "Puebla",
        status: "viva",
        born: "Nace aquí",
        socios: [
          { id: "me", name: "Roman", rol: "Socio fundador", ahorro: 4200 },
          { id: "s2", name: "Doña Carmen", rol: "Tesorera", ahorro: 8600 },
          { id: "s3", name: "José Aguilar", rol: "Socio", ahorro: 3100 },
          { id: "s4", name: "Luz Hernández", rol: "Socio", ahorro: 5400 },
          { id: "s5", name: "Taller Ramos", rol: "Socio", ahorro: 2700 },
        ],
        fondo: 18600,
        moves: [
          { id: uid("m"), t: "Ahorro de Luz Hernández", a: 800, kind: "in" },
          { id: uid("m"), t: "Préstamo a José · refacción", a: -4000, kind: "out" },
          { id: uid("m"), t: "Ahorro de Doña Carmen", a: 1500, kind: "in" },
          { id: uid("m"), t: "Cuota al fondo común", a: 600, kind: "in" },
        ],
        loans: [
          { id: uid("l"), who: "José Aguilar", why: "Refacción del taller", amount: 4000, left: 2800, status: "al corriente" },
        ],
        votes: [
          {
            id: "v-luz",
            kind: "préstamo",
            title: "Préstamo a Luz · invernadero",
            detail: "$6,000 a 4 meses. Aval: Doña Carmen. Destino: malla y semilla.",
            yes: 3, no: 0, need: 4, done: false,
            amount: 6000, why: "Invernadero", who: "Luz Hernández",
          },
          {
            id: "v-cruz",
            kind: "sembrar",
            title: "Abrir caja en Santa Cruz",
            detail: "La comunidad vecina pide Semilla. Ya hay 12 personas listas.",
            yes: 2, no: 1, need: 4, done: false,
            target: "santa-cruz",
          },
        ],
      },
      cajaVacia("santa-cruz", "Santa Cruz", "Puebla", "lista", "La pide el pueblo"),
      cajaVacia("atenco", "Atenco", "Puebla", "lejos", "Aún no pide caja"),
    ],
    cisterna: {
      capacidad: 100000,
      topePorcentaje: CISTERNA_TOPE,
      plazoDias: 30,
      comision: 0.05,
      creditos: [
        { id: "c-ramos", who: "Taller Ramos", why: "Refacción", amount: 12000, left: 12000, status: "al corriente", plazo: 30 },
        { id: "c-luna", who: "Abarrotes Luna", why: "Mercancía", amount: 8000, left: 6400, status: "en mora", plazo: 30 },
      ],
    },
  };
}

export function asegurarCisterna(state) {
  if (!state.cisterna) state.cisterna = cisternaBase();
  if (!Array.isArray(state.cisterna.creditos)) state.cisterna.creditos = [];
  return state.cisterna;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function cajaActiva(state) {
  return state.pueblos.find((p) => p.id === state.active) || state.pueblos[0];
}

export function socioActual(state) {
  const caja = cajaActiva(state);
  return caja.socios.find((s) => s.id === "me") || null;
}

export function puedeSembrar(origen) {
  return origen.socios.length >= SEMILLA_SOCIOS && origen.fondo >= SEMILLA_FONDO;
}

export function progresoSiembra(origen) {
  const socios = Math.min(origen.socios.length / SEMILLA_SOCIOS, 1);
  const fondo = Math.min(origen.fondo / SEMILLA_FONDO, 1);
  return Math.round((socios * 50) + (fondo * 50));
}

export function ahorrar(state, amount, note) {
  const n = Math.round(Number(amount));
  if (!n || n < MIN_AHORRO) return { ok: false, error: `Mínimo ${money(MIN_AHORRO)}` };
  const caja = cajaActiva(state);
  const yo = socioActual(state);
  if (!yo) return { ok: false, error: "No eres socio de esta caja" };
  const alFondo = Math.round(n * FONDO_RATE);
  yo.ahorro += n - alFondo;
  caja.fondo += alFondo;
  caja.moves.unshift({ id: uid("m"), t: note || "Ahorro", a: n, kind: "in" });
  return { ok: true, alFondo };
}

export function pedirPrestamo(state, amount, why) {
  const n = Math.round(Number(amount));
  const motivo = (why || "").trim();
  if (!n || n < MIN_PRESTAMO || !motivo) return { ok: false, error: "Falta cantidad o motivo" };
  const caja = cajaActiva(state);
  if (caja.votes.some((v) => v.kind === "préstamo" && !v.done && v.who === state.me)) {
    return { ok: false, error: "Ya tienes un préstamo en asamblea" };
  }
  caja.votes.unshift({
    id: uid("v"),
    kind: "préstamo",
    title: `Préstamo a ${state.me}`,
    detail: `${money(n)} · ${motivo}`,
    yes: 1,
    no: 0,
    need: Math.min(4, Math.max(2, caja.socios.length - 1)),
    done: false,
    voted: true,
    amount: n,
    why: motivo,
    who: state.me,
  });
  return { ok: true };
}

export function votar(state, voteId, aFavor) {
  const caja = cajaActiva(state);
  const vote = caja.votes.find((v) => v.id === voteId);
  if (!vote || vote.done) return { ok: false, error: "Esa votación ya cerró" };
  if (vote.voted) return { ok: false, error: "Ya votaste esta" };
  vote.voted = true;
  if (aFavor) vote.yes += 1;
  else vote.no += 1;
  if (vote.yes < vote.need) return { ok: true, closed: false };

  vote.done = true;
  if (vote.kind === "préstamo") return desembolsar(caja, vote);
  if (vote.kind === "sembrar") return sembrar(state, caja, vote);
  return { ok: true, closed: true };
}

function desembolsar(caja, vote) {
  const amount = vote.amount || 0;
  if (caja.fondo < amount) {
    vote.done = false;
    vote.voted = false;
    vote.yes -= 1;
    return { ok: false, error: "Fondo insuficiente" };
  }
  caja.fondo -= amount;
  caja.loans.push({
    id: uid("l"),
    who: vote.who || "Socio",
    why: vote.why || "Préstamo",
    amount,
    left: amount,
    status: "recién aprobado",
  });
  caja.moves.unshift({ id: uid("m"), t: `Préstamo aprobado · ${vote.who}`, a: -amount, kind: "out" });
  return { ok: true, closed: true, message: "Asamblea aprobó el préstamo" };
}

function sembrar(state, origen, vote) {
  const dest = state.pueblos.find((p) => p.id === vote.target);
  if (!dest) return { ok: false, error: "No está ese pueblo" };
  if (origen.fondo < FONDO_SIEMBRA) {
    vote.done = false;
    vote.voted = false;
    vote.yes -= 1;
    return { ok: false, error: "Fondo insuficiente para sembrar" };
  }
  origen.fondo -= FONDO_SIEMBRA;
  origen.moves.unshift({ id: uid("m"), t: `Fondo enviado a ${dest.name}`, a: -FONDO_SIEMBRA, kind: "out" });
  dest.status = "viva";
  dest.socios = [
    { id: "me", name: state.me, rol: "Enlace de Semilla", ahorro: 500 },
    { id: uid("s"), name: `Comité de ${dest.name}`, rol: "Tesorero local", ahorro: 1200 },
  ];
  dest.fondo = FONDO_SIEMBRA;
  dest.moves = [{ id: uid("m"), t: `Siembra desde ${origen.name}`, a: FONDO_SIEMBRA, kind: "in" }];
  dest.loans = [];
  dest.votes = [];
  return { ok: true, closed: true, message: `${dest.name} ya tiene caja` };
}

export function pedirSiembra(state, targetId) {
  const origen = state.pueblos[0];
  const dest = state.pueblos.find((p) => p.id === targetId);
  if (!dest || dest.status !== "lista") return { ok: false, error: "Ese pueblo no está listo" };
  if (origen.votes.some((v) => v.target === targetId && !v.done)) {
    return { ok: false, error: "Ya está en asamblea", go: origen.id };
  }
  origen.votes.unshift({
    id: uid("v"),
    kind: "sembrar",
    title: `Abrir caja en ${dest.name}`,
    detail: `${dest.name} pide Semilla. La asamblea de ${origen.name} decide si suelta fondo semilla.`,
    yes: 1,
    no: 0,
    need: 4,
    done: false,
    voted: true,
    target: targetId,
  });
  return { ok: true, go: origen.id };
}

export function agregarSocio(state, name, rol) {
  const nombre = (name || "").trim();
  if (nombre.length < 2) return { ok: false, error: "Falta el nombre" };
  const caja = cajaActiva(state);
  caja.socios.push({ id: uid("s"), name: nombre, rol: (rol || "Socio").trim() || "Socio", ahorro: 0 });
  caja.moves.unshift({ id: uid("m"), t: `${nombre} entró a la caja`, a: 0, kind: "in" });
  return { ok: true };
}

export function abonarPrestamo(state, loanId, amount) {
  const n = Math.round(Number(amount));
  if (!n || n < 50) return { ok: false, error: "Abono mínimo $50" };
  const caja = cajaActiva(state);
  const loan = caja.loans.find((l) => l.id === loanId);
  if (!loan) return { ok: false, error: "No está ese préstamo" };
  const pago = Math.min(n, loan.left);
  loan.left -= pago;
  caja.fondo += pago;
  loan.status = loan.left === 0 ? "liquidado" : "al corriente";
  caja.moves.unshift({ id: uid("m"), t: `Abono de ${loan.who}`, a: pago, kind: "in" });
  return { ok: true, pago };
}

export function proponerPueblo(state, name) {
  const nombre = (name || "").trim();
  if (nombre.length < 3) return { ok: false, error: "Pon el nombre del pueblo" };
  const estado = state.pueblos[0].estado;
  const id = slug(nombre);
  if (state.pueblos.some((p) => p.id === id)) return { ok: false, error: "Ese pueblo ya está en el mapa" };
  state.pueblos.push(cajaVacia(id, nombre, estado, "lista", "Lo propuso un socio"));
  return { ok: true, id };
}

export function resumenCisterna(state) {
  const c = asegurarCisterna(state);
  const colocado = c.creditos.reduce((sum, x) => sum + (x.left || 0), 0);
  const disponible = Math.max(0, c.capacidad - colocado);
  const mora = c.creditos.filter((x) => x.status === "en mora").reduce((sum, x) => sum + x.left, 0);
  const tope = Math.round(c.capacidad * c.topePorcentaje);
  return { ...c, colocado, disponible, mora, tope, nivel: c.capacidad ? colocado / c.capacidad : 0 };
}

export function recargarCisterna(state, amount) {
  const n = Math.round(Number(amount));
  if (!n || n < 500) return { ok: false, error: "Recarga mínima $500" };
  const c = asegurarCisterna(state);
  c.capacidad += n;
  return { ok: true, n };
}

export function colocarCredito(state, who, amount, why) {
  const nombre = (who || "").trim();
  const n = Math.round(Number(amount));
  const motivo = (why || "").trim();
  const c = asegurarCisterna(state);
  const r = resumenCisterna(state);
  if (nombre.length < 2 || !n || !motivo) return { ok: false, error: "Falta cliente, monto o motivo" };
  if (n > r.disponible) return { ok: false, error: "No cabe en la cisterna" };
  if (n > r.tope) return { ok: false, error: `Tope por cliente: ${money(r.tope)}` };
  const vivo = c.creditos.find((x) => x.who.toLowerCase() === nombre.toLowerCase() && x.left > 0);
  if (vivo) return { ok: false, error: "Ese cliente ya tiene saldo" };
  const cargo = Math.round(n * (1 + c.comision));
  c.creditos.unshift({
    id: uid("c"),
    who: nombre,
    why: motivo,
    amount: n,
    left: cargo,
    status: "al corriente",
    plazo: c.plazoDias,
  });
  return { ok: true, cargo };
}

export function abonarCisterna(state, creditId, amount) {
  const n = Math.round(Number(amount));
  if (!n || n < 50) return { ok: false, error: "Abono mínimo $50" };
  const c = asegurarCisterna(state);
  const credito = c.creditos.find((x) => x.id === creditId);
  if (!credito) return { ok: false, error: "No está ese crédito" };
  const pago = Math.min(n, credito.left);
  credito.left -= pago;
  credito.status = credito.left === 0 ? "liquidado" : "al corriente";
  return { ok: true, pago };
}
