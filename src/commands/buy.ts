/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChatInputCommandInteraction, SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import fetch from 'node-fetch';
import { emojis, genKey } from '../utils';
import { CroissantAPI, Item } from '../libs/croissant-api';
import { config } from 'dotenv';
import path from 'path';
config({ path: path.join(__dirname,'../../.env') }); // Load environment variables from .env file

module.exports = {
    name: 'buy',
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the store!')
        .addStringOption(option =>
            option.setName('itemid')
                .setDescription('The ID of the item to buy')
                .setRequired(true)
                .setAutocomplete(true) // Enable autocomplete
        )
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount to buy')
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

        // Try to buy the item via API
        try {
            // Ask for confirmation before buying the item
            const confirmMessage = await interaction.reply({
                content: `Are you sure you want to buy \`${item.name}\` for ${item.price * amount} ${emojis.credits}?`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: 'Confirm',
                                style: 3,
                                custom_id: 'confirm_buy'
                            },
                            {
                                type: 2,
                                label: 'Cancel',
                                style: 2,
                                custom_id: 'cancel_buy'
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
                (i.customId === 'confirm_buy' || i.customId === 'cancel_buy');

            const collector = confirmMessage.createMessageComponentCollector({ filter, time: 15000, max: 1 });

            collector.on('collect', async (i: any) => {
                if (i.customId === 'confirm_buy') {
                    const buyRes = await fetch(`${process.env.API_URL || 'http://localhost:3000'}/api/items/buy/${item.itemId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ amount })
                    });
                    const buyData = await buyRes.json();

                    if (!buyRes.ok) {
                        await i.update({
                            content: buyData.message || 'Failed to buy item.',
                            components: []
                        });
                        return;
                    }

                    await i.update({
                        content: `Successfully bought \`${item.name}\` for ${item.price * amount} ${emojis.credits}!`,
                        components: []
                    });
                    // Only send message if channel supports send (TextChannel)
                    if (interaction.channel && interaction.channel.type === 0) { // 0 = GuildText
                        await (interaction.channel as import('discord.js').TextChannel).send({
                            content: `**<@${interaction.user.id}>** bought \`${item.name}\` for ${item.price * amount} ${emojis.credits}! Congrats!`
                        });
                    }
                } else {
                    await i.update({
                        content: 'Buy cancelled.',
                        components: []
                    });
                }
            });

            collector.on('end', async (collected: any) => {
                if (collected.size === 0) {
                    await interaction.editReply({
                        content: 'No response. Buy cancelled.',
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