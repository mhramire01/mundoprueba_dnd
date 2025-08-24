// ======= POIs (JSON) =======
const POIS_RAW = [
  {
    id: "poi-001",
    name: "Faro del Este",
    shortDescription: "Una luz antigua guía a los marinos.",
    longDescription:
      "El faro fue construido hace más de 200 años. Dicen que su luz no proviene de aceite ni magia común, sino de un cristal marino que nunca se apaga.",
    tags: ["histórico", "costa", "seguro"],
    color: "#60a5fa",
    x: 25,
    y: 25,
  },
  {
    id: "poi-002",
    name: "Bosque Susurrante",
    shortDescription: "Los árboles parecen hablar al viento.",
    longDescription:
      "Quienes caminan entre sus senderos oyen voces antiguas. Se recomienda no entrar de noche; algunos senderos cambian de lugar.",
    tags: ["bosque", "misterio"],
    color: "#34d399",
    x: 50,
    y: 50,
  },
  {
    id: "poi-003",
    name: "Ruinas del Norte",
    shortDescription: "Piedras talladas con símbolos extraños.",
    longDescription:
      "Restos de una civilización olvidada. Arqueólogos locales creen que fue un observatorio astral. Hay áreas inestables.",
    tags: ["ruinas", "peligro", "arqueología"],
    color: "#f59e0b",
    x: 75,
    y: 75,
  },
  {
    id: "poi-003",
    name: "Ruinas del Norte",
    shortDescription: "Piedras talladas con símbolos extraños.",
    longDescription:
      "Restos de una civilización olvidada. Arqueólogos locales creen que fue un observatorio astral. Hay áreas inestables.",
    tags: ["ruinas", "peligro", "arqueología"],
    color: "#4d0bf5ff",
    x: 100,
    y: 100,
  },
  {
    id: "poi-003",
    name: "Ruinas del Norte",
    shortDescription: "Piedras talladas con símbolos extraños.",
    longDescription:
      "Restos de una civilización olvidada. Arqueólogos locales creen que fue un observatorio astral. Hay áreas inestables.",
    tags: ["ruinas", "peligro", "arqueología"],
    color: "#f50bb3ff",
    x: 125,
    y: 125,
  },
];

// ======= Normalización =======
function normalizePOI(raw) {
  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "Sin nombre",
    shortDescription: raw["shortDescription"] ?? raw["short-description"] ?? "",
    longDescription: raw["longDescription"] ?? raw["long-description"] ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    color: raw.color ?? "#ef4444",
    x: Number(raw.x ?? 0),
    y: Number(raw.y ?? 0),
  };
}
const POIS = POIS_RAW.map(normalizePOI);

// ======= Elementos =======
const stage = document.getElementById("stage");
const scaleLayer = document.getElementById("scaleLayer");
const img = document.getElementById("mapImage");

const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomResetBtn = document.getElementById("zoomReset");
const zoomLabel = document.getElementById("zoomLabel");

const mainEl = document.querySelector("main");
const sidebar = document.getElementById("sidebar");
const poiList = document.getElementById("poiList");
const poiDetail = document.getElementById("poiDetail");
const detailName = document.getElementById("detailName");
const detailMeta = document.getElementById("detailMeta");
const detailTags = document.getElementById("detailTags");
const detailLong = document.getElementById("detailLong");

// ======= Estado =======
let zoom = 1;
const ZOOM_MIN = 0.4,
  ZOOM_MAX = 3,
  ZOOM_STEP = 0.15;
let selectedId = null;
// Mientras el usuario no toque el zoom, mantenemos ajuste a ancho
let autoFit = true;

// ======= Utilidades =======
const limit = (v, a, b) => Math.max(a, Math.min(b, v));

function availableWidth() {
  const mainWidth = mainEl.clientWidth;
  const gap = parseFloat(getComputedStyle(mainEl).gap || 16);
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const sidebarWidth = isDesktop ? (sidebar?.offsetWidth || 0) + gap : 0; // en móvil/tablet el panel va abajo
  return Math.max(240, mainWidth - sidebarWidth);
}

function updateZoomUI() {
  zoomLabel.textContent = Math.round(zoom * 100) + "%";
  scaleLayer.style.transform = `scale(${zoom})`;

  // Mantener tamaño visual del punto constante al hacer zoom
  document.querySelectorAll(".marker .marker-dot").forEach((dot) => {
    dot.style.transform = `translateZ(0) scale(${1 / zoom})`;
  });

  clampStageToViewport();
}

function clampStageToViewport() {
  const availW = availableWidth();

  // El contenedor del mapa siempre ocupa todo el ancho disponible
  stage.style.width = availW + "px";

  // Altura limitada por viewport y por la altura de la imagen con el zoom actual
  const maxH = Math.min(window.innerHeight * 0.78, img.naturalHeight * zoom);
  stage.style.height = Math.max(320, maxH) + "px";
}

