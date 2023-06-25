const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// MongoDBga ulanish
mongoose.connect('mongodb://localhost:27017/somsa_bot', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDBga ulanishda xatolik:'));
db.once('open', function() {
  console.log('MongoDBga ulanildi');
});

// Foydalanuvchi ma'lumotlari uchun User skemasi
const userSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,
  address: String,
  order: {
    type: String,
    enum: ['go\'shtli quti', 'tovuqli quti', 'sabzavotli quti', 'mix quti']
  },
  quantity: Number,
  price: Number
});

const User = mongoose.model('User', userSchema);

// Telegram botni yaratish
const token = '6053180396:AAGZIuR8m80yyY92hp_ThWde-n3PXe8Wb94';
const bot = new TelegramBot(token, {polling: true});

// Qutilar va somsalarning narxlari
const prices = {
  'go\'shtli quti': 40000,
  'tovuqli quti ': 35000,
  'sabzavotli quti': 30000,
  'mix quti': 37000
};

// Foydalanuvchi ismini kiritish uchun buyruq
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Assalomu alaykum! Ismingizni kiriting:');
});

// Foydalanuvchi ma'lumotlarini MongoDBga saqlash
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Foydalanuvchi ismini saqlash
  if (!msg.text.startsWith('/')) {
    const name = msg.text;

    // Raqamni kiritish uchun buyruq
    bot.sendMessage(chatId, `Telefon raqamingizni kiriting:`);
    const phoneNumber = await new Promise((resolve) => {
      bot.once('message', (msg) => {
        resolve(msg.text);
      });
    });

    // Manzilni kiritish uchun buyruq
    bot.sendMessage(chatId, 'Manzilingizni kiriting:');
    const address = await new Promise((resolve) => {
      bot.once('message', (msg) => {
        resolve(msg.text);
      });
    });

    // Qutilarni ko'rsatish uchun buyruq
    bot.sendMessage(chatId, 'Qanday turdagi somsa buyurtma qilmoqchisiz?', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Go\'shtli quti',
              callback_data: 'go\'shli'
            },
            {
              text: 'Tovuqli quti',
              callback_data: 'tovuqli'
            },
            {
              text: 'Sabzavotli quti',
              callback_data: 'sabzavotli'
            },
            {
              text: 'Aralash quti',
              callback_data: 'aralash'
            }
          ]
        ]
      }
    });

    // Foydalanuvchining buyurtmasini qabul qilish
    bot.on('callback_query', async (query) => {
      const order = query.data;

      // Qancha somsa kerakligini so'ralish
      bot.sendMessage(chatId, `Nechta quti  somsa buyurtma berasiz? Har bir quti  Narxi ${prices[order]} so'm: `);
      const quantity = await new Promise((resolve) => {
        bot.once('message', (msg) => {
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
        price: price
      });

      try {
        const savedUser = await user.save();
        console.log(savedUser);
        bot.sendMessage(chatId, `Buyurtmangiz qabul qilindi. Umumiy narx  ${prices[order] * quantity} so\'m. Iltimos, boshqa buyurtma bermoqchi bo\'lsangiz /start buyrug\'ini bosing.`);
      } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, 'Buyurtmani qabul qilishda xatolik yuzaga keldi. Iltimos, qayta urinib ko\'ring.');
      }
    });
  }
});