import { ChatInputCommandInteraction, SlashCommandBuilder, User, AutocompleteInteraction } from 'discord.js';
import { genKey } from '../utils';
import { config } from 'dotenv';
import path from 'path';
import CroissantAPI, { InventoryItem, Item } from '../libs/croissant-api';
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
    async autocomplete(interaction: AutocompleteInteraction, croissantAPI: CroissantAPI) {
        const focusedValue = interaction.options.getFocused();
        const token = await genKey(interaction.user.id);
        if (!token) return interaction.respond([]);
        try {
            const inventory = await croissantAPI.inventory.get(interaction.user.id) as InventoryItem[];
            const items = await Promise.all(
                inventory.map((item: InventoryItem) => croissantAPI.items.get(item.itemId))
            );
            // Filter according to user search
            const filtered = items.filter((item: Item) =>
                item.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
                item.itemId.toLowerCase().includes(focusedValue.toLowerCase())
            );
            return interaction.respond(
                filtered.slice(0, 25).map((item: Item) => ({
                    name: item.name,
                    value: item.itemId
                }))
            );
        } catch {
            return interaction.respond([]);
        }
    },
    async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
        const me = interaction.user;
        const user = interaction.options.getUser('user') as User;
        const itemField = interaction.options.getString('item');
        const items = await croissantAPI.items.list() as Item[];
        const item: Item | undefined = items.find((item: Item) => item.itemId === itemField || item.name === itemField);
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

        try {
            const inventory = await croissantAPI.inventory.get(interaction.user.id) as InventoryItem[];
            // Find the inventory entry for the item
            const inventoryEntry = inventory.find((inv) => inv.itemId === itemId);
            if (!inventoryEntry || inventoryEntry.amount < amount) {
                await interaction.reply({
                    content: "You do not have enough of this item in your inventory.",
                    ephemeral: true
                });
                return;
            }

            // Get item info for display
            const itemDisplayName = item.name;

            // Use CroissantAPI to perform the transfer
            const res = await croissantAPI.items.transfer(itemId, amount, user.id);

            if (!res || res.message?.toLowerCase().includes("error")) {
                await interaction.reply({
                    content: res?.message || "Error during item transfer.",
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