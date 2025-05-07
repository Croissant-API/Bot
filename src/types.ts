import {
    AutocompleteInteraction,
    SlashCommandBuilder,
  } from "discord.js";
import CroissantAPI from "./libs/croissant-api";

  
  export interface Command {
    data: SlashCommandBuilder;
    execute: (
      interaction: unknown,
      croissantAPI: CroissantAPI,
    ) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction, croissantAPI: CroissantAPI) => Promise<void>;
  }
  
  export interface Config {
    DISCORD_TOKEN: string;
  }
  