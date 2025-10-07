/* eslint-disable @typescript-eslint/no-explicit-any */
import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { CroissantAPI } from "../libs/croissant-api";
import { EmbedBuilder } from "discord.js";

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

    async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === "info") {
                // Get user's lobby
                const lobby = await croissantAPI.lobbies.getMyLobby();
                const embed = new EmbedBuilder()
                    .setTitle("Lobby Info")
                    .addFields(
                        {
                            name: "Members",
                            value: lobby.users.length > 0
                                ? lobby.users.map(u => `[${u.username}](https://croissant-api.fr/profile?user=${u.user_id})`).join("\n")
                                : "None",
                            inline: false
                        }
                    )
                    .setFooter({ text: `Lobby ID: ${lobby.lobbyId}` });
                await interaction.reply({ embeds: [embed], ephemeral: false });
            } else if (subcommand === "join") {
                const lobbyId = interaction.options.getString("lobby_id", true);
                await croissantAPI.lobbies.join(lobbyId);
                await interaction.reply({ content: `Joined lobby \`${lobbyId}\`!`, ephemeral: false });
            } else if (subcommand === "leave") {
                // You need to know the lobby ID to leave; get user's lobby first
                const lobby = await croissantAPI.lobbies.getMyLobby();
                await croissantAPI.lobbies.leave(lobby.lobbyId);
                await interaction.reply({ content: `Left lobby \`${lobby.lobbyId}\`.`, ephemeral: false });
            }
        } catch (error: any) {
            console.error("Lobby command error:", error);
            if (error?.message.indexOf("User not in any lobby") != -1) {
                await interaction.reply({
                    content: "You are not in a lobby.",
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: "Unable to process your lobby request.",
                    ephemeral: true,
                });
            }
        }
    },
};

export default command;