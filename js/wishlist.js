/* Wishlist: the heart buttons. Saved in this browser (localStorage). */
let wish = store.get("ac_wishlist", []);
const isWished = (id) => wish.includes(id);

const HEART_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 4.5 6.4 4.5c2 0 3.5 1.1 4.3 2.4h.6c.8-1.3 2.3-2.4 4.3-2.4 3.7 0 5.5 3.9 4 7.3C19.5 16.4 12 21 12 21z"/></svg>';

function heartBtn(id, inline = false) {
  const on = isWished(id);
  return `<button type="button" class="heart-btn ${inline ? "inline" : ""} ${on ? "on" : ""}" data-wish="${id}" aria-pressed="${on}" aria-label="${on ? "Remove from" : "Add to"} wishlist">${HEART_SVG}</button>`;
}

function toggleWish(id) {
  const p = byId(id);
  if (!p) return;
  if (isWished(id)) {
    wish = wish.filter((x) => x !== id);
    toast(p.name + " removed from wishlist");
  } else {
    wish.push(id);
    toast(p.name + " saved to wishlist");
  }
  store.set("ac_wishlist", wish);
  renderWish();
}

function renderWish() {
  // every heart on the page follows the saved list
  $$("[data-wish]").forEach((b) => {
    const on = isWished(+b.dataset.wish);
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
    b.setAttribute("aria-label", (on ? "Remove from" : "Add to") + " wishlist");
  });
  const list = wish.map(byId).filter(Boolean);
  $$('[data-count="wish"]').forEach((el) => {
    el.textContent = list.length;
    el.dataset.n = list.length;
  });
  const box = $("#wishItems");
  if (!box || !products.length) return;
  box.innerHTML = list.length
    ? list
        .map(
          (p) => `<div class="wish-item">${clockImg(p)}
        <div class="flex-grow-1"><a class="cart-name" href="${PRODUCT_PAGE}?id=${p.id}">${esc(p.name)}</a><br><small class="price">${money(p.price)}</small></div>
        <button class="btn btn-grad btn-sm" data-add="${p.id}" ${stockLeft(p) ? "" : "disabled"}>Add</button>
        <button class="btn-close" aria-label="Remove ${esc(p.name)} from wishlist" data-wish="${p.id}"></button></div>`,
        )
        .join("")
    : '<p class="text-center text-secondary mt-4">No saved clocks yet. Tap the heart on any clock to save it here.</p>';
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-wish]");
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  toggleWish(+b.dataset.wish);
});
