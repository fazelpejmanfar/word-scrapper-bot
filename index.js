const { Telegraf } = require("telegraf");
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = 3000;

require("dotenv").config();

const botToken = process.env.BOT_TOKEN; //TODO Paste your bot in the .env.local and rename it to .env

if (!botToken) {
  console.error("Please set the BOT_TOKEN environment variable.");
  process.exit(1);
}
const WEBHOOK_URL = process.env.WEBHOOK;
const bot = new Telegraf(botToken);

app.use(bodyParser.json());
app.post(`/webhook/${botToken}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

bot.telegram.setWebhook(`${WEBHOOK_URL}/webhook/${botToken}`);
bot.launch().then(console.log("Bot is running..."));

bot.start((ctx) => {
  ctx.reply(
    "Welcome to the Word Scraper Bot! Please send me the Words to Send your words."
  );
});

bot.on("text", async (ctx) => {
  var regex = /^[a-zA-Z]+$/;
  if (!regex.test(ctx.message.text)) {
    await ctx.replyWithMarkdown("only English Letter Supported");
    return;
  }
  const url = `https://unscramblex.com/anagram/${ctx.message.text}/?dictionary=nwl`;
  const wordsByLength = await scrapeWords(url);

  if (Object.keys(wordsByLength).length > 0) {
    const response = formatWordsByLength(wordsByLength);
    await ctx.replyWithMarkdown(response);
  } else {
    await ctx.replyWithMarkdown(
      "*Failed to fetch the Words.*\nPlease try again with new letters."
    );
  }
});

async function scrapeWords(url) {
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const wordsByLength = {};

      $("li.words__item.grid__cell").each((index, element) => {
        const word = $(element).text().trim();
        const wordLength = word.length;
        if (word.startsWith("unscramble")) {
          return;
        }

        if (!wordsByLength[wordLength]) {
          wordsByLength[wordLength] = [];
        }

        wordsByLength[wordLength].push(word);
      });
      return wordsByLength;
    } else {
      return null;
    }
  } catch (error) {
    console.error("An error occurred");
    return null;
  }
}

function formatWordsByLength(wordsByLength) {
  let response = "";
  for (const length in wordsByLength) {
    response += `${length} letter words:\n*${wordsByLength[length].join(
      ", "
    )}*\n\n`;
  }
  return response;
}


