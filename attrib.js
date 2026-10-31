/* Reto Panza de Mamá · atribución de ventas al anuncio (panel /panel de la app).
   - Guarda UTMs y fbclid de la primera visita también en localStorage (por si cambia de pestaña).
   - Al tocar "Recibir mi plan" añade al checkout el id de sesión (sac_sid y sck) y las UTMs.
   - En upsell/downsell/gracias manda un evento al embudo con el mismo id de sesión.
   Uso: <script src="attrib.js" data-page="quiz|upsell|downsell|gracias"></script> después de config.js. */
(function () {
  "use strict";
  var C = window.DIA_CONFIG || {};
  var page = (document.currentScript && document.currentScript.getAttribute("data-page")) || "quiz";
  var ss = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } };
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  var keep = /^(utm_source|utm_medium|utm_campaign|utm_content|utm_term|fbclid|src|sck)=/;
  var qs = location.search.slice(1).split("&").filter(function (x) { return keep.test(x); }).join("&");
  if (qs) { ls("dia_ft", qs); if (!ss("dia_qs")) ss("dia_qs", qs); }
  if (!ss("dia_qs") && ls("dia_ft")) ss("dia_qs", ls("dia_ft"));
  // Mismo id de sesión que usa app.js (sessionStorage "sac_sid"); se copia a localStorage para las páginas de después del pago.
  var sid = ss("dia_sid") || ls("dia_sid");
  if (sid) { ss("dia_sid", sid); ls("dia_sid", sid); }

  function beacon(step, name, ev) {
    sid = sid || ss("dia_sid") || ls("dia_sid");
    if (!C.TRACK_URL || !sid) return;
    var body = JSON.stringify({ sid: sid, step: step, name: name, ev: ev, offer: C.OFFER || "diastasis", utm: ss("dia_qs") || ls("dia_ft") || "" });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(C.TRACK_URL, new Blob([body], { type: "text/plain" }));
      else fetch(C.TRACK_URL, { method: "POST", body: body, keepalive: true, mode: "no-cors" });
    } catch (e) {}
  }

  if (page === "quiz") {
    // Fase de captura: corre antes de que el navegador siga el enlace al checkout.
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-checkout]");
      if (!a || !a.href || a.href.indexOf("http") !== 0) return;
      sid = ss("dia_sid") || sid;
      if (sid) ls("dia_sid", sid);
      try {
        var u = new URL(a.href), q = ss("dia_qs") || ls("dia_ft") || "";
        q.split("&").forEach(function (kv) { var p = kv.split("="); if (p[0] && !u.searchParams.has(p[0])) u.searchParams.set(p[0], decodeURIComponent(p[1] || "")); });
        if (sid) { u.searchParams.set("sac_sid", sid); if (!u.searchParams.has("sck")) u.searchParams.set("sck", sid); }
        a.href = u.toString();
      } catch (err) {}
    }, true);
    return;
  }
  var map = { upsell: [90, "upsell", "compra"], downsell: [91, "downsell", "downsell_view"], gracias: [92, "gracias", "gracias"] };
  if (C.TRACK_URL && /PENDIENTE/.test(C.TRACK_URL)) C.TRACK_URL = "";
  if (!map[page]) return;
  beacon(map[page][0], map[page][1], map[page][2]);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button[onclick]");
    if (!b) return;
    var oc = b.getAttribute("onclick") || "";
    if (/acceptUpsell/.test(oc)) beacon(map[page][0], map[page][1], page + "_si");
    else if (/declineUpsell/.test(oc)) beacon(map[page][0], map[page][1], page + "_no");
  }, true);
})();
