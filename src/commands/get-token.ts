import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { genKey } from "../utils";

const command = {
    data: new SlashCommandBuilder()
        .setName("get-token")
        .setDescription("Get a secret token to use the API"),

    async execute(interaction: ChatInputCommandInteraction) {
        try {
            const token = genKey(interaction.user.id);
            await interaction.reply({
                content: `Your secret token is: \`${token}\`\n\n**Do not share this token with anyone!**`,
                ephemeral: true,
            });
        } catch (error) {
            console.error("Erreur lors de la génération du token:", error);
            await interaction.reply({
                content: "Une erreur est survenue lors de la génération du token.",
                ephemeral: true,
            });
        }
    },
};

export default command;