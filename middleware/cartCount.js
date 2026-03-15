const Cart = require("../models/cart");

async function cartCount(req, res, next) {

  if (!req.session.user) {
    res.locals.cartCount = 0;
    return next();
  }

  const cart = await Cart.findOne({ userId: req.session.user._id });

  if (!cart) {
    res.locals.cartCount = 0;
  } else {
    const count = cart.items.reduce((sum, item) => sum + item.qty, 0);
    res.locals.cartCount = count;
  }

  next();
}

module.exports = cartCount;