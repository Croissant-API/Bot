import { InteractionResponseType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { DiscordInteraction, InteractionResponse } from "../types";
import { genKey } from "../utils";

const command = {
    data: new SlashCommandBuilder()
        .setName("get-token")
        .setDescription("Get a secret token to use the API"),

    async execute(interaction: DiscordInteraction): Promise<InteractionResponse> {
        try {
            const userId = interaction.member?.user?.id || interaction.user?.id;
            
            if (!userId) {
                return {
                    type: InteractionResponseType.ChannelMessageWithSource,
                    data: {
                        content: "❌ Unable to identify user.",
                        flags: MessageFlags.Ephemeral
                    }
                };
            }

            const token = genKey(userId);
            
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: `🔑 **Your API Token**\n\n\`${token}\`\n\n⚠️ **Do not share this token with anyone!**\n\nUse this token to authenticate with the Croissant API.`,
                    flags: MessageFlags.Ephemeral
                }
            };
        } catch (error) {
            console.error("Error generating token:", error);
            return {
                type: InteractionResponseType.ChannelMessageWithSource,
                data: {
                    content: "❌ An error occurred while generating your token.",
                    flags: MessageFlags.Ephemeral
                }
            };
        }
    },
};

export default command;