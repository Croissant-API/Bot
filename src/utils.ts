import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import fs from "node:fs";
import { Command } from "./types";
import { Client } from "discord.js";

// Chargement de la configuration .env
dotenv.config({ path: path.join(__dirname, ".env") });

/**
 * Génère une clé unique basée sur l'userId et un secret.
 */
export function genKey(userId: string): string {
  if (!userId) throw new Error("userId is required for key generation");
  return crypto
    .createHash("md5")
    .update(userId + userId + process.env.HASH_SECRET)
    .digest("hex");
}

/**
 * Pause l'exécution pour un nombre de millisecondes donné.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Emojis utilisés dans le bot.
 */
export const emojis = {
  credits: "<:credit:1369444764906164316>",
  verified: "<:verified:1398991338799890463>",
  brandVerified: "<:brandverified:1398991334701797407>",
  admin: "<:admin:1398991333120675941>",
  earlyUser: "<:early_user:1425082856564199497>",
  moderator: "<:moderator:1425082866936582265>",
  partner: "<:partner:1425082861018677258>",
  staff: "<:staff:1425082850168012871>",
  contributor: "<:contributor:1425082858535653438>",
  communityManager: "<:cm:1425082865443668091>",
  bugHunter: "<:bug_hunter:1425082863480471614>",
};

/**
 * Charge les commandes du dossier 'commands' et les ajoute au client.
 */
export async function loadCommands(client: Client): Promise<void> {
  client.commands.clear();

  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs.readdirSync(commandsPath);

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandModule = await import(filePath);
    const command: Command = commandModule.default || commandModule;
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
    }
  }
}

/**
 * Enregistre les commandes auprès de l'application Discord.
 */
export async function registerCommands(client: Client): Promise<void> {
  const commands = client.application?.commands;
  if (!commands) return;

  try {
    for (const command of client.commands.values()) {
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

/**
 * Supprime toutes les commandes existantes de l'application Discord.
 */
export async function clearExistingCommands(client: Client): Promise<void> {
  const commands = await client.application?.commands.fetch();
  if (!commands) return;

  try {
    for (const command of commands.values()) {
      await client.application?.commands.delete(command.id);
      console.log(`Deleted command: ${command.name}`);
    }
    console.log("Cleared all existing application commands.");
  } catch (error) {
    console.error("Failed to clear existing commands:", error);
  }
}