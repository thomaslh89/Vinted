require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Offer = require("./models/Offer");

const app = express();
app.use(cors());
app.use(express.json());
mongoose.connect(process.env.MONGODB_URI);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_PUBLIC_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

app.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur l'API Vinted !");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const userRoutes = require("./routes/user");
app.use(userRoutes);
const offerRoutes = require("./routes/offer");
app.use(offerRoutes);

app.get("/offers", async (req, res) => {
  try {
    // const { title, price, description, brand, size, color, city } = req.query;
    // const filters = { title: title, price: price };

    const offersFound = await Offer.find(req.query).select("title");
    return res.json(offersFound);
    // filtrer par product_name :
    // const offers = await Offer.find({
    //   // product_name: new RegExp("robe", "i"),
    //   product_name: /robe/i,
    // }).select("product_name product_price -_id");

    // filtrer avec plusieurs champs :
    // const offers = await Offer.find({
    //   product_name: /robe/i,
    //   product_price: 50,
    // }).select("product_name product_price -_id");

    // filter par fourchette de prix :
    // const offers = await Offer.find({
    //   product_price: { $lt: 50, $gt: 30 },
    //   product_name: /t-shirt/i,
    // }).select("product_name product_price -_id");

    // trier par ordre de prix croissant ou décroissant :
    // const offers = await Offer.find({ product_name: /pantalon/i })
    //   .select("product_name product_price -_id")
    //   .sort({ product_price: -1 });

    // pagination :
    const limit = 5;
    let page = 1;

    if (req.query.page) {
      page = req.query.page;
    }
    // page 1 : skip 0
    // page 2 : skip 5
    // page 3 : skip 10
    // page 4 : skip 15
    // page 5 : skip 20
    // skip = (page - 1) * limit;

    const offers = await Offer.find()
      .select("product_name product_price -_id")
      .sort({ product_price: "asc" })
      .limit(limit)
      .skip((page - 1) * limit);
    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.all("*", (req, res) => {
  return res.status(404).json("Not found");
});

app.listen(3000, () => {
  console.log("Server started");
});
