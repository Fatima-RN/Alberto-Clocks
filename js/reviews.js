/* Ratings and reviews on the product page. Saved in this browser (localStorage). */
const reviewsOf = (id) => store.get("ac_reviews", {})[id] || [];

function ratingOf(id) {
  const r = reviewsOf(id);
  if (!r.length) return null;
  return { avg: r.reduce((s, x) => s + x.rating, 0) / r.length, n: r.length };
}

function ratingSummaryHTML(id) {
  const r = ratingOf(id);
  return r
    ? `${starsHTML(r.avg)} <strong>${r.avg.toFixed(1)}</strong> <span class="text-secondary">(${r.n} ${r.n === 1 ? "review" : "reviews"})</span>`
    : '<span class="text-secondary">No reviews yet</span>';
}

function renderReviews(p) {
  const box = $("#reviews");
  if (!box) return;
  const list = reviewsOf(p.id)
    .slice()
    .reverse();
  const mine = user && list.find((x) => x.email === user.email);
  box.innerHTML = `
    <h2 class="section-title">Reviews</h2>
    <p id="ratingSummary">${ratingSummaryHTML(p.id)}</p>
    <div>${
      list.length
        ? list
            .map(
              (x) => `<div class="review">${starsHTML(x.rating)} <strong>${esc(x.name)}</strong>
              <small>· ${new Date(x.date).toLocaleDateString()}</small><p>${esc(x.text)}</p></div>`,
            )
            .join("")
        : '<p class="text-secondary">Be the first to review this clock.</p>'
    }</div>
    <h3 class="mt-4 fs-4">${mine ? "Update your review" : "Write a review"}</h3>
    ${
      user
        ? `<form id="reviewForm" class="panel mt-2" novalidate>
        <fieldset class="mb-3"><legend class="form-label">Your rating</legend>
          <div class="star-input">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="rate${n}" value="${n}" ${mine && mine.rating === n ? "checked" : ""}><label for="rate${n}" title="${n} star${n > 1 ? "s" : ""}">★<span class="visually-hidden">${n} star${n > 1 ? "s" : ""}</span></label>`).join("")}</div></fieldset>
        <label class="form-label" for="reviewText">Your review</label>
        <textarea id="reviewText" name="text" class="form-control mb-2" rows="3" maxlength="400" required>${mine ? esc(mine.text) : ""}</textarea>
        <p id="reviewError" class="text-danger small" hidden></p>
        <button class="btn btn-grad">${mine ? "Update review" : "Post review"}</button></form>`
        : `<p>Please <a href="#" data-bs-toggle="modal" data-bs-target="#loginModal">log in</a> to write a review.</p>`
    }`;
  const f = $("#reviewForm");
  if (!f) return;
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const rating = +(f.rating.value || 0),
      text = f.text.value.trim(),
      er = $("#reviewError");
    if (!rating || !text) {
      er.hidden = false;
      er.textContent = "Please choose a star rating and write a few words.";
      return;
    }
    const all = store.get("ac_reviews", {});
    const arr = (all[p.id] || []).filter((x) => x.email !== user.email);
    arr.push({
      email: user.email,
      name: user.name,
      rating,
      text,
      date: new Date().toISOString(),
    });
    all[p.id] = arr;
    store.set("ac_reviews", all);
    toast("Thanks for your review");
    renderReviews(p);
    const top = $("#ratingTop");
    if (top) top.innerHTML = ratingSummaryHTML(p.id);
  });
}
