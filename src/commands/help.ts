import {
    InteractionResponseType,
    MessageFlags,
    SlashCommandBuilder,
} from "discord.js";
import { InteractionResponse } from "../types";

const command = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays the bot's help menu"),

    async execute(): Promise<InteractionResponse> {
        return {
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
                content: "🤖 **Croissant Bot Help**\n\n" +
                        "Available commands:\n" +
                        "• `/help` - Show this help menu\n" +
                        "• `/profile` - View your or another user's profile\n" +
                        "• `/inventory` - Check your or another user's inventory\n" +
                        "• `/lobby` - Lobby management (info, join, leave)\n" +
                        "• `/get-token` - Get your API token\n\n" +
                        "🔗 [Croissant API Website](<https://croissant-api.fr>)\n" +
                        "📚 [API Documentation](<https://docs.croissant-api.fr>)\n" +
                        "💬 [Support Server](<https://discord.gg/croissant>)",
                flags: MessageFlags.Ephemeral
            }
        };
    },
};

export default command;