import { ChatInputCommandInteraction, SlashCommandBuilder, User } from 'discord.js';
import { genKey, emojis } from '../utils';
import { config } from 'dotenv';
import path from 'path';
import CroissantAPI from '../libs/croissant-api';
config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    name: 'give-credits',
    data: new SlashCommandBuilder()
        .setName('give-credits')
        .setDescription('Transfer credits to another user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to give credits to')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of credits to transfer')
                .setRequired(true)
        ),
    async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
        const targetUser = interaction.options.getUser('user') as User;
        const amount = interaction.options.getInteger('amount');

        if (!targetUser || !amount || amount <= 0) {
            await interaction.reply({
                content: "The amount must be greater than 0 and the user must be valid.",
                ephemeral: true
            });
            return;
        }
        if (targetUser.id === interaction.user.id) {
            await interaction.reply({
                content: "You cannot transfer credits to yourself.",
                ephemeral: true
            });
            return;
        }

        const token = await genKey(interaction.user.id);
        if (!token) {
            await interaction.reply({
                content: "You are not authenticated. Please link your account.",
                ephemeral: true
            });
            return;
        }

        try {
            // Use CroissantAPI instead of fetch
            const res = await croissantAPI.users.transferCredits(targetUser.id, amount);

            if (!res || res.message?.toLowerCase().includes("error")) {
                await interaction.reply({
                    content: res?.message || "Error while transferring credits.",
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                content: `✅ You have transferred ${amount} ${emojis.credits} to <@${targetUser.id}>!`,
                ephemeral: true
            });
            if (interaction.channel && interaction.channel.type === 0) { // 0 = GuildText
                await (interaction.channel as import('discord.js').TextChannel).send({
                    content: `**<@${interaction.user.id}>** gave ${amount} ${emojis.credits} to **<@${targetUser.id}>**!`
                });
            }
        } catch (err) {
            console.error("Error while transferring credits:", err);
            await interaction.reply({
                content: "Error while transferring credits. Please try again later.",
                ephemeral: true
            });
        }
    }
};