const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    // const tab = [1, 2, 4];
    // const [numberOne, numberTwo, numberThree] = tab;

    const { username, email, password, newsletter } = req.body;

    if (!username || !email) {
      return res
        .status(400)
        .json("Vous devez préciser un username et un email");
    }

    // console.log(req.body);
    // {
    //     username: 'JohnDoe',
    //     email: 'johndoe@lereacteur.io',
    //     password: 'azerty',
    //     newsletter: true
    //   }

    // cherchons avant de créer l'utilisateur si nous n'avons pas dans notre BDD DEJA un utilisateur avec ce mail :
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json("Ce mail n'est pas disponible");
    } else {
      const token = uid2(24);
      console.log("token =>", token);

      const salt = uid2(16);

      const hash = encBase64.stringify(SHA256(password + salt));
      console.log("hash =>", hash);

      // const newUser = new User({
      //     email,
      //     account: {
      //       username,
      //     },
      //     newsletter,
      //     token,
      //     hash,
      //     salt,
      //   });

      const newUser = new User({
        email: email,
        account: {
          username: username,
        },
        newsletter: newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });
      console.log(newUser);

      newUser.save();

      return res.status(201).json({
        _id: newUser._id,
        token: newUser.token,
        account: newUser.account,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // console.log(req.body); // { email: 'johndoe@lereacteur.io', password: 'azerty' }
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json("Missing parameters");
    }
    // on recherche notre utilisateur dans la BDD :
    const userFound = await User.findOne({ email: email });
    // console.log(userFound);
    // {
    //     account: { username: 'JohnDoe' },
    //     _id: new ObjectId('654a8beeac1275ebea9bf455'),
    //     email: 'johndoe@lereacteur.io',
    //     newsletter: true,
    //     token: 'XGslDtgLQoZWn1XJDkBmxOXj',
    //     hash: 'aENyXF9MiX38dtXZBJYHn+UGubGr3Zl8NFw6S2doMCw=',
    //     salt: 'RJD9YAx_ozy92A5n',
    //     __v: 0
    //   }

    if (!userFound) {
      return res.status(401).json("email ou password incorrect");
    }
    const saltedPassword = password + userFound.salt;
    const newHash = encBase64.stringify(SHA256(saltedPassword));
    if (newHash === userFound.hash) {
      return res.status(200).json({
        _id: userFound._id,
        token: userFound.token,
        account: {
          username: userFound.account.username,
        },
      });
    } else {
      return res.status(401).json("email ou password incorrect");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
