const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const adminAuth = require("../middleware/adminAuth");
//models
const Product = require("../models/Product");
const Order = require("../models/order");
const User = require("../models/user");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.use(adminAuth);

//Admin Dashboard
router.get("/", async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();

    res.render("admin/dashboard", {
      productCount,
      orderCount,
      userCount,
    });
  } catch (error) {
    console.log(error);
    res.send("Error loading dashboard");
  }
});

// GET - Show Add Product Page
router.get("/add-product", (req, res) => {
  res.render("admin/add-product", { success: req.query.success });
});

// POST - Add Product
router.post("/add-product", upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;

    await Product.create({
      name,
      price,
      description,
      image: req.file ? req.file.filename : null,
    });

    res.redirect("/admin/add-product?success=1");
  } catch (err) {
    console.log(err);
    res.send("Error adding product");
  }
});

// -------------------------------
// Admin Product List
// -------------------------------
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.render("admin/products", { products });
  } catch (error) {
    console.log(error);
    res.send("Error loading products");
  }
});

// -------------------------------
// Delete Product
// -------------------------------
router.get("/delete-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product.image) {
      const imgPath = path.join("public/uploads", product.image);

      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.send("Error deleting product");
  }
});

// -------------------------------
// Show Edit Product Page
// -------------------------------
router.get("/edit-product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.render("admin/edit-product", { product });
  } catch (error) {
    console.log(error);
    res.send("Error loading product");
  }
});

// -------------------------------
// Update Product
// -------------------------------
router.post("/edit-product/:id", upload.single("image"), async (req, res) => {
  try {
    const { name, price, description } = req.body;

    const product = await Product.findById(req.params.id);

    const updateData = {
      name,
      price,
      description,
    };
    if (req.file && product.image) {
      const oldPath = "public/uploads/" + product.image;
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
      updateData.image = req.file.filename;
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);

    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.send("Error updating product");
  }
});

//orders
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.render("admin/orders", { orders });
  } catch (error) {
    console.log(error);
    res.send("Error loading orders");
  }
});

//users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();

    res.render("admin/users", { users });
  } catch (error) {
    console.log(error);
    res.send("Error loading users");
  }
});

module.exports = router;
