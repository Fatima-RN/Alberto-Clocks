/* Products: clock pictures, cards, loading, listing page and detail page */

/* ---------- stock (data/products.json has a "stock" number for each clock) ---------- */
const stockLeft = (p) => {
  const sold = store.get("ac_sold", {})[p.id] || 0;
  return Math.max(0, (p.stock ?? 99) - sold);
};

/* ---------- clock picture ---------- */
// clock face drawn from the colours in products.json (used if no picture can load)
function clockSVG(p) {
  const [h, m] = p.time.split(":").map(Number);
  const ha = ((h % 12) + m / 60) * 30,
    ma = m * 6;
  let ticks = "";
  for (let i = 0; i < 12; i++)
    ticks += `<line x1="50" y1="9" x2="50" y2="${i % 3 ? 12 : 15}" stroke="${p.hand}" stroke-width="1.5" transform="rotate(${i * 30} 50 50)"/>`;
  return `<svg viewBox="0 0 100 100" role="img" aria-label="${esc(p.name)}">
    <circle cx="50" cy="50" r="46" fill="${p.face}" stroke="${p.ring}" stroke-width="6"/>${ticks}
    <line x1="50" y1="50" x2="50" y2="26" stroke="${p.hand}" stroke-width="3" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>
    <line x1="50" y1="50" x2="50" y2="18" stroke="${p.hand}" stroke-width="2" stroke-linecap="round" transform="rotate(${ma} 50 50)"/>
    <circle cx="50" cy="50" r="3" fill="${p.ring}"/></svg>`;
}
// real product photo (falls back to the drawn clock if the image cannot load)
function clockImg(p) {
  const src = /^https?:/.test(p.img) ? p.img : ROOT + p.img;
  return `<img class="pimg" src="${src}" alt="${esc(p.name)}" loading="lazy" onerror="imgFallback(this, ${p.id})">`;
}
// if the photo cannot load: try the local drawing, then the drawn clock
function imgFallback(el, id) {
  const p = byId(id);
  if (p.fallback && !el.dataset.tried) {
    el.dataset.tried = "1";
    el.src = ROOT + p.fallback;
  } else {
    el.outerHTML = clockSVG(p);
  }
}

/* ---------- product card ---------- */
function card(p) {
  const left = stockLeft(p),
    r = ratingOf(p.id);
  const badge =
    left === 0
      ? '<span class="stock-badge out">Out of stock</span>'
      : left <= 3
        ? `<span class="stock-badge">Only ${left} left</span>`
        : "";
  return `
  <div class="col-lg-4 col-6"><div class="product-card">
    ${clockImg(p)}${badge}${heartBtn(p.id)}
    <p class="cat">${catName(p.cat)}</p>
    ${r ? `<p class="rating-line">${starsHTML(r.avg)} ${r.avg.toFixed(1)} (${r.n})</p>` : ""}
    <h5><a class="stretched-link" href="${PRODUCT_PAGE}?id=${p.id}">${esc(p.name)}</a></h5>
    <p class="price">${money(p.price)}</p>
    <button class="btn btn-grad btn-sm btn-add" data-add="${p.id}" ${left ? "" : "disabled"}>${left ? "Add to cart" : "Sold out"}</button>
  </div></div>`;
}

/* ---------- loading ---------- */
// grey shimmering boxes shown while data/products.json is loading
function showSkeleton(n = 6) {
  const grid = $("#productGrid");
  if (grid)
    grid.innerHTML = Array.from(
      { length: n },
      () =>
        '<div class="col-lg-4 col-6"><div class="skeleton-card" aria-hidden="true"></div></div>',
    ).join("");
  if (grid) grid.setAttribute("aria-busy", "true");
}

function loadProducts() {
  return fetch(ROOT + "data/products.json")
    .then((r) => r.json())
    .then((d) => {
      products = d;
    })
    .catch(() => {
      const box = $("#productGrid") || $("#detail");
      if (box) {
        box.removeAttribute("aria-busy");
        box.innerHTML =
          '<p class="text-center text-danger">Could not load data/products.json. Open the site through a local server (for example VS Code Live Server) instead of double-clicking the file.</p>';
      }
      throw new Error("products.json not loaded");
    });
}

