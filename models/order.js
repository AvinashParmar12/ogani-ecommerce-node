const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    items: [
      {
        productId: String,
        name: String,
        price: Number,
        image: String,
        qty: Number,
      },
    ],

    total: Number,

    // ✅ NEW: Shipping Address
    shippingAddress: {
      firstName: String,
      lastName: String,
      country: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      zip: String,
      phone: String,
      email: String,
    },

    // ✅ NEW: Order notes
    notes: String,

    status: {
      type: String,
      default: "Placed",
    },
  },

  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
