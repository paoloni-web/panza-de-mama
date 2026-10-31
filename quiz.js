/* Reto Panza de Mamá 21 · lógica del quiz.
   Clonada del original (desafio21d.myrnnagurgel.com.br): mismas etapas, mismo orden y mismas funciones
   (go, pick, toggle, sclPick, steppers, buildResult, loadAnim). Sin píxeles de terceros.
   Añadido: medición por etapa (panel /panel), kg/lb, temporizador de 10 min, nombre en la oferta y el checkout. */
(function () {
  "use strict";
  var C = window.DIA_CONFIG || {};
  var ss = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };

  // ===== ESTADO =====
  var state = {
    peso: 70, altura: 160, ideal: 60, unit: "kg",
    ocasion: "", plazo: 8, nombre: "", edad: "",
    tiempoParto: "", tipoParto: "", tipoPanza: "", impacto: "", objetivo: "", minutos: "10",
    sintomas: [], intentos: []
  };
  try { var saved = JSON.parse(ss("dia_state") || "null"); if (saved) for (var k in saved) state[k] = saved[k]; } catch (e) {}
  var cur = 0;
  var pMap = {1:8,2:14,3:20,4:26,5:32,6:36,7:42,8:48,9:54,10:60,11:66,12:72,13:78,14:84,15:88,16:92,17:95,18:97,19:99,20:99,21:99,22:100};
  var save = function () { ss("dia_state", JSON.stringify(state)); };

  // ===== MEDICIÓN POR ETAPA (mismo sistema que el funnel 1: /api/t → Supabase funnel_events) =====
  var sid = ss("dia_sid");
  if (!sid) { sid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)); ss("dia_sid", sid); }
  window.DIA_SID = sid;
  if (/[?&]reset=1/.test(location.search)) { try { sessionStorage.clear(); } catch (e) {} location.replace(location.pathname + location.search.replace(/[?&]reset=1/, "").replace(/^&/, "?")); return; }
  function track(step, name, ev) {
    if (!C.TRACK_URL || /PENDIENTE/.test(C.TRACK_URL)) { if (window.console) console.log("[track]", step, name, ev || "view"); return; }
    var body = JSON.stringify({ sid: sid, step: step, name: name, ev: ev || "view", offer: C.OFFER || "diastasis", utm: ss("dia_qs") || "" });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(C.TRACK_URL, new Blob([body], { type: "text/plain" }));
      else fetch(C.TRACK_URL, { method: "POST", body: body, keepalive: true, mode: "no-cors" });
    } catch (e) {}
  }
  var seen = {};

  // ===== PÍXEL (vacío = no se carga) =====
  if (C.META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq("init", C.META_PIXEL_ID); fbq("track", "PageView");
  }
  var px = function (ev, data) { if (window.fbq) fbq("track", ev, data || {}); };

  // ===== NAVEGACIÓN =====
  function go(n) {
    var prevEl = document.getElementById("s" + cur);
    if (prevEl) prevEl.classList.remove("active");
    cur = n;
    var nextEl = document.getElementById("s" + n);
    if (nextEl) nextEl.classList.add("active");
    var pw = document.getElementById("progressWrap");
    if (pw) {
      if (n === 0) pw.style.display = "none";
      else {
        pw.style.display = "block";
        var pct = pMap[n] || 0;
        document.getElementById("pFill").style.width = pct + "%";
        document.getElementById("pPct").textContent = pct + "%";
        document.getElementById("pTrack").setAttribute("aria-valuenow", pct);
      }
    }
    window.scrollTo(0, 0);
    if (n === 12) renderPeso();
    if (n === 13) onAlturaChange(state.altura);
    if (n === 14) { if (state.ideal >= state.peso || state.peso - state.ideal > 40) state.ideal = Math.max(40, state.peso - 8); onIdealChange(show(state.ideal)); }
    if (n === 17) loadAnim();
    if (n === 19) buildResult();
    if (n === 22) buildOffer();
    if (n === 1) px("ViewContent");
    if (n === 22) px("Lead");
    ss("dia_cur", n); save();
    if (!seen[n]) { seen[n] = 1; track(n, (nextEl && nextEl.getAttribute("data-name")) || "s" + n); }
  }

  function pick(el, next, key) {
    var opts = el.closest(".opts");
    if (opts) opts.querySelectorAll(".opt").forEach(function (c) { c.classList.remove("selected"); });
    el.classList.add("selected");
    if (key && el.getAttribute("data-value")) state[key] = el.getAttribute("data-value");
    setTimeout(function () { go(next); }, 280);
  }
  function pickGrid(el, next, key) {
    var grid = el.closest(".grid-2");
    if (grid) grid.querySelectorAll(".grid-opt").forEach(function (c) { c.classList.remove("selected"); });
    el.classList.add("selected");
    if (key) state[key] = el.getAttribute("data-value");
    setTimeout(function () { go(next); }, 280);
  }
  function toggle(el) {
    el.classList.toggle("selected");
    var box = el.closest(".opts"), key = box && box.getAttribute("data-multi");
    if (key) state[key] = [].map.call(box.querySelectorAll(".opt.selected"), function (o) { return o.getAttribute("data-value"); });
  }
  function sclPick(el, next) {
    document.querySelectorAll(".s-btn").forEach(function (b) { b.classList.remove("selected"); });
    el.classList.add("selected");
    state.compromiso = Number(el.textContent);
    setTimeout(function () { go(next); }, 300);
  }
  function ocasionPick(el, valor, next) {
    var grid = el.closest(".grid-2");
    if (grid) grid.querySelectorAll(".grid-opt").forEach(function (c) { c.classList.remove("selected"); });
    el.classList.add("selected");
    state.ocasion = valor;
    setTimeout(function () { go(next); }, 280);
  }
  function plazoPick(el, semanas, next) {
    var opts = el.closest(".opts");
    if (opts) opts.querySelectorAll(".opt").forEach(function (c) { c.classList.remove("selected"); });
    el.classList.add("selected");
    state.plazo = semanas;
    setTimeout(function () { go(next); }, 280);
  }

  // ===== PESO / ESTATURA / IDEAL (kg o lb; se guarda siempre en kg) =====
  var LB = 2.20462;
  var show = function (kg) { return state.unit === "lb" ? Math.round(kg * LB) : Math.round(kg); };
  function setUnit(u) {
    state.unit = u;
    document.querySelectorAll(".unit-toggle button").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-u") === u); });
    renderPeso();
  }
  function renderPeso() {
    var s = document.getElementById("pesoSlider");
    s.min = show(40); s.max = show(150); s.value = show(state.peso);
    document.getElementById("pesoDisplay").innerHTML = show(state.peso) + "<span>" + state.unit + "</span>";
  }
  function onPesoChange(v) {
    var n = parseInt(v, 10);
    state.peso = state.unit === "lb" ? n / LB : n;
    document.getElementById("pesoDisplay").innerHTML = show(state.peso) + "<span>" + state.unit + "</span>";
    if (state.ideal >= state.peso) state.ideal = Math.max(40, state.peso - 1);
  }
  function stepPeso(d) { var cur = show(state.peso) + d; var s = document.getElementById("pesoSlider"); cur = Math.max(+s.min, Math.min(+s.max, cur)); s.value = cur; onPesoChange(cur); }
  function onAlturaChange(v) {
    state.altura = parseInt(v, 10);
    document.getElementById("alturaDisplay").innerHTML = state.altura + "<span>cm</span>";
    document.getElementById("alturaSlider").value = state.altura;
    var inches = state.altura / 2.54, ft = Math.floor(inches / 12), inch = Math.round(inches - ft * 12);
    if (inch === 12) { ft++; inch = 0; }
    document.getElementById("altFt").textContent = "= " + ft + " pies " + inch + " pulgadas";
  }
  function stepAltura(d) { onAlturaChange(Math.max(140, Math.min(200, state.altura + d))); }
  function onIdealChange(v) {
    var n = parseInt(v, 10), kg = state.unit === "lb" ? n / LB : n;
    kg = Math.max(40, Math.min(state.peso - 1, kg));
    state.ideal = kg;
    var s = document.getElementById("idealSlider");
    s.min = show(40); s.max = show(state.peso - 1); s.value = show(kg);
    document.getElementById("idealDisplay").innerHTML = show(kg) + "<span>" + state.unit + "</span>";
    document.getElementById("metaTag").textContent = "Meta: bajar " + Math.max(0, show(state.peso) - show(kg)) + " " + state.unit;
  }
  function stepIdeal(d) { onIdealChange(show(state.ideal) + d); }

  // ===== NOMBRE =====
  function goDiagnostico() {
    var el = document.getElementById("iName"), name = el.value.trim().replace(/[<>]/g, "");
    var err = document.getElementById("nameErr");
    if (!name) { err.hidden = false; el.focus(); return; }
    err.hidden = true;
    state.nombre = name.split(" ")[0].slice(0, 20);
    state.nombre = state.nombre.charAt(0).toUpperCase() + state.nombre.slice(1);
    go(19);
  }

  // ===== DIAGNÓSTICO (4 perfiles, como el original) =====
  function getProfile() {
    if (state.tipoParto === "cesarea") return "cesarea";
    if (state.tipoParto === "multiples") return "multiples";
    if (state.tiempoParto === "antiguo") return "antiguo";
    return "reciente";
  }
  var profileData = {
    reciente: {
      titulo: "Separación posparto activa", grau: "Reciente y con muy buena respuesta", markerPos: 45,
      cabecalho: "Tu cuerpo está en la mejor etapa para recuperarse.",
      texto: "Tus respuestas muestran que estás en la etapa en la que el abdomen responde más rápido. En los primeros meses y años después del parto, el músculo transverso responde muy bien cuando se activa de la forma correcta. El problema es que nadie te enseñó cómo. Las dietas y los abdominales normales no activan ese músculo; al contrario, aumentan la presión dentro de la panza. Con 10 minutos al día de los ejercicios correctos, tu cuerpo está listo para notar el cambio en 21 días.",
      tags: ["✓ Etapa de respuesta rápida", "✓ Reto acelerado", "✓ Avance que se mide en 21 días"]
    },
    cesarea: {
      titulo: "Separación después de cesárea", grau: "Necesita un reto específico", markerPos: 62,
      cabecalho: "La cesárea deja un patrón muscular diferente y necesita un enfoque propio.",
      texto: "Si tuviste cesárea, tienes un reto extra: además de la separación, la cicatriz cambia cómo trabajan el suelo pélvico y el abdomen profundo. Por eso los ejercicios genéricos no funcionan y pueden incomodar. El Reto Panza de Mamá 21 trae una guía especial para cesárea que respeta tu cicatriz y activa el transverso poco a poco y de forma segura, de adentro hacia afuera.",
      tags: ["✓ Guía especial para cesárea", "✓ Respeta tu cicatriz", "✓ Activación segura y progresiva"]
    },
    multiples: {
      titulo: "Separación por varios embarazos", grau: "Moderado a avanzado", markerPos: 72,
      cabecalho: "Cada embarazo aumenta la separación, pero el músculo sigue respondiendo.",
      texto: "Con cada embarazo el músculo transverso queda un poco más débil. Lo que sientes hoy (panza que no vuelve, dolor de espalda, escapes) es el resultado acumulado de años de presión dentro de la panza sin el músculo que la sostiene. La buena noticia: ese músculo se puede despertar en cualquier etapa. El reto empieza por la activación más básica y avanza poco a poco, respetando tu historia.",
      tags: ["✓ Reto progresivo", "✓ Adaptado a varios embarazos", "✓ Avance que se mide en 21 días"]
    },
    antiguo: {
      titulo: "Separación de hace tiempo", grau: "De años, pero con solución", markerPos: 78,
      cabecalho: "Que hayan pasado años no significa que se te pasó el momento.",
      texto: "Muchas mamás creen que después de unos años ya es tarde. No lo es. El músculo transverso responde a la activación correcta sin importar cuánto tiempo lleve la separación. Lo que pasa con el tiempo es que tu cuerpo aprende a moverse sin usar ese músculo. El reto reeduca ese patrón en 21 días y le enseña a tu cuerpo a usar otra vez su faja natural.",
      tags: ["✓ Funciona años después del parto", "✓ Reeduca el patrón muscular", "✓ A tu ritmo"]
    }
  };
  function buildResult() {
    var nombre = state.nombre || "Tú";
    var data = profileData[getProfile()];
    document.getElementById("diagHeadline").textContent = nombre + ", puedes sentir tu abdomen más firme desde la primera semana con el Reto Panza de Mamá 21";
    document.getElementById("marker").style.left = data.markerPos + "%";
    document.getElementById("grauTexto").textContent = data.grau;
    var semanas = [4, 8, 12].indexOf(Number(state.plazo)) !== -1 ? Number(state.plazo) : 8;
    document.getElementById("checkpointText").innerHTML = "<strong>Semana " + semanas + ":</strong> compara tus medidas, tus fotos y cómo te sientes" + (state.ocasion ? ", justo a tiempo para " + esc(state.ocasion) : "") + ".";
    document.getElementById("diagCabecalho").textContent = nombre + ", identificamos: " + data.titulo + ". " + data.cabecalho;
    document.getElementById("diagTexto").textContent = data.texto;
    var tags = document.getElementById("diagTags"); tags.innerHTML = "";
    var extra = [];
    if (state.sintomas.indexOf("escapes") > -1) extra.push("✓ Suelo pélvico incluido");
    if (state.sintomas.indexOf("espalda") > -1) extra.push("✓ Alivio para la espalda");
    if (state.intentos.indexOf("gym") > -1) extra.push("✓ Sin abdominales tradicionales");
    data.tags.concat(extra).forEach(function (t) { var s = document.createElement("span"); s.className = "stag"; s.textContent = t; tags.appendChild(s); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // ===== CARGA (~10 s, Franco L 4.2) =====
  function loadAnim() {
    var steps = [
      { id: "ls1", pct: 20, delay: 1200, status: "Identificando tu tipo de separación…" },
      { id: "ls2", pct: 40, delay: 3200, status: "Cruzando síntomas y tipo de parto…" },
      { id: "ls3", pct: 60, delay: 5200, status: "Organizando tu seguimiento…" },
      { id: "ls4", pct: 80, delay: 7200, status: "Armando tu reto de 21 días…" },
      { id: "ls5", pct: 100, delay: 9000, status: "Terminando… ¡ya casi!" }
    ];
    var bar = document.getElementById("lBar"), st = document.getElementById("lStatus");
    steps.forEach(function (step, i) {
      setTimeout(function () {
        if (i > 0) { var p = document.getElementById(steps[i - 1].id); p.classList.remove("active"); p.classList.add("done"); p.querySelector(".sdot").textContent = "✓"; }
        document.getElementById(step.id).classList.add("active");
        bar.style.width = step.pct + "%"; st.textContent = step.status;
      }, step.delay);
    });
    setTimeout(function () {
      var last = document.getElementById("ls5"); last.classList.remove("active"); last.classList.add("done"); last.querySelector(".sdot").textContent = "✓";
      go(18);
    }, 10200);
  }

  // ===== OFERTA =====
  var timerStarted = false;
  function buildOffer() {
    if (state.nombre) document.getElementById("offerTitle").textContent = state.nombre + ", tu Reto Panza de Mamá 21 personalizado está listo";
    if (timerStarted) return; timerStarted = true;
    var end = Number(ss("dia_timer_end")) || (Date.now() + (C.TIMER_MINUTES || 10) * 60e3);
    ss("dia_timer_end", end);
    var el = document.getElementById("timer");
    (function tick() {
      var s = Math.max(0, Math.round((end - Date.now()) / 1000));
      el.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      if (s > 0) setTimeout(tick, 1000);
    })();
  }
  function goCheckout(a) {
    track(22, "offer", "checkout_click");
    px("InitiateCheckout", { value: C.PRICE, currency: "USD" });
    save();
    var url = C.CHECKOUT_URL;
    try {
      var u = new URL(url);
      if (state.nombre && !u.searchParams.has("name")) u.searchParams.set("name", state.nombre);
      // UTMs + id de sesión para atribuir la venta al creativo en el panel (lo mismo que hace attrib.js en el funnel 1).
      var q = ss("dia_qs") || (function () { try { return localStorage.getItem("dia_ft"); } catch (e) { return ""; } })() || "";
      q.split("&").forEach(function (kv) { var p = kv.split("="); if (p[0] && !u.searchParams.has(p[0])) u.searchParams.set(p[0], decodeURIComponent(p[1] || "")); });
      u.searchParams.set("sac_sid", sid); if (!u.searchParams.has("sck")) u.searchParams.set("sck", sid);
      try { localStorage.setItem("dia_sid", sid); } catch (e) {}
      url = u.toString();
    } catch (e) {}
    a.href = url; // attrib.js añade UTMs y el id de sesión en la fase de captura
    return true;
  }

  // ===== SLIDER DE LA APP =====
  (function () {
    var i = 0;
    setInterval(function () {
      var track = document.getElementById("appTrack"), w = document.getElementById("appSlider");
      if (!track || !w || !w.offsetParent) return;
      var d = w.querySelectorAll(".app-dots span"), total = track.children.length;
      d[i].classList.remove("active"); i = (i + 1) % total; d[i].classList.add("active");
      track.style.transform = "translateX(-" + (i * 100) + "%)";
    }, 4000);
  })();

  // ===== VÍDEOS (Franco L 4.4) Y NOTA DE TESTIMONIOS =====
  (function () {
    var row = document.getElementById("videoRow");
    if (C.VIDEOS && C.VIDEOS.length && row) {
      row.hidden = false;
      row.innerHTML = C.VIDEOS.map(function (v) {
        return '<figure class="vid"><video src="' + v.src + '" poster="' + v.poster + '" muted playsinline loop preload="none"></video>' +
          '<button type="button" class="vid-sound">🔊 Escuchar</button><figcaption>' + esc(v.name) + ' · ' + esc(v.city) + '</figcaption></figure>';
      }).join("");
      row.querySelectorAll(".vid").forEach(function (f) {
        var v = f.querySelector("video");
        f.querySelector(".vid-sound").onclick = function () { v.muted = false; v.currentTime = 0; v.play(); this.remove(); };
        if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) v.play().catch(function () {}); else v.pause(); }); }, { threshold: 0.5 }).observe(v);
      });
    }
    if (!C.SHOW_TESTIMONIAL_NOTE) document.querySelectorAll("[data-testi-note]").forEach(function (n) { n.remove(); });
  })();

  // Expone las funciones que usan los onclick del HTML (igual que el original).
  Object.assign(window, { go: go, pick: pick, pickGrid: pickGrid, toggle: toggle, sclPick: sclPick, ocasionPick: ocasionPick, plazoPick: plazoPick,
    setUnit: setUnit, onPesoChange: onPesoChange, stepPeso: stepPeso, onAlturaChange: onAlturaChange, stepAltura: stepAltura,
    onIdealChange: onIdealChange, stepIdeal: stepIdeal, goDiagnostico: goDiagnostico, goCheckout: goCheckout });

  // Vuelve a la etapa en la que estaba si regresa del checkout (como el original).
  var back = Number(ss("dia_cur"));
  if (back >= 19 && back <= 22) go(back); else track(0, "portada");
  seen[0] = 1;
})();
