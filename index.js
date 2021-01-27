require("dotenv").config();
const Discord = require("discord.js");
const bot = new Discord.Client();
bot.commands = new Discord.Collection();
const botCommands = require("./commands");
const { fetchKills } = require("./killFeed");

Object.keys(botCommands).map((key) => {
  bot.commands.set(botCommands[key].name, botCommands[key]);
});

const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on("ready", () => {
  console.info(`Logged in as ${bot.user.tag}!`);
  bot.user.setActivity("Albion Online. Praise Be");
  fetchKills(bot);

  // Fetch kills every 30s
  var timer = setInterval(function () {
    fetchKills(bot);
  }, 30000);
});

bot.on("message", (msg) => {
  if(msg.author.bot) return;

  if(!msg.content || msg.content[0] !== "!") return;

  const args = msg.content.split(/ +/);
  const command = args.shift().toLowerCase();
  console.info(`Called command: ${command}`);

  if (!bot.commands.has(command)) return;

  try {
    bot.commands.get(command).execute(msg, args);
  } catch (error) {
    console.error(error);
    msg.reply("there was an error trying to execute that command!");
  }
});
