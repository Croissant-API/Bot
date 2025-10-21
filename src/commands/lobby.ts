/* eslint-disable @typescript-eslint/no-explicit-any */
import { SlashCommandBuilder } from "discord.js";
import CroissantAPI from "../libs/croissant-api";
import { DiscordInteraction, InteractionResponse } from "../types";

const command = {
    data: new SlashCommandBuilder()
        .setName("lobby")
        .setDescription("Manage Croissant lobbies")
        .addSubcommand(sub =>
            sub.setName("info")
                .setDescription("Show info about your current lobby")
        )
        .addSubcommand(sub =>
            sub.setName("join")
                .setDescription("Join a lobby")
                .addStringOption(option =>
                    option.setName("lobby_id")
                        .setDescription("Lobby ID to join")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("leave")
                .setDescription("Leave your current lobby")
        ),

    async execute(interaction: DiscordInteraction, croissantAPI?: CroissantAPI): Promise<InteractionResponse> {
        try {
            if (!croissantAPI) {
                return {
                    type: 4,
                    data: {
                        content: "❌ API not available.",
                        flags: 64
                    }
                };
            }
             
            const subcommand = (interaction.data.options as any)?.[0]?.name;

            if (subcommand === "info") {
                const lobby = await croissantAPI.lobbies.getMyLobby();
                const members = lobby.users.length > 0
                    ? lobby.users.map((u: any) => `• **${u.username}** (ID: ${u.user_id})`).join("\n")
                    : "• No members";

                const content = `🏠 **Lobby Information**\n\n` +
                    `🏷️ **Lobby ID:** \`${lobby.lobbyId}\`\n\n` +
                    `👥 **Members:**\n${members}\n\n` +
                    `🔗 [View lobby details](https://croissant-api.fr/lobby?id=${lobby.lobbyId})`;

                return {
                    type: 4, // InteractionResponseType.ChannelMessageWithSource
                    data: {
                        content: content
                    }
                };
            } 
            else if (subcommand === "join") {
                 
                const lobbyId = (interaction.data.options as any)?.[0]?.options?.[0]?.value;
                if (!lobbyId) {
                    return {
                        type: 4, // InteractionResponseType.ChannelMessageWithSource
                        data: {
                            content: "❌ Please provide a lobby ID to join.",
                            flags: 64 // MessageFlags.Ephemeral
                        }
                    };
                }

                await croissantAPI.lobbies.join(lobbyId);
                return {
                    type: 4, // InteractionResponseType.ChannelMessageWithSource
                    data: {
                        content: `✅ Successfully joined lobby \`${lobbyId}\`!`
                    }
                };
            } 
            else if (subcommand === "leave") {
                const lobby = await croissantAPI.lobbies.getMyLobby();
                await croissantAPI.lobbies.leave(lobby.lobbyId);
                return {
                    type: 4, // InteractionResponseType.ChannelMessageWithSource
                    data: {
                        content: `✅ Successfully left lobby \`${lobby.lobbyId}\`.`
                    }
                };
            }
            else {
                return {
                    type: 4, // InteractionResponseType.ChannelMessageWithSource
                    data: {
                        content: "❓ **Lobby Commands:**\n\n• `/lobby info` - Show your current lobby info\n• `/lobby join <lobby_id>` - Join a lobby\n• `/lobby leave` - Leave your current lobby",
                        flags: 64 // MessageFlags.Ephemeral
                    }
                };
            }
        } catch (error: any) {
            console.error("Lobby command error:", error);
            if (error?.message?.indexOf("User not in any lobby") !== -1) {
                return {
                    type: 4, // InteractionResponseType.ChannelMessageWithSource
                    data: {
                        content: "❌ You are not currently in any lobby.",
                        flags: 64 // MessageFlags.Ephemeral
                    }
                };
            } else {
                return {
                    type: 4, // InteractionResponseType.ChannelMessageWithSource
                    data: {
                        content: "❌ Unable to process your lobby request.",
                        flags: 64 // MessageFlags.Ephemeral
                    }
                };
            }
        }
    },
};

export default command;