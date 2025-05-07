import {
    CommandInteraction,
    AutocompleteInteraction,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
  } from "discord.js";

  
  export interface Command {
    data: SlashCommandBuilder;
    execute: (
      interaction: unknown
    ) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  }
  
  export interface Config {
    DISCORD_TOKEN: string;
  }
  