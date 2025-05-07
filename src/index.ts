import { Client, Collection, Interaction } from "discord.js";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";
import { Command, Config } from "./types";

declare module "discord.js" {
  export interface Client {
    commands: Collection<unknown, unknown>;
  }
}

dotenv.config();

const config: Config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
};

// Initialize Discord Client
const client = new Client({ intents: [] });

// Store commands in a collection
client.commands = new Collection<string, Command>();

// Load commands from files
async function loadCommands(client: Client): Promise<void> {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath);

  // Delete all existing commands before loading new ones
  // Delete all existing commands at once before loading new ones
  // if (client.application?.commands) {
  //   const existingCommands = await client.application.commands.fetch();
  //   if (existingCommands.size > 0) {
  //     await client.application.commands.set([]);
  //     console.log("Deleted all existing commands at once.");
  //   }
  // }

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath).then((m) => m.default || m);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Register commands to Discord API
async function registerCommands(client: Client): Promise<void> {
  try {
    const commands = client.application?.commands;
    if (!commands) return;

    for (const command of client.commands.values() as IterableIterator<Command>) {
      await commands.create({
        ...command.data.toJSON(),
        integration_types: [0, 1],
        contexts: [0, 1, 2],
      });
    }
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error("Failed to register application commands:", error);
  }
}

// Event: Client is ready
client.on("ready", async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  await loadCommands(client);
  await registerCommands(client);
});

// Event: Interaction Create (Slash Commands)
client.on("interactionCreate", async (interaction: Interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName) as Command;

    if (interaction.isUserContextMenuCommand()) {
      const command = client.commands.get(interaction.commandName) as Command;
      if (!command) {
        console.error(
          `No command matching ${interaction.commandName} was found.`,
        );
        await interaction.reply({
          content: "Command not found!",
          ephemeral: true,
        });
        return;
      }
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
      return;
    }

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      await interaction.reply({
        content: "Command not found!",
        ephemeral: true,
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  } else if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName) as Command;

    if (!command || !command.autocomplete) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(
        `Error executing autocomplete for ${interaction.commandName}:`,
        error,
      );
    }
  }
});

// Log in to Discord with your client's token
client.login(config.DISCORD_TOKEN);

// Error handling
process.on("uncaughtException", (error: Error) => {
  console.error("🚨 Uncaught Exception: An error occurred!", error);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.warn("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
  },
);