/* ---------- products section: search, sort, filter, price slider, 6 per page ---------- */
function initListing() {
  const q = new URLSearchParams(location.search);
  let cat = ["wall", "luxury", "vintage"].includes(q.get("cat"))
    ? q.get("cat")
    : "all";
  let pg = +q.get("page") || 1,
    term = "",
    sort = "default";
  const PER = 6;

  // price slider: from the cheapest to the dearest clock, in steps of Rs. 500
  const prices = products.map((p) => p.price);
  const lo = Math.floor(Math.min(...prices) / 500) * 500,
    hi = Math.ceil(Math.max(...prices) / 500) * 500;
  let maxPrice = hi;
  const slider = $("#priceMax"),
    out = $("#priceOut");
  slider.min = lo;
  slider.max = hi;
  slider.step = 500;
  slider.value = hi;
  out.textContent = "Up to " + money(hi);

  function draw(scroll) {
    let list = products.filter(
      (p) =>
        (cat === "all" || p.cat === cat) &&
        p.name.toLowerCase().includes(term) &&
        p.price <= maxPrice,
    );
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    const pages = Math.max(1, Math.ceil(list.length / PER));
    pg = Math.min(Math.max(pg, 1), pages);
    $$(".pill").forEach((b) =>
      b.classList.toggle("active", b.dataset.filter === cat),
    );
    const grid = $("#productGrid");
    grid.removeAttribute("aria-busy");
    grid.innerHTML = list.length
      ? list
          .slice((pg - 1) * PER, pg * PER)
          .map(card)
          .join("")
      : '<p class="text-center text-secondary">No clocks match your search. Try another word, filter or a higher price.</p>';
    $("#resultCount").textContent = list.length + " clocks found";
    let h = `<li class="page-item ${pg === 1 ? "disabled" : ""}"><button class="page-link" data-page="${pg - 1}">Prev</button></li>`;
    for (let i = 1; i <= pages; i++)
      h += `<li class="page-item ${i === pg ? "active" : ""}"><button class="page-link" data-page="${i}" ${i === pg ? 'aria-current="page"' : ""}>${i}</button></li>`;
    h += `<li class="page-item ${pg === pages ? "disabled" : ""}"><button class="page-link" data-page="${pg + 1}">Next</button></li>`;
    $("#pager").innerHTML = list.length ? h : "";
    if (scroll) $("#products").scrollIntoView({ behavior: "smooth" });
  }
  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest(".pill");
    if (b) {
      cat = b.dataset.filter;
      pg = 1;
      draw();
    }
  });
  $("#pager").addEventListener("click", (e) => {
    const b = e.target.closest("[data-page]");
    if (b && !b.closest(".disabled")) {
      pg = +b.dataset.page;
      draw(true);
    }
  });
  $("#search").addEventListener("input", (e) => {
    term = e.target.value.trim().toLowerCase();
    pg = 1;
    draw();
  });
  $("#sort").addEventListener("change", (e) => {
    sort = e.target.value;
    pg = 1;
    draw();
  });
  slider.addEventListener("input", () => {
    maxPrice = +slider.value;
    out.textContent = "Up to " + money(maxPrice);
    pg = 1;
    draw();
  });
  // redraw the cards when stock, hearts or reviews change somewhere else
  window.redrawListing = () => draw();
  draw();
}

/* ---------- product details page (product.html?id=N) ---------- */
function setMeta(name, value, attr = "name") {
  const m = document.querySelector(`meta[${attr}="${name}"]`);
  if (m) m.setAttribute("content", value);
}

function initDetail() {
  const p = byId(+new URLSearchParams(location.search).get("id")),
    box = $("#detail");
  box.removeAttribute("aria-busy");
  if (!p) {
    box.innerHTML =
      '<div class="text-center py-5"><h1 class="fs-2">Clock not found</h1><a class="btn btn-grad mt-3" href="' +
      ROOT +
      'index.html#products">Browse all clocks</a></div>';
    return;
  }
  // page title and search-engine / share text follow the clock
  document.title = p.name + " - Alberto Clocks";
  setMeta("description", p.desc);
  setMeta("og:title", p.name + " - Alberto Clocks", "property");
  setMeta("og:description", p.desc, "property");
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.desc,
    image: /^https?:/.test(p.img) ? p.img : ROOT + p.img,
    brand: { "@type": "Brand", name: "Alberto Clocks" },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: p.price,
      availability:
        stockLeft(p) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  });
  document.head.appendChild(ld);

  $("#crumbName").textContent = p.name;
  const [move, size, feat] = p.spec.split(" · ");
  const left = stockLeft(p);
  let n = 1;
  box.innerHTML = `<div class="row g-5 align-items-center">
    <div class="col-md-5 text-center detail-clock">${clockImg(p)}</div>
    <div class="col-md-7">
      <p class="cat">${catName(p.cat)} clock</p>
      <h1 class="detail-title">${esc(p.name)}</h1>
      <p id="ratingTop" class="mb-2">${ratingSummaryHTML(p.id)}</p>
      <p class="price fs-4">${money(p.price)}</p>
      <p class="${left === 0 ? "text-danger" : left <= 3 ? "text-warning" : "text-success"} small fw-bold">${left === 0 ? "Out of stock" : left <= 3 ? "Only " + left + " left in stock" : "In stock"}</p>
      <p>${esc(p.desc)}</p>
      <dl class="spec"><dt>Movement</dt><dd>${esc(move)}</dd><dt>Size</dt><dd>${esc(size)}</dd><dt>Feature</dt><dd>${esc(feat)}</dd><dt>Warranty</dt><dd>1 year</dd></dl>
      <div class="d-flex flex-wrap align-items-center gap-3">
        <div class="qty" ${left ? "" : "hidden"}><button id="qMinus" aria-label="Less">-</button><span id="qVal" aria-live="polite">1</span><button id="qPlus" aria-label="More">+</button></div>
        <button id="addBtn" class="btn btn-grad" ${left ? "" : "disabled"}>${left ? "Add to cart" : "Sold out"}</button>
        ${heartBtn(p.id, true)}
        <a href="${ROOT}index.html#products" class="btn btn-outline-secondary">Back to products</a>
      </div>
    </div></div>
    <section id="reviews" class="reviews" aria-label="Reviews"></section>`;
  $("#qMinus").onclick = () => {
    n = Math.max(1, n - 1);
    $("#qVal").textContent = n;
  };
  $("#qPlus").onclick = () => {
    n = Math.min(Math.min(10, left), n + 1);
    $("#qVal").textContent = n;
  };
  $("#addBtn").onclick = () => addToCart(p.id, n);
  renderReviews(p);
  const rel = products
    .filter((x) => x.cat === p.cat && x.id !== p.id)
    .slice(0, 3);
  if (rel.length) {
    $("#related").innerHTML = rel.map(card).join("");
    $("#relatedSec").hidden = false;
  }
}