// Ajuste automático: que la imagen llene el ancho
function fitToWidth() {
  const availW = availableWidth();
  if (img.naturalWidth > 0) {
    const targetZoom = availW / img.naturalWidth;
    zoom = limit(targetZoom, ZOOM_MIN, ZOOM_MAX);
    updateZoomUI();
  }
}

// ======= Zoom (desactiva autoFit al usarlo) =======
function disableAutoFit() {
  autoFit = false;
}

zoomInBtn.addEventListener("click", () => {
  disableAutoFit();
  zoom = limit(zoom + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
  updateZoomUI();
});
zoomOutBtn.addEventListener("click", () => {
  disableAutoFit();
  zoom = limit(zoom - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX);
  updateZoomUI();
});
zoomResetBtn.addEventListener("click", () => {
  disableAutoFit();
  zoom = 1;
  updateZoomUI();
});

// ======= Marcadores =======
function createMarkerFromPOI(poi) {
  const el = document.createElement("div");
  el.className = "marker";
  el.style.left = poi.x + "px";
  el.style.top = poi.y + "px";
  el.dataset.id = String(poi.id);

  const dot = document.createElement("div");
  dot.className = "marker-dot";
  dot.style.background = poi.color;
  dot.style.transform = `translateZ(0) scale(${1 / zoom})`;
  el.appendChild(dot);

  if (poi.shortDescription) {
    const tip = document.createElement("div");
    tip.className = "tooltip";
    tip.textContent = poi.shortDescription;
    el.appendChild(tip);
  }

  el.addEventListener("click", (ev) => {
    ev.stopPropagation();
    selectPOI(poi.id);
  });

  scaleLayer.appendChild(el);
}

function renderAllMarkers() {
  document.querySelectorAll(".marker").forEach((m) => m.remove());
  POIS.forEach(createMarkerFromPOI);
}

// ======= Lista =======
function renderPOIList() {
  poiList.innerHTML = "";
  if (POIS.length === 0) {
    const p = document.createElement("p");
    p.className = "text-zinc-400 text-xs";
    p.textContent = "No hay puntos de interés.";
    poiList.appendChild(p);
    return;
  }

  POIS.forEach((poi) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = [
      "w-full grid grid-cols-[22px_1fr_auto] items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-left transition",
      "hover:bg-zinc-800/70",
      poi.id === selectedId
        ? "outline outline-2 outline-sky-400/40"
        : "outline-none",
    ].join(" ");
    item.dataset.id = String(poi.id);

    const dot = document.createElement("div");
    dot.className = "w-4 h-4 rounded-full border-2 border-white";
    dot.style.background = poi.color;

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "text-sm";
    title.textContent = poi.name;
    const coords = document.createElement("div");
    coords.className = "text-[11px] text-zinc-400";
    coords.textContent = `x:${Math.round(poi.x)} y:${Math.round(poi.y)}`;
    info.appendChild(title);
    info.appendChild(coords);

    const idEl = document.createElement("div");
    idEl.className = "text-[11px] text-zinc-400";
    idEl.textContent = `#${poi.id}`;

    item.appendChild(dot);
    item.appendChild(info);
    item.appendChild(idEl);

    item.addEventListener("click", () => selectPOI(poi.id));
    poiList.appendChild(item);
  });
}

// ======= Detalle =======
function renderPOIDetail(poi) {
  poiDetail.classList.remove("hidden");
  detailName.textContent = poi.name;
  detailMeta.textContent = `ID: ${poi.id} • Coordenadas: x:${Math.round(
    poi.x
  )} y:${Math.round(poi.y)}`;

  detailTags.innerHTML = "";
  poi.tags.forEach((t) => {
    const chip = document.createElement("span");
    chip.className =
      "inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px]";
    chip.textContent = t;
    detailTags.appendChild(chip);
  });

  detailLong.textContent = poi.longDescription || "—";
}

function selectPOI(id) {
  selectedId = id;
  document
    .querySelectorAll(".marker")
    .forEach((el) => el.classList.remove("selected"));
  const markerEl = Array.from(document.querySelectorAll(".marker")).find(
    (el) => el.dataset.id === String(id)
  );
  if (markerEl) markerEl.classList.add("selected");

  renderPOIList();

  const poi = POIS.find((p) => String(p.id) === String(id));
  if (poi) renderPOIDetail(poi);
}

// ======= Inicio =======
function build() {
  if (img.complete) img.dispatchEvent(new Event("load"));
}

img.addEventListener("load", () => {
  const baseW = img.naturalWidth;
  const baseH = img.naturalHeight;
  scaleLayer.style.width = baseW + "px";
  scaleLayer.style.height = baseH + "px";

  // Ajuste inicial: que el mapa llene el ancho
  fitToWidth();

  // Render
  renderAllMarkers();
  renderPOIList();
  if (POIS.length > 0) selectPOI(POIS[0].id);
});

window.addEventListener("resize", () => {
  clampStageToViewport();
  if (autoFit) fitToWidth();
});

build();
