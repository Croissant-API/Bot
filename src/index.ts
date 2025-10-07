import { Client, Collection, Interaction } from "discord.js";
import dotenv from "dotenv";
import { Command, Config } from "./types";
import { genKey, loadCommands, registerCommands, clearExistingCommands } from "./utils";
import CroissantAPI from "./libs/croissant-api";

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

dotenv.config();

const config: Config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
};

const client = new Client({ intents: [] });
client.commands = new Collection<string, Command>();

client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  if (process.env.CLEAR_COMMANDS)
    await clearExistingCommands(client);
  await loadCommands(client);
  await registerCommands(client);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  if (!interaction.isCommand() && !interaction.isAutocomplete()) return;

  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName) as Command;
    if (!command || !command.autocomplete) return;
    try {
      const token = await genKey(interaction.user.id);
      const croissantApi = new CroissantAPI({ token });
      await command.autocomplete(interaction, croissantApi);
    } catch (error) {
      console.error(`Error executing autocomplete for ${interaction.commandName}:`, error);
    }
    return;
  }

  const command = client.commands.get(interaction.commandName) as Command;
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    await interaction.reply({ content: "Command not found!", ephemeral: true });
    return;
  }

  try {
    const token = await genKey(interaction.user.id);
    if (!token) {
      await interaction.reply({ content: "You are not authenticated. Please link your account.", ephemeral: true });
      return;
    }
    const croissantApi = new CroissantAPI({ token });
    await command.execute(interaction, croissantApi);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
  }
});

client.login(config.DISCORD_TOKEN);

process.on("uncaughtException", (error: Error) => {
  console.error("🚨 Uncaught Exception: An error occurred!", error);
});

process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  console.warn("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});
