import { ChatInputCommandInteraction, SlashCommandBuilder, User, AutocompleteInteraction } from 'discord.js';
import fetch from 'node-fetch';
import { genKey } from '../utils';
import { config } from 'dotenv';
import path from 'path';
import CroissantAPI, { IItem } from '../libs/croissant-api';
config({ path: path.join(__dirname, '../../.env') });

module.exports = {
    name: 'transfer',
    data: new SlashCommandBuilder()
        .setName('transfer')
        .setDescription('Transfer an item to another user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to transfer the item to')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The ID or name of the item to transfer')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The quantity to transfer')
                .setRequired(true)
        ),
    async autocomplete(interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused();
        const token = await genKey(interaction.user.id);
        if (!token) return interaction.respond([]);
        try {
            // Use /inventory/@me to list the user's items
            const res = await fetch(`${process.env.API_URL || "http://localhost:3000"}/api/inventory/@me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const inventory = await res.json();
            // Filter according to user search
            const filtered = inventory.filter((item: IItem) =>
                item.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
                item.itemId.toLowerCase().includes(focusedValue.toLowerCase())
            );
            return interaction.respond(
                filtered.slice(0, 25).map((item: IItem) => ({
                    name: item.name,
                    value: item.itemId
                }))
            );
        } catch {
            return interaction.respond([]);
        }
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const me = interaction.user;
        const user = interaction.options.getUser('user') as User;
        const itemField = interaction.options.getString('item');
        const items = await CroissantAPI.items.get() as IItem[];
        const item: IItem | undefined = items.find((item: IItem) => item.itemId === itemField || item.name === itemField);
        const amount = interaction.options.getInteger('amount');

        if (!user || !item || !amount) {
            await interaction.reply({ content: "Invalid parameters.", ephemeral: true });
            return;
        }
        if (me.id === user.id) {
            await interaction.reply({ content: 'You cannot transfer an item to yourself!', ephemeral: true });
            return;
        }
        if (amount <= 0) {
            await interaction.reply({ content: 'The quantity must be greater than 0!', ephemeral: true });
            return;
        }

        const itemId: string = item?.itemId;
        const token = await genKey(me.id);
        if (!token) {
            await interaction.reply({ content: "You are not authenticated. Please link your account.", ephemeral: true });
            return;
        }

        // Check the user's inventory
        try {
            const invRes = await fetch(`${process.env.API_URL || "http://localhost:3000"}/api/inventory/@me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const inventory = await invRes.json();
            const item = inventory.find((i: IItem) => i.itemId === itemId);
            if (!item || item.amount < amount) {
                await interaction.reply({
                    content: "You do not have enough of this item in your inventory.",
                    ephemeral: true
                });
                return;
            }

            // Get item info for display
            const itemDisplayName = item.name;

            // Perform the transfer
            const res = await fetch(`${process.env.API_URL || "http://localhost:3000"}/api/items/transfer/${encodeURIComponent(itemId)}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    amount,
                    targetUserId: user.id
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                await interaction.reply({
                    content: data.message || "Error during item transfer.",
                    ephemeral: true
                });
                return;
            }

            await interaction.reply({
                content: `You have transferred ${amount} **${itemDisplayName}** to <@${user.id}>!`,
                ephemeral: true
            });

            if (interaction.channel && interaction.channel.type === 0) { // 0 = GuildText
                await (interaction.channel as import('discord.js').TextChannel).send({
                    content: `**<@${me.id}>** has transferred ${amount} **${itemDisplayName}** to **<@${user.id}>**!`
                });
            }
        } catch (err) {
            console.error("Error during item transfer:", err);
            await interaction.reply({
                content: "Error during item transfer. Please try again later.",
                ephemeral: true
            });
        }
    },
};