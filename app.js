/* ===========================================================================
   Spending Log — shared household expense tracker
   Reads/writes through three locked-down Supabase functions (see schema.sql).
   Works offline: entries queue on the phone and flush when signal returns.
   =========================================================================== */
(function () {
"use strict";

var C = window.CONFIG || {};
var CATS = C.CATEGORIES || [];
var CAT = {}; CATS.forEach(function (c) { CAT[c.key] = c; });
var BUDGET = CATS.reduce(function (s, c) { return s + c.budget; }, 0);

var LS_PERSON = "spendlog.person";
var LS_CACHE  = "spendlog.cache";
var LS_QUEUE  = "spendlog.queue";

var $ = function (s) { return document.querySelector(s); };

/* ------------------------------------------------------------- storage -- */
function load(k, fb) {
  try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; }
  catch (e) { return fb; }
}
function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

var remote  = load(LS_CACHE, []);      // last known server state
var queue   = load(LS_QUEUE, []);      // unsent ops: {op:'add'|'del', ...}
var person  = localStorage.getItem(LS_PERSON) || "";

/* The household code is the ONLY thing protecting this data, so it must never
   sit in the published files. It travels in the link instead (#h=CODE), is
   remembered on the phone after the first open, and iOS keeps it when the page
   is added to the home screen. CONFIG.HOUSEHOLD stays as a local-dev fallback. */
var LS_HOUSE = "spendlog.household";
function resolveHousehold() {
  var m = (location.hash || "").match(/[#&]h=([A-Za-z0-9_-]{20,})/);
  if (m) { localStorage.setItem(LS_HOUSE, m[1]); return m[1]; }
  return localStorage.getItem(LS_HOUSE) || C.HOUSEHOLD || "";
}
var HOUSE = resolveHousehold();

/* --------------------------------------------------------------- setup -- */
var ready = C.SUPABASE_URL && C.SUPABASE_URL.indexOf("http") === 0 &&
            C.SUPABASE_ANON_KEY && C.SUPABASE_ANON_KEY.indexOf("PASTE") !== 0;

if (!ready) { $("#setup").hidden = false; return; }
if (!HOUSE || HOUSE.length < 20) { $("#nolink").hidden = false; return; }

/* ----------------------------------------------------------------- api -- */
function rpc(fn, args) {
  return fetch(C.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": C.SUPABASE_ANON_KEY,
      "Authorization": "Bearer " + C.SUPABASE_ANON_KEY
    },
    body: JSON.stringify(args)
  }).then(function (r) {
    if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.status); });
    return r.status === 204 ? null : r.json();
  });
}

/* ------------------------------------------------------------- helpers -- */
var money  = function (n) { return "$" + Math.round(n).toLocaleString(); };
var money2 = function (n) { return "$" + n.toFixed(2); };
var ymOf   = function (d) { return d.slice(0, 7); };
function todayISO() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
         "-" + String(d.getDate()).padStart(2, "0");
}
function monthName(ym) {
  var p = ym.split("-");
  return new Date(+p[0], +p[1] - 1, 1)
    .toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
var esc = function (s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
};

/* Merged view: server rows (minus queued deletes) plus queued adds. */
function all() {
  var dead = {};
  queue.forEach(function (q) { if (q.op === "del") dead[q.id] = 1; });
  var out = remote.filter(function (e) { return !dead[e.id]; }).map(function (e) {
    return { id: e.id, date: e.spent_on, cat: e.category, amt: +e.amount,
             note: e.note, person: e.person, pending: false };
  });
  queue.forEach(function (q) {
    if (q.op !== "add") return;
    out.push({ id: q.id, date: q.spent_on, cat: q.category, amt: +q.amount,
               note: q.note, person: q.person, pending: true });
  });
  return out;
}
function spentIn(ym, k, who) {
  return all().reduce(function (s, e) {
    if (ymOf(e.date) !== ym) return s;
    if (k && e.cat !== k) return s;
    if (who && e.person !== who) return s;
    return s + e.amt;
  }, 0);
}

var toastT;
function toast(msg) {
  var t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 1900);
}

