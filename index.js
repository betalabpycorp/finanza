/* ============================================================
   CONFIGURACIÓN
   ============================================================ */
const STORAGE_KEY = "misfinanzas_v2";
const TYPE_INFO = {
  venta:  { label:"Venta",  color:"var(--cyan)",    sign:"+" },
  compra: { label:"Compra", color:"var(--amber)",   sign:"−" },
  gasto:  { label:"Gasto",  color:"var(--magenta)", sign:"−" },
};
const MESES = ["enero","febrero","marzo","abril","mayo","junio",
               "julio","agosto","septiembre","octubre","noviembre","diciembre"];

/* ============================================================
   ESTADO
   ============================================================ */
let entries = [];
let addType = "venta";
let histFilter = "all";

/* ============================================================
   UTILIDADES
   ============================================================ */
function money(n){
  const v = Math.round(n);
  return "Gs. " + v.toLocaleString("es-PY");
}
function monthKey(dateStr){ return dateStr.slice(0,7); }
function monthLabel(key){
  const [y,m] = key.split("-");
  return MESES[parseInt(m,10)-1] + " " + y;
}
function todayStr(){
  const d = new Date();
  return d.getFullYear() + "-" +
    String(d.getMonth()+1).padStart(2,"0") + "-" +
    String(d.getDate()).padStart(2,"0");
}
function currentMonthKey(){ return todayStr().slice(0,7); }
function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => (
    {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]
  ));
}
function formatDate(dateStr){
  const [y,m,d] = dateStr.split("-");
  return d + "/" + m + "/" + y;
}
function totalsFor(list){
  const t = { venta:0, compra:0, gasto:0 };
  list.forEach(e => { t[e.type] = (t[e.type] || 0) + Number(e.amount); });
  t.ganancia = t.venta - t.compra;
  t.balance  = t.venta - t.compra - t.gasto;
  return t;
}

/* ============================================================
   PERSISTENCIA
   ============================================================ */
function loadEntries(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    entries = raw ? JSON.parse(raw) : [];
    if(!Array.isArray(entries)) entries = [];
  } catch(err){
    console.error("Error al leer localStorage", err);
    entries = [];
  }
  updateStatus();
  renderHome();
}
function persist(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    updateStatus();
  } catch(err){
    console.error("Error al guardar", err);
    document.getElementById("syncStatus").textContent = "⚠️ No se pudo guardar";
  }
}
function updateStatus(){
  const n = entries.length;
  document.getElementById("syncStatus").textContent =
    n === 0 ? "📊 Sin movimientos todavía"
            : "📊 " + n + " movimiento" + (n === 1 ? "" : "s") + " guardado" + (n === 1 ? "" : "s");
}

/* ============================================================
   RENDER: INICIO
   ============================================================ */
function renderHome(){
  const mk = currentMonthKey();
  document.getElementById("mesActualLabel").textContent =
    "Este mes · " + monthLabel(mk);

  const tMes = totalsFor(entries.filter(e => monthKey(e.date) === mk));
  document.getElementById("homeVentas").textContent    = money(tMes.venta);
  document.getElementById("homeCompras").textContent   = money(tMes.compra);
  document.getElementById("homeGanancia").textContent  = money(tMes.ganancia);
  document.getElementById("homeGastos").textContent    = money(tMes.gasto);

  const balMes = document.getElementById("homeBalance");
  balMes.textContent = money(tMes.balance);
  balMes.style.color = tMes.balance >= 0 ? "var(--green)" : "var(--danger)";

  const tAll = totalsFor(entries);
  const ganTotal = document.getElementById("homeGananciaTotal");
  ganTotal.textContent = money(tAll.ganancia);
  ganTotal.style.color = tAll.ganancia >= 0 ? "var(--green)" : "var(--danger)";

  const balTotal = document.getElementById("homeBalanceTotal");
  balTotal.textContent = money(tAll.balance);
  balTotal.style.color = tAll.balance >= 0 ? "var(--green)" : "var(--danger)";
}

/* ============================================================
   REGISTRAR
   ============================================================ */
function setAddType(type){
  addType = type;
  document.querySelectorAll(".type-tab").forEach(el =>
    el.classList.toggle("active", el.dataset.type === type)
  );
}
function goToAdd(type){
  goTo("add");
  setAddType(type);
  setTimeout(() => document.getElementById("addDesc").focus(), 100);
}
function resetAddForm(){
  document.getElementById("addDesc").value = "";
  document.getElementById("addAmount").value = "";
  document.getElementById("addDate").value = todayStr();
}
function saveEntry(){
  const desc = document.getElementById("addDesc").value.trim()
              || TYPE_INFO[addType].label;
  const amount = parseFloat(document.getElementById("addAmount").value);
  const date = document.getElementById("addDate").value || todayStr();

  if(!amount || amount <= 0){
    alert("Ingresá un monto válido, mayor a 0.");
    return;
  }

  const entry = { id: uid(), type: addType, desc, amount, date };
  entries.push(entry);
  persist();

  const msg = document.getElementById("saveMsg");
  msg.textContent = "✓ Guardado";
  setTimeout(() => { msg.textContent = ""; }, 1800);

  resetAddForm();
  renderHome();
  renderRecent();
}
function renderRecent(){
  const wrap = document.getElementById("recentEntries");
  const recent = [...entries]
    .sort((a,b) => b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1))
    .slice(0,3);
  if(recent.length === 0){ wrap.innerHTML = ""; return; }
  wrap.innerHTML = '<div class="section-title">Últimos movimientos</div>'
    + recent.map(rowHtml).join("");
}

