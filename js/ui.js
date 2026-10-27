/* Page look and feel: theme, LED colours, live clock, ticker, world time,
   store status, visitor count, product pop-up, menu highlight */

/* ---------- live clock, ticker (date, time, location) ---------- */
let place = "Karachi, Pakistan";
const WORLD = [
  ["Karachi", "Asia/Karachi"],
  ["Dubai", "Asia/Dubai"],
  ["London", "Europe/London"],
  ["New York", "America/New_York"],
  ["Tokyo", "Asia/Tokyo"],
];
// build the world time cards once, then only the numbers change every second
const worldFmt = WORLD.map(([, tz]) => ({
  time: new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  day: new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" }),
}));
if ($("#worldGrid"))
  $("#worldGrid").innerHTML = WORLD.map(
    ([city], i) =>
      `<div class="col"><div class="world-card"><p class="city">${city}</p><p class="wtime" id="wt${i}">--:--</p><p class="wday" id="wd${i}"></p></div></div>`,
  ).join("");

function tick() {
  const now = new Date();
  if ($("#liveClock")) {
    const p2 = (n) => String(n).padStart(2, "0");
    $("#liveClock").innerHTML =
      `${p2(now.getHours())}<i>:</i>${p2(now.getMinutes())}<i>:</i>${p2(now.getSeconds())}`;
    $("#liveDate").textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if ($("#worldGrid"))
    worldFmt.forEach((f, i) => {
      $("#wt" + i).textContent = f.time.format(now);
      $("#wd" + i).textContent = f.day.format(now);
    });
  const msg = `Quartz accuracy · Hand finished · Scratch-resistant glass · Since 1985 · ${now.toLocaleDateString(undefined, { dateStyle: "full" })} · ${now.toLocaleTimeString()} · ${place} · `;
  $("#ticker").textContent = msg + msg;
}
setInterval(tick, 1000);
tick();
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    (p) => {
      place = `Lat ${p.coords.latitude.toFixed(2)}, Lon ${p.coords.longitude.toFixed(2)}`;
    },
    () => {},
  );

/* ---------- visitor count (counts this browser only) ---------- */
let visits = +localStorage.getItem("ac_visits") || 1000;
if (!sessionStorage.getItem("ac_counted")) {
  visits++;
  localStorage.setItem("ac_visits", visits);
  sessionStorage.setItem("ac_counted", "1");
}
$$(".visit-count").forEach((el) => (el.textContent = visits.toLocaleString()));

/* ---------- store status: drives the hero LED lights and the badge ---------- */
// Store hours (Karachi time): Monday to Saturday, 10:00 - 21:00, Sunday closed.
const OPEN_H = 10,
  CLOSE_H = 21,
  SOON_MIN = 60;
function storeStatus() {
  const k = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
  );
  const mins = k.getHours() * 60 + k.getMinutes(),
    day = k.getDay(); // 0 = Sunday
  const fmt = (h) => (h > 12 ? h - 12 : h) + ":00 " + (h >= 12 ? "PM" : "AM");
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const nextOpen = () => {
    let d = day,
      add = mins < OPEN_H * 60 && day !== 0 ? 0 : 1;
    d = (day + add) % 7;
    if (d === 0) d = 1; // skip Sunday
    return (
      (add === 0
        ? "today "
        : d === (day + 1) % 7
          ? "tomorrow "
          : days[d] + " ") + fmt(OPEN_H)
    );
  };
  if (day !== 0 && mins >= OPEN_H * 60 && mins < CLOSE_H * 60) {
    const left = CLOSE_H * 60 - mins;
    return left <= SOON_MIN
      ? { state: "soon", text: "Closing soon · " + fmt(CLOSE_H) }
      : { state: "open", text: "Open now · until " + fmt(CLOSE_H) };
  }
  const toOpen = OPEN_H * 60 - mins;
  if (day !== 0 && toOpen > 0 && toOpen <= SOON_MIN)
    return { state: "soon", text: "Opening soon · " + fmt(OPEN_H) };
  return { state: "closed", text: "Closed · opens " + nextOpen() };
}
function updateStoreStatus() {
  const st = storeStatus();
  const box = $("#storeStatus");
  if (box) {
    box.dataset.state = st.state;
    $("#storeText").textContent = st.text;
  }
  const badge = $("#openNow");
  if (badge) {
    badge.className =
      "badge " +
      {
        open: "text-bg-success",
        soon: "text-bg-warning",
        closed: "text-bg-danger",
      }[st.state];
    badge.textContent = st.text;
  }
}
updateStoreStatus();
setInterval(updateStoreStatus, 30000);