/* ---------------------------------------------------------------- sync -- */
var syncing = false;
function setSync(state, txt) {
  var el = $("#sync");
  el.className = "sync" + (state ? " " + state : "");
  $("#syncTxt").textContent = txt;
}
function flush() {
  if (syncing || !navigator.onLine) return Promise.resolve();
  syncing = true;
  setSync("busy", queue.length ? "Sending…" : "Syncing…");

  var chain = Promise.resolve();
  queue.slice().forEach(function (q) {
    chain = chain.then(function () {
      var p = q.op === "add"
        ? rpc("log_entry", { p_household: HOUSE, p_person: q.person,
              p_spent_on: q.spent_on, p_category: q.category,
              p_amount: q.amount, p_note: q.note })
        : rpc("delete_entry", { p_household: HOUSE, p_id: q.id });
      return p.then(function () {
        queue = queue.filter(function (x) { return x.id !== q.id; });
        store(LS_QUEUE, queue);
      });
    });
  });

  return chain
    .then(function () { return rpc("list_entries", { p_household: HOUSE }); })
    .then(function (rows) {
      remote = rows || []; store(LS_CACHE, remote);
      syncing = false;
      setSync("ok", queue.length ? queue.length + " waiting" : "Synced");
      drawAll();
    })
    .catch(function (err) {
      syncing = false;
      setSync("off", navigator.onLine ? "Sync problem" : "Offline");
      if (navigator.onLine) console.warn("sync:", err && err.message);
      drawAll();
    });
}

/* --------------------------------------------------------------- gate --- */
function showGate() {
  $("#gateBtns").innerHTML = (C.PEOPLE || ["Me", "Us"]).map(function (p) {
    return '<button type="button" data-p="' + esc(p) + '">' + esc(p) + "</button>";
  }).join("");
  $("#gate").hidden = false;
}
$("#gateBtns").addEventListener("click", function (e) {
  var b = e.target.closest("[data-p]"); if (!b) return;
  person = b.dataset.p;
  localStorage.setItem(LS_PERSON, person);
  $("#gate").hidden = true; $("#app").hidden = false;
  boot();
});

/* -------------------------------------------------------------- header -- */
function drawHeader() {
  var ym = ymOf(todayISO()), spent = spentIn(ym), left = BUDGET - spent;
  var d = new Date(), dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  var daysLeft = Math.max(1, dim - d.getDate() + 1);

  var a = $("#hdrAmt");
  a.textContent = left >= 0 ? money(left) : "−" + money(-left);
  a.classList.toggle("over", left < 0);
  $("#hdrSub").textContent = left >= 0
    ? money(left / daysLeft) + " a day for " + daysLeft + " more " + (daysLeft === 1 ? "day" : "days")
    : "Over this month's target by " + money(-left);

  var pct = BUDGET ? Math.min(100, (spent / BUDGET) * 100) : 0;
  var bar = $("#hdrBar"); bar.style.width = pct + "%";
  bar.className = left < 0 ? "over" : (pct > 80 ? "warn" : "");
}

/* ----------------------------------------------------------------- log -- */
var amt = "", cat = null;

function drawChips() {
  var ym = ymOf(todayISO());
  $("#chips").innerHTML = CATS.map(function (c) {
    var left = c.budget - spentIn(ym, c.key);
    var neg = c.budget > 0 && left < 0;
    var tag = c.budget === 0 ? "no target"
            : (left >= 0 ? money(left) + " left" : money(-left) + " over");
    return '<button type="button" class="chip' + (cat === c.key ? " sel" : "") +
      '" data-cat="' + c.key + '" style="--cc:var(--c-' + c.key + ')">' +
      '<span class="nm"><span class="dot"></span>' + esc(c.name) + '</span>' +
      '<span class="left' + (neg ? " neg" : "") + '">' + tag + "</span></button>";
  }).join("");
}
function drawAmt() {
  var v = $("#amtVal");
  v.textContent = amt ? money2(parseFloat(amt || "0")) : "$0";
  v.classList.toggle("zero", !amt);
  $("#save").disabled = !(parseFloat(amt || "0") > 0 && cat);
  $("#amtHint").textContent = !amt ? "Tap an amount, pick a category"
    : !cat ? "Now pick a category" : "Logging to " + CAT[cat].name;
}
$("#pad").innerHTML = ["1","2","3","4","5","6","7","8","9",".","0","←"]
  .map(function (k) {
    return '<button type="button" class="key rounded' + (/[.←]/.test(k) ? " util" : "") +
           '" data-k="' + k + '">' + k + "</button>";
  }).join("");

$("#pad").addEventListener("click", function (e) {
  var b = e.target.closest("[data-k]"); if (!b) return;
  var k = b.dataset.k;
  if (k === "←") amt = amt.slice(0, -1);
  else if (k === ".") { if (amt.indexOf(".") < 0) amt = (amt || "0") + "."; }
  else {
    if (amt.indexOf(".") >= 0 && amt.split(".")[1].length >= 2) return;
    if (amt.replace(".", "").length >= 7) return;
    amt = (amt === "0" ? "" : amt) + k;
  }
  drawAmt();
});
$("#chips").addEventListener("click", function (e) {
  var b = e.target.closest("[data-cat]"); if (!b) return;
  cat = b.dataset.cat; drawChips(); drawAmt();
});
$("#noteTog").addEventListener("click", function () {
  var n = $("#note"), open = n.hidden;
  n.hidden = !open;
  this.setAttribute("aria-expanded", String(open));
  if (open) n.focus(); else n.value = "";
});

