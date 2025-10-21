import { verifyKey } from "discord-interactions";
import {
  Collection,
  InteractionResponseType,
  InteractionType,
  MessageFlags
} from "discord.js";
import CroissantAPI from "./libs/croissant-api";
import { Command, DiscordInteraction } from "./types";
import { genKey } from "./utils";


// Import commands
import getTokenCommand from "./commands/get-token";
import helpCommand from "./commands/help";
import inventoryCommand from "./commands/inventory";
import lobbyCommand from "./commands/lobby";
import profileCommand from "./commands/profile";

declare global {
  interface Env {
    DISCORD_TOKEN: string;
    DISCORD_PUBLIC_KEY: string;
    HASH_SECRET: string;
  }
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

const commands = new Collection<string, Command>();

// Register all commands
commands.set("get-token", getTokenCommand);
commands.set("help", helpCommand);
commands.set("inventory", inventoryCommand);
commands.set("lobby", lobbyCommand);
commands.set("profile", profileCommand);

async function handleInteraction(interaction: DiscordInteraction) {
  const dryCroissantApi = new CroissantAPI();

  if (interaction.type === InteractionType.ApplicationCommand) {
    const command = commands.get(interaction.data.name) as Command;
    if (!command) {
      console.error(`No command matching ${interaction.data.name} was found.`);
      return new Response(JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Command not found!",
          flags: MessageFlags.Ephemeral
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const userId = interaction.member?.user?.id || interaction.user?.id;
      
      // For get-token command, we don't need to authenticate with API first
      if (interaction.data.name === "get-token") {
        const result = await command.execute(interaction);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // For other commands, authenticate first
      const realUser = await dryCroissantApi.users.getUser(userId);
      const token = genKey(realUser.userId);

      if (!token) {
        return new Response(JSON.stringify({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "You are not authenticated. Please link your account.",
            flags: MessageFlags.Ephemeral
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const croissantApi = new CroissantAPI({ token });
      const result = await command.execute(interaction, croissantApi);


      if (result) {
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: { content: "Command executed successfully!" }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error(`Error executing ${interaction.data.name}:`, error);
      return new Response(JSON.stringify({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }


  return new Response(JSON.stringify({
    type: InteractionResponseType.Pong
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    const signature = request.headers.get('X-Signature-Ed25519');
    const timestamp = request.headers.get('X-Signature-Timestamp');
    const body = await request.text();

    if (!signature || !timestamp) {
      return new Response('Missing signature headers', { status: 401 });
    }


    const isValid = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const interaction = JSON.parse(body);


    if (interaction.type === InteractionType.Ping) {
      return new Response(JSON.stringify({ type: InteractionResponseType.Pong }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handleInteraction(interaction);
  },
};