/* ---------- theme + back-to-top ---------- */
function setTheme(dark) {
  document.documentElement.setAttribute(
    "data-bs-theme",
    dark ? "dark" : "light",
  );
  $("#themeToggle").checked = dark;
  localStorage.setItem("ac_dark", dark ? "1" : "0");
}
$("#themeToggle").onchange = (e) => setTheme(e.target.checked);
setTheme(localStorage.getItem("ac_dark") !== "0");
addEventListener("scroll", () =>
  $("#topBtn").classList.toggle("show", scrollY > 300),
);

/* ---------- product details pop-up (home page) ---------- */
function openProduct(id) {
  const p = byId(id);
  if (!p || !$("#productModal")) return;
  const [move, size, feat] = p.spec.split(" · ");
  const left = stockLeft(p);
  $("#productModalBody").innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title fs-5" id="productModalTitle">${esc(p.name)}</h2>
      <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body"><div class="row align-items-center g-4">
      <div class="col-md-5 text-center detail-clock">${clockImg(p)}</div>
      <div class="col-md-7">
        <p class="cat">${catName(p.cat)} clock</p>
        <p class="mb-1">${ratingSummaryHTML(p.id)}</p>
        <p class="price fs-4 mb-2">${money(p.price)}</p>
        <p>${esc(p.desc)}</p>
        <dl class="spec"><dt>Movement</dt><dd>${esc(move)}</dd><dt>Size</dt><dd>${esc(size)}</dd><dt>Feature</dt><dd>${esc(feat)}</dd><dt>Warranty</dt><dd>1 year</dd></dl>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-grad" data-bs-dismiss="modal" onclick="addToCart(${p.id})" ${left ? "" : "disabled"}>${left ? "Add to cart" : "Sold out"}</button>
          ${heartBtn(p.id, true)}
          <a class="btn btn-outline-secondary" href="${PRODUCT_PAGE}?id=${p.id}" data-fullpage>Open full page</a>
        </div>
      </div>
    </div></div>`;
  bsModal("#productModal").show();
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href*="pages/product.html?id="]');
  if (a && $("#productModal") && !a.hasAttribute("data-fullpage")) {
    e.preventDefault();
    openProduct(+new URL(a.href).searchParams.get("id"));
  }
  const b = e.target.closest("[data-add]");
  if (b) addToCart(+b.dataset.add);
  if (e.target.id === "topBtn") {
    e.preventDefault();
    scrollTo({ top: 0, behavior: "smooth" });
  }
  // close the mobile menu after choosing a section
  if (e.target.closest(".navbar .nav-link")) {
    const m = $("#nav");
    if (m.classList.contains("show"))
      bootstrap.Collapse.getOrCreateInstance(m).hide();
  }
});

/* ---------- highlight the nav link of the section in view ---------- */
if (ON_HOME) {
  const keys = $$(".navbar .nav-link[data-key]").map((l) => l.dataset.key);
  const spy = () => {
    let cur = "home";
    keys.forEach((k) => {
      const s = document.getElementById(k);
      if (s && s.getBoundingClientRect().top < 140) cur = k;
    });
    $$(".navbar .nav-link").forEach((l) => {
      const on = l.dataset.key === cur;
      l.classList.toggle("active", on);
      if (on) l.setAttribute("aria-current", "true");
      else l.removeAttribute("aria-current");
    });
  };
  addEventListener("scroll", spy);
  spy();
}

/* ---------- LED colour theme: the red / amber / green dots under the clock ---------- */
function setLed(color) {
  if (!["red", "amber", "green"].includes(color)) color = "amber";
  document.documentElement.dataset.led = color;
  localStorage.setItem("ac_led", color);
  $$(".led-picker .led").forEach((b) => {
    const on = b.dataset.led === color;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
  });
}
setLed(localStorage.getItem("ac_led") || "amber");
document.addEventListener("click", (e) => {
  const b = e.target.closest(".led-picker .led");
  if (!b) return;
  setLed(b.dataset.led);
  // each colour also opens a random clock from one product line
  const line = { red: "luxury", amber: "vintage", green: "wall" }[
    b.dataset.led
  ];
  const picks = products.filter((p) => p.cat === line);
  if (picks.length)
    openProduct(picks[Math.floor(Math.random() * picks.length)].id);
});
