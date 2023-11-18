const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary");
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");
const Offer = require("../models/Offer");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};
router.get("/offers", async (req, res) => {
  try {
    const limit = 5;
    let skip = 0;
    if (req.query.sort) {
      if (req.query.sort !== "price-asc" && req.query.sort !== "price-desc") {
        return res.status(400).json({ message: "Invalid sort query" });
      }
    }

    // console.log(req.query); // { title: 'pantalon', priceMax: '40', priceMin: '20' }
    const filters = {};
    // si j'ai une query title, alors dans mon objet filters je rajoute une clef product_name, et je lui assigne la valeur récupérée en query :
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gt: req.query.priceMin };
    }

    if (req.query.priceMax) {
      // a ce stade , si on a pas de query priceMin, alors l'objet filters.product_price, N'EXISTE PAS
      // par conséquent, impossible de créer une clef dedans !
      if (filters.product_price) {
        filters.product_price.$lt = req.query.priceMax;
      } else {
        filters.product_price = { $lt: req.query.priceMax };
      }
    }
    // on applique le même principe pour le sort :
    const sortedObject = {};
    if (req.query.sort) {
      const purifiedSortQuery = req.query.sort.replace("price-", "");
      sortedObject.product_price = purifiedSortQuery;
    }

    if (req.query.page) {
      skip = (req.query.page - 1) * limit;
    }
    const offers = await Offer.find(filters)
      .select("product_name  product_price -_id")
      .sort(sortedObject)
      .limit(limit)
      .skip(skip);
    return res.status(200).json(offers);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // récupérer les fichiers avec req.files
      // console.log("files =>", req.files.picture);
      // console.log("body =>", req.body);
      // {
      //   title: 'pantalon',
      //   description: 'presque neuf',
      //   price: '5',
      //   condition: 'neuf',
      //   city: 'Paris',
      //   brand: 'H&M',
      //   size: 'L',
      //   color: 'rouge'
      // }

      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      // créer le document correspondant à l'offre
      const newOffer = new Offer({
        title: title,
        description: description,
        price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: req.user,
      });
      console.log("newOffer =>", newOffer);
      // envoyer l'image à cloudinary
      if (req.files) {
        const convertedPicture = convertToBase64(req.files.product_image);
        // console.log(convertedPicture);
        const uploadResult = await cloudinary.uploader.upload(
          convertedPicture,
          {
            folder: `/vinted/offers/${newOffer._id}`,
          }
        );
        // console.log(uploadResult);
        // inclure l'image dans notre nouveau document (donc l'offre)
        newOffer.product_image = uploadResult;
      }

      console.log(newOffer);
      // sauvegardera l'offre
      await newOffer.save();
      return res.status(201).json(newOffer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