$("#save").addEventListener("click", function () {
  var v = parseFloat(amt || "0"); if (!(v > 0) || !cat) return;
  queue.push({ op: "add", id: "tmp-" + Date.now() + "-" + Math.round(Math.random() * 1e6),
    person: person, spent_on: todayISO(), category: cat,
    amount: +v.toFixed(2), note: $("#note").value.trim() });
  store(LS_QUEUE, queue);
  var nm = CAT[cat].name;
  amt = ""; cat = null;
  $("#note").value = ""; $("#note").hidden = true;
  $("#noteTog").setAttribute("aria-expanded", "false");
  drawAll(); toast(money2(v) + " → " + nm);
  flush();
});

/* --------------------------------------------------------------- month -- */
var viewYM = ymOf(todayISO());
function shiftYM(ym, n) {
  var p = ym.split("-"), d = new Date(+p[0], +p[1] - 1 + n, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
}
function drawMonth() {
  $("#mTitle").textContent = monthName(viewYM);
  $("#mNext").disabled = viewYM >= ymOf(todayISO());

  $("#split").innerHTML = (C.PEOPLE || []).map(function (p) {
    return '<div><div class="who">' + esc(p) + '</div><div class="amt mono">' +
           money(spentIn(viewYM, null, p)) + "</div></div>";
  }).join("");

  $("#mList").innerHTML = CATS.map(function (c) {
    var s = spentIn(viewYM, c.key);
    var over = c.budget > 0 ? s > c.budget : s > 0;
    var pct = c.budget > 0 ? Math.min(100, (s / c.budget) * 100) : (s > 0 ? 100 : 0);
    var nums = c.budget > 0
      ? "<b>" + money(s) + "</b> of " + money(c.budget)
      : "<b>" + money(s) + "</b> · none set";
    return '<div class="mrow" style="--cc:var(--c-' + c.key + ')">' +
      '<div class="mrow-top"><span class="mrow-name"><span class="dot"></span>' +
      esc(c.name) + '</span><span class="mrow-nums mono' + (over ? " over" : "") + '">' +
      nums + '</span></div><div class="mbar"><i class="' + (over ? "over" : "") +
      '" style="width:' + pct + '%"></i></div></div>';
  }).join("");

  $("#mTot").textContent = money(spentIn(viewYM));
  $("#mBud").textContent = money(BUDGET);
  $("#mFix").textContent = money(C.FIXED_BILLS || 0);
}
$("#mPrev").addEventListener("click", function () { viewYM = shiftYM(viewYM, -1); drawMonth(); });
$("#mNext").addEventListener("click", function () {
  if (viewYM >= ymOf(todayISO())) return; viewYM = shiftYM(viewYM, 1); drawMonth();
});

/* ------------------------------------------------------------- history -- */
function dayLabel(iso) {
  if (iso === todayISO()) return "Today";
  var y = new Date(); y.setDate(y.getDate() - 1);
  var yi = y.getFullYear() + "-" + String(y.getMonth() + 1).padStart(2, "0") +
           "-" + String(y.getDate()).padStart(2, "0");
  if (iso === yi) return "Yesterday";
  var p = iso.split("-");
  return new Date(+p[0], +p[1] - 1, +p[2])
    .toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function drawHist() {
  $("#whoAmI").textContent = person || "—";
  var other = (C.PEOPLE || []).filter(function (n) { return n !== person; })[0];
  $("#shareTxt").textContent = other ? "Send this app to " + other
                                     : "Send this app to the other phone";
  var box = $("#histList"), rows = all();
  if (!rows.length) {
    box.innerHTML = '<div class="empty"><div class="big rounded">Nothing logged yet</div>' +
      "<p>Every time either of you buys something, open this and tap it in.<br>" +
      "It takes about three seconds.</p></div>";
    return;
  }
  var byDay = {};
  rows.forEach(function (e) { (byDay[e.date] = byDay[e.date] || []).push(e); });
  box.innerHTML = Object.keys(byDay).sort().reverse().map(function (d) {
    var tot = byDay[d].reduce(function (s, e) { return s + e.amt; }, 0);
    var items = byDay[d].map(function (e) {
      var sub = [e.person, e.note].filter(Boolean).join(" · ");
      return '<div class="ent' + (e.pending ? " pending" : "") +
        '" style="--cc:var(--c-' + e.cat + ')"><span class="dot"></span>' +
        '<span class="ent-mid"><div class="ent-cat">' +
        esc(CAT[e.cat] ? CAT[e.cat].name : e.cat) + "</div>" +
        (sub ? '<div class="ent-sub">' + esc(sub) + (e.pending ? " · sending…" : "") + "</div>" : "") +
        '</span><span class="ent-amt mono">' + money2(e.amt) + "</span>" +
        '<button type="button" class="ent-del" data-del="' + esc(e.id) +
        '" aria-label="Delete">×</button></div>';
    }).join("");
    return '<div class="day-h"><span>' + dayLabel(d) + '</span><span class="mono">' +
           money2(tot) + "</span></div>" + items;
  }).join("");
}
$("#histList").addEventListener("click", function (e) {
  var b = e.target.closest("[data-del]"); if (!b) return;
  var id = b.dataset.del;
  if (id.indexOf("tmp-") === 0) queue = queue.filter(function (q) { return q.id !== id; });
  else queue.push({ op: "del", id: id });
  store(LS_QUEUE, queue);
  drawAll(); toast("Removed"); flush();
});
function shareLink() {
  return location.origin + location.pathname + "#h=" + HOUSE;
}
function shareMessage() {
  var other = (C.PEOPLE || []).filter(function (n) { return n !== person; })[0] || "you";
  return "Here's our spending tracker \u2014 it's already set up for " + other + ".\n\n" +
         shareLink() + "\n\n" +
         "Open that in Safari, tap your name, then tap the Share button at the bottom " +
         "and \"Add to Home Screen\" so it's an icon on your phone.\n\n" +
         "When you buy something: tap the amount, tap what it was, tap Log it.";
}

/* Always reveal the link, THEN try the share sheet. If the sheet doesn't open
   (or gets dismissed) there is still something on screen to copy. */
$("#share").addEventListener("click", function () {
  $("#shareLink").value = shareLink();
  $("#shareBox").hidden = false;
  if (navigator.share) navigator.share({ text: shareMessage() }).catch(function () {});
});

$("#shareCopy").addEventListener("click", function () {
  var el = $("#shareLink");
  el.focus(); el.setSelectionRange(0, el.value.length);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(el.value)
      .then(function () { toast("Link copied"); })
      .catch(function () { toast("Press and hold to copy"); });
  } else {
    try { document.execCommand("copy"); toast("Link copied"); }
    catch (e) { toast("Press and hold to copy"); }
  }
});

$("#switch").addEventListener("click", function () {
  localStorage.removeItem(LS_PERSON); person = "";
  $("#app").hidden = true; showGate();
});

/* -------------------------------------------------------------- export -- */
$("#export").addEventListener("click", function () {
  var rows = all().slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  if (!rows.length) { toast("Nothing to export yet"); return; }
  var csv = [["date", "who", "category", "amount", "note"]].concat(
    rows.map(function (e) {
      return [e.date, e.person, CAT[e.cat] ? CAT[e.cat].name : e.cat,
              e.amt.toFixed(2), e.note || ""];
    })
  ).map(function (r) {
    return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(",");
  }).join("\n");

  var blob = new Blob([csv], { type: "text/csv" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url; a.download = "spending-" + todayISO() + ".csv";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast("Exported");
});

/* ---------------------------------------------------------------- tabs -- */
document.querySelectorAll(".tab").forEach(function (t) {
  t.addEventListener("click", function () {
    document.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("on", x === t); });
    document.querySelectorAll(".pane").forEach(function (p) {
      p.classList.toggle("on", p.id === "pane-" + t.dataset.tab);
    });
    if (t.dataset.tab === "month") { viewYM = ymOf(todayISO()); drawMonth(); }
    window.scrollTo(0, 0);
  });
});

/* ----------------------------------------------------------------- run -- */
function drawAll() { drawHeader(); drawChips(); drawAmt(); drawMonth(); drawHist(); }

var poll;
function boot() {
  drawAll();
  flush();
  clearInterval(poll);
  poll = setInterval(function () { if (!document.hidden) flush(); }, 12000);
}
document.addEventListener("visibilitychange", function () { if (!document.hidden) flush(); });
window.addEventListener("online", function () { setSync("busy", "Syncing…"); flush(); });
window.addEventListener("offline", function () { setSync("off", "Offline"); });

if (!person) { showGate(); } else { $("#app").hidden = false; boot(); }

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
})();
