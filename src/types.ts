import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import CroissantAPI from "./libs/croissant-api";

export interface Command {
  data: SlashCommandBuilder | { name: string; description: string };
  execute: (interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) => Promise<void | InteractionResponse>;
  autocomplete?: (interaction: AutocompleteInteraction, croissantAPI: CroissantAPI) => Promise<void>;
}

export interface InteractionResponse {
  type: number;
  data?: {
    content?: string;
    embeds?: unknown[];
    components?: unknown[];
    choices?: { name: string; value: string }[];
    flags?: number;
  };
}

export interface DiscordInteraction {
  type: number;
  data: {
    name: string;
    options?: unknown[];
  };
  member: {
    user: {
      id: string;
    };
  };
  user: {
    id: string;
  };
}

export interface Config {
  DISCORD_TOKEN: string;
}


