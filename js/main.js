/* Start-up: runs last, after every other script has loaded */
renderUser();
if ($("#productGrid")) showSkeleton(6);

loadProducts()
  .then(() => {
    renderCart();
    renderWish();
    if ($("#productGrid")) initListing();
    if ($("#detail")) initDetail();
  })
  .catch(() => {
    /* loadProducts already showed the error message */
  });
