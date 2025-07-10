require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const { TOKEN, CLIENT_ID, COMMANDS } = require("./utils/constants");
const { handleButton } = require("./utils/quizFunctions");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Map();
const commandFiles = fs
  .readdirSync(path.join(__dirname, "commands"))
  .filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const mod = require(`./commands/${file}`);
  client.commands.set(mod.data.name, mod);
}

client.once("ready", async () => {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  const response = await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: COMMANDS,
  });
  console.log("Registered global commands:", response);

  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const cmd = client.commands.get(interaction.commandName);
    if (cmd) await cmd.execute(interaction);
  } else if (interaction.isButton()) {
    await handleButton(interaction);
  }
});

client.login(TOKEN);
