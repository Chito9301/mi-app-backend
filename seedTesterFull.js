// seedTesterFull.js
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User"); // Ajusta la ruta a tu modelo

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error conectando a MongoDB:", err));

async function seedTester() {
  try {
    // Revisar si ya existe
    let user = await User.findOne({ email: "tester01@example.com" });
    if (user) {
      console.log("Usuario tester ya existe, actualizando contraseña...");
      user.password = await bcrypt.hash("Secret123!", 10);
      await user.save();
    } else {
      // Crear nuevo usuario tester
      const hashedPassword = await bcrypt.hash("Secret123!", 10);
      user = new User({
        username: "tester01",
        email: "tester01@example.com",
        password: hashedPassword,
      });
      await user.save();
      console.log("Usuario tester creado con éxito!");
    }

    // Generar JWT de prueba
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("\n==== Usuario Tester ====");
    console.log("Email: tester01@example.com");
    console.log("Contraseña: Secret123!");
    console.log("JWT de prueba:", token);
    console.log("======================\n");

    mongoose.disconnect();
  } catch (err) {
    console.error("Error creando usuario tester:", err);
    mongoose.disconnect();
  }
}

seedTester();
