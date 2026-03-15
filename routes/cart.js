router.post("/update-qty", (req, res) => {

  const { productId, qty } = req.body;

  const cart = req.session.cart || [];

  const item = cart.find(p => p.productId === productId);

  if (item) {
    item.qty = Number(qty);
  }

  req.session.cart = cart;

  let cartCount = 0;

  cart.forEach(i => {
    cartCount += Number(i.qty);
  });

  res.json({ cartCount });

});