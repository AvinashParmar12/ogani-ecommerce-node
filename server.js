// ===============================
// 1️⃣ IMPORT PACKAGES
// ===============================
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();
const session = require("express-session");
const connectDB = require("./config/db");

// ===============================
// 2️⃣ IMPORT MODELS
// ===============================
const User = require("./models/user");
const Product = require("./models/product");
const Cart = require("./models/cart");
const Order = require("./models/order");

// ===============================
// 3️⃣ IMPORT ROUTES
// ===============================
const adminRoutes = require("./routes/admin");

// ===============================
// 4️⃣ IMPORT MIDDLEWARE
// ===============================
const isAuth = require("./middleware/auth");
const cartCount = require("./middleware/cartCount");

// ===============================
// 5️⃣ INITIALIZE EXPRESS
// ===============================
const app = express();

// ===============================
// 6️⃣ GLOBAL MIDDLEWARES
// ===============================

// Read form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files (CSS, JS, Images)
app.use(express.static("public"));

// Set EJS
app.set("view engine", "ejs");

// ===============================
// 7️⃣ SESSION MIDDLEWARE
// ===============================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  }),
);

// ===============================
// 8️⃣ CUSTOM MIDDLEWARE
// ===============================
// Make logged-in user available in all EJS files
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});
app.use(cartCount);

// ===============================
// 9️⃣ ROUTES
// ===============================

// Admin Routes
app.use("/admin", adminRoutes);

// -------------------------------
// Register Page
// -------------------------------
app.get("/register", (req, res) => {
  res.render("register");
});

// Register User
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
  });

  await newUser.save();

  res.redirect("/login?registered=1");
});

// -------------------------------
// Login Page
// -------------------------------
app.get("/login", (req, res) => {
  res.render("login");
});

// Login User
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.send(`
        <script>
            alert("User not found");
            window.location.href="/login";
        </script>
    `);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.send(`
        <script>
            alert("Incorrect password");
            window.location.href="/login";
        </script>
    `);
  }

  req.session.user = user;

  res.redirect("/?login=success");
});

// -------------------------------
// Logout
// -------------------------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// -------------------------------
// Home Page
// -------------------------------
app.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("index", { products });
  } catch (error) {
    console.log(error);
    res.send("Error loading products");
  }
});

// -------------------------------
// Single Product Page
// -------------------------------
app.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render("single-product", { product });
  } catch (error) {
    console.log(error);
    res.send("Product Not Found");
  }
});

// -------------------------------
// Product Page with fillters
// -------------------------------
app.get("/products", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 9; // products per page
    const skip = (page - 1) * limit;

    const { minPrice, maxPrice, search } = req.query;

    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    if (minPrice && maxPrice) {
      filter.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice),
      };
    }

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter).skip(skip).limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    res.render("products", {
      products,
      currentPage: page,
      totalPages,
      totalProducts,
    });
  } catch (err) {
    console.log(err);
    res.send("Error loading products");
  }
});
// ===============================
// PROTECTED ROUTES
// ===============================
app.use(isAuth);

// -------------------------------
// Cart Page
// -------------------------------
app.get("/cart", async (req, res) => {
  const userId = req.session.user._id;

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.render("cart", { cart: [], grandTotal: 0 });
  }

  let grandTotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  res.render("cart", {
    cart: cart.items,
    grandTotal,
  });
});

// -------------------------------
// Add To Cart
// -------------------------------
app.post("/add-to-cart/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  const qty = Number(req.body.qty);
  const userId = req.session.user._id;

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({
      userId,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.image,
          qty: qty,
        },
      ],
    });
  } else {
    const item = cart.items.find((p) => p.productId == product._id);

    if (item) {
      item.qty += qty;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        qty: qty,
      });
    }
  }

  await cart.save();

  res.redirect("/cart");
});

// -------------------------------
// Remove From Cart (AJAX)
// -------------------------------
app.post("/remove-from-cart", async (req, res) => {
  const { productId } = req.body;
  const userId = req.session.user._id;

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.json({ success: false });
  }

  cart.items = cart.items.filter((item) => item.productId != productId);

  await cart.save();

  const grandTotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  res.json({
    success: true,
    grandTotal,
    cartCount: cart.items.reduce((sum, i) => sum + i.qty, 0),
  });
});

// -------------------------------
// Update Cart Quantity (AJAX)
// -------------------------------
app.post("/update-cart", async (req, res) => {
  const { productId, change } = req.body;
  const userId = req.session.user._id;

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.json({ success: false });
  }

  const item = cart.items.find((p) => p.productId == productId);

  if (item) {
    item.qty += change;

    if (item.qty < 1) item.qty = 1;
  }

  await cart.save();

  const grandTotal = cart.items.reduce((sum, p) => sum + p.price * p.qty, 0);

  res.json({
    success: true,
    qty: item.qty,
    itemTotal: item.price * item.qty,
    grandTotal,
    cartCount: cart.items.reduce((sum, i) => sum + i.qty, 0),
  });
});

// -------------------------------
// Checkout Page
// -------------------------------
app.get("/checkout", async (req, res) => {
  const userId = req.session.user._id;

  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    return res.redirect("/cart");
  }

  const grandTotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  res.render("checkout", {
    cart: cart.items,
    grandTotal,
  });
});

// -------------------------------
// Place Order
// -------------------------------
app.post("/place-order", async (req, res) => {
  const userId = req.session.user._id;

  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    return res.redirect("/cart");
  }

  const grandTotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  const newOrder = new Order({
    userId,
    items: cart.items,
    total: grandTotal,
    shippingAddress: {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      country: req.body.country,
      address1: req.body.address1,
      address2: req.body.address2,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      phone: req.body.phone,
      email: req.body.email,
    },

    notes: req.body.notes,
  });

  await newOrder.save();

  // clear cart
  cart.items = [];
  await cart.save();

  res.redirect("/order-success");
});

// -------------------------------
// Order Success
// -------------------------------
app.get("/order-success", isAuth, (req, res) => {
  res.render("order-success");
});

// ===============================
// 🔟 CONNECT DATABASE
// ===============================
connectDB();

// ===============================
// 1️⃣1️⃣ START SERVER
// ===============================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