/* ============================================================
   HISTORIAL
   ============================================================ */
function rowHtml(e){
  const info = TYPE_INFO[e.type] || { label:e.type, color:"var(--muted)", sign:"" };
  return '<div class="hist-row">'
    + '<div class="hist-dot" style="background:' + info.color + '"></div>'
    + '<div class="hist-info">'
      + '<div class="hist-desc">' + escapeHtml(e.desc) + '</div>'
      + '<div class="hist-date">' + info.label + ' · ' + formatDate(e.date) + '</div>'
    + '</div>'
    + '<div class="hist-amount" style="color:' + info.color + '">'
      + info.sign + ' ' + money(e.amount)
    + '</div>'
    + '<button class="hist-del" onclick="deleteEntry(\'' + e.id + '\')" aria-label="Eliminar">✕</button>'
  + '</div>';
}

function setHistFilter(f){
  histFilter = f;
  document.querySelectorAll("#histFilters .chip").forEach(el =>
    el.classList.toggle("active", el.dataset.filter === f)
  );
  renderHistory();
}

function renderHistory(){
  const wrap = document.getElementById("historyList");
  const filtered = histFilter === "all"
    ? entries
    : entries.filter(e => e.type === histFilter);

  if(filtered.length === 0){
    wrap.innerHTML = '<div class="empty"><span class="big">📭</span>'
      + (entries.length === 0
          ? 'Todavía no registraste ningún movimiento.'
          : 'No hay movimientos de este tipo.')
      + '</div>';
    return;
  }

  const sorted = [...filtered].sort((a,b) =>
    b.date.localeCompare(a.date) || (b.id > a.id ? 1 : -1)
  );

  let html = "";
  let lastMonth = "";
  sorted.forEach(e => {
    const mk = monthKey(e.date);
    if(mk !== lastMonth){
      html += '<div class="month-sep">' + monthLabel(mk) + '</div>';
      lastMonth = mk;
    }
    html += rowHtml(e);
  });
  wrap.innerHTML = html;
}

function deleteEntry(id){
  if(!confirm("¿Eliminar este movimiento?")) return;
  entries = entries.filter(e => e.id !== id);
  persist();
  renderHome();
  renderHistory();
  renderMonths();
  renderRecent();
}

/* ============================================================
   MESES
   ============================================================ */
function renderMonths(){
  const wrap = document.getElementById("monthsList");
  if(entries.length === 0){
    wrap.innerHTML = '<div class="empty"><span class="big">📅</span>'
      + 'Todavía no hay meses con movimientos.</div>';
    return;
  }

  const keys = [...new Set(entries.map(e => monthKey(e.date)))]
    .sort().reverse();

  wrap.innerHTML = keys.map(k => {
    const t = totalsFor(entries.filter(e => monthKey(e.date) === k));
    const balColor = t.balance >= 0 ? "var(--green)" : "var(--danger)";
    return '<div class="month-card">'
      + '<h3><span>' + monthLabel(k) + '</span>'
        + '<span class="balance" style="color:' + balColor + '">'
          + 'Balance: ' + money(t.balance)
        + '</span></h3>'
      + '<div class="grid2">'
        + '<div class="stat"><div class="card-label">'
          + '<span class="dot" style="background:var(--cyan)"></span>Ventas</div>'
          + '<div class="card-value">' + money(t.venta) + '</div></div>'
        + '<div class="stat"><div class="card-label">'
          + '<span class="dot" style="background:var(--amber)"></span>Compras</div>'
          + '<div class="card-value">' + money(t.compra) + '</div></div>'
        + '<div class="stat"><div class="card-label">'
          + '<span class="dot" style="background:var(--green)"></span>Ganancia</div>'
          + '<div class="card-value">' + money(t.ganancia) + '</div></div>'
        + '<div class="stat"><div class="card-label">'
          + '<span class="dot" style="background:var(--magenta)"></span>Gastos</div>'
          + '<div class="card-value">' + money(t.gasto) + '</div></div>'
      + '</div>'
    + '</div>';
  }).join("");
}

/* ============================================================
   EXPORTAR
   ============================================================ */
function exportData(){
  if(entries.length === 0){
    alert("No hay datos para exportar.");
    return;
  }
  const blob = new Blob([JSON.stringify(entries, null, 2)],
                        { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "misfinanzas-backup-" + todayStr() + ".json";
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   NAVEGACIÓN
   ============================================================ */
function goTo(page){
  document.querySelectorAll(".page").forEach(el =>
    el.classList.remove("active")
  );
  document.getElementById("page-" + page).classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(el =>
    el.classList.toggle("active", el.dataset.page === page)
  );
  window.scrollTo({ top:0, behavior:"smooth" });

  if(page === "home")    renderHome();
  if(page === "add")     renderRecent();
  if(page === "history") renderHistory();
  if(page === "months")  renderMonths();
}

/* ============================================================
   INIT
   ============================================================ */
resetAddForm();
setAddType("venta");
loadEntries();

// Atajos de teclado
document.getElementById("addAmount").addEventListener("keydown", e => {
  if(e.key === "Enter") saveEntry();
});
document.getElementById("addDesc").addEventListener("keydown", e => {
  if(e.key === "Enter") document.getElementById("addAmount").focus();
});