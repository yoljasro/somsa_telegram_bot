const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const express = require("express");
const app = express();
let port = process.env.PORT || 8000;
// admin-bro
const AdminBro = require("admin-bro");
const AdminBroExpress = require("admin-bro-expressjs");
const AdminBroMongoose = require("admin-bro-mongoose");

// MongoDBga ulanish
mongoose.connect("mongodb+srv://saidaliyevjasur450:DCZuL1NNARNFAGbd@somsabot.j7lu3cp.mongodb.net/",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDBga ulanishda xatolik:"));
db.once("open", function () {
  console.log("MongoDBga ulanildi");
});

app.get("/", (req, res) => {
  res.send("Assalomu alaykum! Somsa buyurtma botiga xush kelibsiz.");
});

app.listen(port, () => {
  console.log(`App localhost:${port} portida eshitishga tayyor.`);
});

// Foydalanuvchi ma'lumotlari uchun User skemasi
const userSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  address: String,
  order: {
    type: String,
    enum: ["go'shtli quti", "tovuqli quti", "sabzavotli quti", "mix quti"],
  },
  quantity: Number,
  price: Number,
});

const User = mongoose.model("User", userSchema);

// Telegram botni yaratish  
const token = "6053180396:AAGZIuR8m80yyY92hp_ThWde-n3PXe8Wb94"; //Telegram bot tokeningizni kiriting
const bot = new TelegramBot(token, { polling: true });

// Ro'yxatdan o'tish tugmasi
const registerKeyboard = {
  keyboard: [[{ text: "Ro'yxatdan o'tish", request_contact: true }]],
  resize_keyboard: true,
  one_time_keyboard: true,
};

// Foydalanuvchiga bot haqida ma'lumot berish
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const message =
    "Assalomu alaykum! Bu somsa buyurtma boti. Siz buyurtma berish uchun qulay interfeys tajribasi yasashingiz mumkin. Buyurtma berish uchun ro'yxatdan o'tishingiz kerak.\n\nRo'yxatdan o'tish tugmasini bosing:";
  bot.sendMessage(chatId, message, { reply_markup: registerKeyboard });

  // Foydalanuvchidan ismini, telefon raqamini va manzilini so'ralish
  bot.on("contact", async (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "Ismingizni kiriting:");
    const name = await new Promise((resolve) => {
      bot.once("message", (msg) => {
        resolve(msg.text);
      });
    });

    bot.sendMessage(
      chatId,
      "Bog'lanishimiz uchun telefon raqamingizni kiriting:"
    );
    const phoneNumber = await new Promise((resolve) => {
      bot.once("message", (msg) => {
        resolve(msg.text);
      });
    });

    bot.sendMessage(chatId, "Manzilingizni kiriting:");
    const address = await new Promise((resolve) => {
      bot.once("message", (msg) => {
        resolve(msg.text);
      });
    });
    // fOOD PRICES
    const prices = {
      "go'shtli quti": 40000,
      "tovuqli quti": 35000,
      "sabzavotli quti": 30000,
      "mix quti": 37000,
    };

    // Qutilarni ko'rsatish uchun buyruq
    bot.sendMessage(chatId, "Qanday turdagi somsa buyurtma qilmoqchisiz?", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Go'shtli quti", callback_data: "go'shtli quti" },
            { text: "Tovuqli quti", callback_data: "tovuqli quti" },
            { text: "Sabzavotli quti", callback_data: "sabzavotli quti" },
            { text: "Mix quti", callback_data: "mix quti" },
          ],
        ],
      },
    });

    // Foydalanuvchining buyurtmasini qabul qilish
    bot.on("callback_query", async (query) => {
      const order = query.data;

      // Qancha somsa kerakligini so'ralish
      bot.sendMessage(
        chatId,
        `Nechta quti somsa buyurtma berasiz? Har bir quti narxi ${prices[order]} so'm: `
      );
      const quantity = await new Promise((resolve) => {
        bot.once("message", (msg) => {
          resolve(parseInt(msg.text));
        });
      });

      // Buyurtmani saqlash
      const price = quantity * prices[order];
      const user = new User({
        name: name,
        phoneNumber: phoneNumber,
        address: address,
        order: order,
        quantity: quantity,
        price: price,
      });

      try {
        const savedUser = await user.save();
        bot.sendMessage(
          chatId,
          `Buyurtmangiz qabul qilindi. Umumiy narx ${price} so'm. Tez orada uni yetkazib  beramiz. Iltimos, boshqa buyurtma bermoqchi bo'lsangiz /start buyrug'ini bosing.`
        );
        console.log(savedUser);
      } catch (err) {
        console.error(err);
        bot.sendMessage(
          chatId,
          `Buyurtmani qabul qilindi. Umumiy Narx ${price}`
        );
      }
    });
  });
});

// Manzil kiritish
bot.onText(/\/manzil/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "Manzilingizni kiritish uchun quyidagi tugmani bosing:",
    {
      reply_markup: {
        keyboard: [[{ text: "Manzilni kiritish", request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );

  bot.once("message", async (msg) => {
    const address = msg.text;

    // Manzil ma'lumotlarini foydalanuvchiga yuborish
    bot.sendMessage(chatId, `Sizning kiritgan manzilingiz: ${address}`);
  });
});

// Locatsiya olish
bot.onText(/\/locatsiya/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "Hozirgi joyingizni aniqlash uchun geolokatsiyangizni yuboring:",
    {
      reply_markup: {
        keyboard: [[{ text: "Locatsiyani yuborish", request_location: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    }
  );

  bot.once("location", async (msg) => {
    const latitude = msg.location.latitude;
    const longitude = msg.location.longitude;
  });
});

// admin-bro options
AdminBro.registerAdapter(AdminBroMongoose);

const adminBro = new AdminBro({
  branding: {
    companyName: "JasurBek",
  },
  databases: [mongoose],
  rootPath: "/admin",
  resources: [
    {
      resource: User,
      options: {
        parent: {
          name: "Somsa bot orders",
          icon: "fas fa-cogs",
        },
        resource: ["pathname"],
      },
    },
  ],
});

const ADMIN = {
  email: process.env.ADMIN_EMAIL || "1",
  password: process.env.ADMIN_PASSWORD || "1",
};

const router = AdminBroExpress.buildAuthenticatedR12qaouter(adminBro, {
  cookieName: process.env.ADMIN_COOKIE_NAME || "1",
  cookiePassword: process.env.ADMIN_COOKIE_PASS || "1",
  authenticate: async (email, password) => {
    if (email === ADMIN.email && password === ADMIN.password) {
      return ADMIN;
    }
    return null;
  },
});

// app uses
app.use("/admin", router);
