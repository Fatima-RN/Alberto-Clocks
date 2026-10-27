/* Orders: totals, status steps and the order list shown in "My profile" */

/* In a real shop the server changes the order status. Here there is no server, so the
   status is worked out from the time passed since the order. The minutes are short so it
   can be shown in a demo. Change the numbers to make it slower. */
const DELIVERY_STEPS = [
  ["Placed", 0],
  ["Packed", 2],
  ["Shipped", 5],
  ["Delivered", 10],
]; // [name, minutes after the order]
const PICKUP_STEPS = [
  ["Placed", 0],
  ["Packed", 2],
  ["Ready for pickup", 5],
];

const ordersOf = (email) =>
  store.get("ac_orders", []).filter((o) => o.email === email);

function orderTotal(o) {
  if (typeof o.total === "number") return o.total;
  // older orders saved before checkout was added only have id + qty
  return o.items.reduce(
    (sum, c) => sum + (c.price ?? byId(c.id)?.price ?? 0) * c.qty,
    0,
  );
}

function orderStatus(o) {
  const steps = o.payment === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const mins = (Date.now() - new Date(o.date).getTime()) / 60000;
  let index = 0;
  steps.forEach(([, at], i) => {
    if (mins >= at) index = i;
  });
  return { steps, index, label: steps[index][0], done: index === steps.length - 1 };
}

const PAY_LABEL = {
  cod: "Cash on delivery",
  pickup: "Pay at the showroom (pickup)",
};

function orderHTML(o) {
  const st = orderStatus(o);
  const lines = o.items
    .map((c) => {
      const name = c.name || byId(c.id)?.name || "Clock #" + c.id;
      return `<li>${esc(name)} × ${c.qty}</li>`;
    })
    .join("");
  return `<details class="order-card">
    <summary><span><strong>${esc(o.no)}</strong> · ${new Date(o.date).toLocaleDateString()}</span>
      <span><span class="status-pill ${st.done ? "done" : ""}">${esc(st.label)}</span> <strong>${money(orderTotal(o))}</strong></span></summary>
    <div class="order-body">
      <ol class="timeline" aria-label="Order progress">${st.steps.map(([n], i) => `<li class="${i <= st.index ? "on" : ""}">${n}</li>`).join("")}</ol>
      <ul>${lines}</ul>
      ${o.discount ? `<p class="mb-1">Coupon ${esc(o.coupon)}: −${money(o.discount)}</p>` : ""}
      <p class="mb-1"><strong>Payment:</strong> ${PAY_LABEL[o.payment] || "Not recorded"}</p>
      ${o.address ? `<p class="mb-0"><strong>${o.payment === "pickup" ? "Contact" : "Deliver to"}:</strong> ${esc(o.name || "")}, ${esc(o.phone || "")}${o.payment === "pickup" ? "" : ", " + esc(o.address) + ", " + esc(o.city || "")}</p>` : ""}
    </div></details>`;
}
