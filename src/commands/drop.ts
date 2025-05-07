/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { emojis, genKey } from '../utils';
import { CroissantAPI, Item } from '../libs/croissant-api';
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname,'../../.env') }); // Load environment variables from .env file

module.exports = {
    name: 'drop',
    data: new SlashCommandBuilder()
        .setName('drop')
        .setDescription('Drop an item from the store!')
        .addStringOption(option =>
            option.setName('itemid')
                .setDescription('The ID of the item to drop')
                .setRequired(true)
                .setAutocomplete(true) // Enable autocomplete
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount to drop')
                .setRequired(false)
        ),
    async autocomplete(interaction: AutocompleteInteraction, croissantAPI: CroissantAPI) {
        const focusedValue = interaction.options.getFocused();
        let items: Item[];
        try {
            items = await croissantAPI.items.list() as Item[];
        } catch {
            // fallback: no suggestions
            return interaction.respond([]);
        }
        const filtered = items
            .filter((item: Item) =>
                item.name && 
                (item.name.toLowerCase().includes(focusedValue.toLowerCase()) ||
                item.itemId.toLowerCase().includes(focusedValue.toLowerCase()))
            )
            .slice(0, 25)
            .map((item: Item) => ({
                name: item.name,
                value: item.itemId
            }));
        await interaction.respond(filtered);
    },
    async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
        const itemId = interaction.options.getString('itemid');
        const amount = Math.abs(interaction.options.getInteger('amount') || 1);

        if (!itemId || isNaN(amount) || amount <= 0 || amount > 1000) {
            await interaction.reply({
                content: 'Invalid item ID or amount (must be 1-1000).',
                ephemeral: true
            });
            return;
        }

        const items = await croissantAPI.items.list() as Item[];
        const item = items.find((item: Item) => item.itemId === itemId || item.name === itemId);
        // console.log('Item:', item);
        if (!item) {
            await interaction.reply({
                content: 'Item not found.',
                ephemeral: true
            });
            return;
        }

        // Get API token for the user (implement getToken in utils)
        const token = await genKey(interaction.user.id);
        if (!token) {
            await interaction.reply({
                content: 'You are not authenticated. Please link your account.',
                ephemeral: true
            });
            return;
        }

        // Try to drop the item via API
        try {
            // Ask for confirmation before dropping the item
            const confirmMessage = await interaction.reply({
                content: `Are you sure you want to drop \`${item.name}\` for ${item.price * amount} ${emojis.credits}?`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: 'Confirm',
                                style: 3,
                                custom_id: 'confirm_drop'
                            },
                            {
                                type: 2,
                                label: 'Cancel',
                                style: 2,
                                custom_id: 'cancel_drop'
                            }
                        ]
                    }
                ],
                ephemeral: true,
                fetchReply: true
            });

            // Create a collector for the confirmation buttons
            const filter = (i: any) =>
                i.user.id === interaction.user.id &&
                (i.customId === 'confirm_drop' || i.customId === 'cancel_drop');

            const collector = confirmMessage.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on('collect', async (i: any) => {
                if (i.customId === 'confirm_drop') {
                    try {
                        // Use CroissantAPI to drop the item
                        const dropRes = await croissantAPI.items.drop(item.itemId, amount);

                        if (!dropRes || dropRes.message?.toLowerCase().includes("error")) {
                            await i.update({
                                content: dropRes?.message || 'Failed to drop item.',
                                components: []
                            });
                            return;
                        }

                        await i.update({
                            content: `Successfully dropped \`${item.name}\` for ${item.price * amount} ${emojis.credits}!`,
                            components: []
                        });
                    } catch (err: Error | unknown) {
                        console.error('Error while dropping item:', err);
                        await i.update({
                            content: 'Failed to drop item.',
                            components: []
                        });
                    }
                } else {
                    await i.update({
                        content: 'Drop cancelled.',
                        components: []
                    });
                }
            });

            collector.on('end', async (collected: any) => {
                if (collected.size === 0) {
                    await interaction.editReply({
                        content: 'No response. Drop cancelled.',
                        components: []
                    });
                }
            });
        } catch (err: Error | unknown) {
            console.error('Error while buying item:', err);
            await interaction.reply({
                content: 'Error while buying item. Please try again later.',
                ephemeral: true
            });
        }
    }
};