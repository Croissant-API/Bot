import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ButtonStyle,
    ComponentType,
    TextInputStyle
} from "discord.js";
import { CroissantAPI, Item } from "../libs/croissant-api";
import { emojis } from "../utils";

const ITEMS_PER_PAGE = 9;

const command = {
    data: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("Displays the item shop"),

    async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
        await interaction.deferReply({ ephemeral: false });

        // Fetch items from API (only those shown in store)
        let items: Item[] = [];
        try {
            items = await croissantAPI.items.list() as Item[];
        } catch (error: Error | unknown) {
            console.error("Error while fetching shop items:", error);
            await interaction.editReply({
                content: "Error while fetching shop items.",
            });
            return;
        }

        if (!items.length) {
            await interaction.editReply({
                content: ":shopping_cart: The shop is empty.",
            });
            return;
        }

        let page = 1;
        let filter = "all";
        let filteredItems = items;

        const totalPages = () =>
            Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

        function getPageItems(pageNum: number) {
            const start = (pageNum - 1) * ITEMS_PER_PAGE;
            return filteredItems.slice(start, start + ITEMS_PER_PAGE);
        }

        function createEmbed(pageNum: number) {
            const itemsToShow = getPageItems(pageNum);
            const embed = new EmbedBuilder()
                .setTitle("🛒 Shop")
                .setColor(0x43b581);

            if (itemsToShow.length) {
                itemsToShow.forEach((item) => {
                    embed.addFields({
                        name: item.name,
                        value: `**Price:** ${item.price} ${emojis.credits}\n**Description:** ${item.description ? item.description : "*No description*"}`,
                    });
                });
            } else {
                embed.setDescription("No items to display on this page.");
            }

            embed.setFooter({
                text: `Page ${pageNum} of ${totalPages()}`,
            });
            return embed;
        }

        function createRow(pageNum: number) {
            // Select menu for items on the current page
            const itemsToShow = getPageItems(pageNum);
            const selectMenu = {
                type: 3, // StringSelect
                custom_id: "select_item",
                placeholder: "Select an item to buy",
                min_values: 1,
                max_values: 1,
                options: itemsToShow.map((item) => ({
                    label: item.name,
                    value: item.itemId.toString(),
                    description: item.description?.slice(0, 50) || "No description",
                    emoji: emojis.credits,
                })),
                disabled: itemsToShow.length === 0,
            };

            return [
                {
                    type: 1, // ActionRow
                    components: [
                        {
                            type: 2, // Button
                            custom_id: "prev",
                            label: "Previous",
                            style: ButtonStyle.Secondary,
                            disabled: pageNum === 1,
                        },
                        {
                            type: 2, // Button
                            custom_id: "next",
                            label: "Next",
                            style: ButtonStyle.Secondary,
                            disabled: pageNum === totalPages(),
                        },
                        {
                            type: 2, // Button
                            custom_id: "search",
                            label: "Search",
                            style: ButtonStyle.Primary,
                        },
                        {
                            type: 2, // Button
                            custom_id: "close",
                            label: "Close",
                            style: ButtonStyle.Danger,
                        },
                    ],
                },
                {
                    type: 1, // ActionRow for select menu
                    components: [selectMenu],
                },
            ];
        }

        const message = await interaction.editReply({
            embeds: [createEmbed(page)],
            components: createRow(page),
        });

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000,
        });

        // Add a select menu collector
        const selectCollector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60_000,
        });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== interaction.user.id) {
                await btn.reply({
                    content: "You cannot interact with this shop.",
                    ephemeral: true,
                });
                return;
            }

            if (btn.customId === "prev" && page > 1) {
                page--;
            } else if (btn.customId === "next" && page < totalPages()) {
                page++;
            } else if (btn.customId === "close") {
                await btn.update({ components: [] });
                collector.stop();
                return;
            } else if (btn.customId === "search") {
                // Modal in JSON
                const modalJson = {
                    custom_id: "shop_search_modal",
                    title: "Item Search",
                    components: [
                    {
                        type: 1, // ActionRow
                        components: [
                            {
                            type: 4, // TextInput
                            custom_id: "search_input",
                            label: "Item name (or 'all')",
                            style: TextInputStyle.Short,
                            required: true,
                            },
                        ],
                    },
                    ],
                };
                await btn.showModal(modalJson);
                return;
            }

            await btn.update({
                embeds: [createEmbed(page)],
                components: createRow(page),
            });
        });

        // Handle select menu interaction
        selectCollector.on("collect", async (selectInt) => {
            if (selectInt.user.id !== interaction.user.id) {
                await selectInt.reply({
                    content: "You cannot interact with this shop.",
                    ephemeral: true,
                });
                return;
            }
            const selectedId = selectInt.values[0];
            const selectedItem = items.find((item) => item.itemId.toString() === selectedId);
            if (!selectedItem) {
                await selectInt.reply({ content: "Item not found.", ephemeral: true });
                return;
            }

            // Ask for confirmation
            const reply = await selectInt.reply({
                content: `Do you want to buy **${selectedItem.name}** for ${selectedItem.price} ${emojis.credits}?`,
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                custom_id: "confirm_buy",
                                label: "Buy",
                                style: ButtonStyle.Success,
                            },
                            {
                                type: 2,
                                custom_id: "cancel_buy",
                                label: "Cancel",
                                style: ButtonStyle.Secondary,
                            },
                        ],
                    },
                ],
                ephemeral: true,
                fetchReply: true, // Important for awaitMessageComponent
            });

            // Wait for button response on THIS ephemeral message
            try {
                const confirmation = await reply.awaitMessageComponent({
                    filter: (btn) =>
                        btn.user.id === interaction.user.id &&
                        (btn.customId === "confirm_buy" || btn.customId === "cancel_buy"),
                    time: 15_000,
                });

                if (confirmation.customId === "confirm_buy") {
                    // --- PURCHASE LOGIC (using CroissantAPI) ---
                    try {
                        const { genKey } = await import("../utils");
                        const token = await genKey(interaction.user.id);
                        if (!token) {
                            await confirmation.update({
                                content: "You are not authenticated. Please link your account.",
                                components: [],
                            });
                            return;
                        }

                        // Use CroissantAPI to buy the item
                        const buyRes = await croissantAPI.items.buy(selectedItem.itemId, 1);

                        if (!buyRes || buyRes.message?.toLowerCase().includes("error")) {
                            await confirmation.update({
                                content: buyRes?.message || "Failed to purchase the item.",
                                components: [],
                            });
                            return;
                        }

                        await confirmation.update({
                            content: `✅ You bought **${selectedItem.name}** for ${selectedItem.price} ${emojis.credits}!`,
                            components: [],
                        });

                        if (interaction.channel && interaction.channel.type === 0) {
                            await (interaction.channel as import("discord.js").TextChannel).send({
                                content: `**<@${interaction.user.id}>** bought **${selectedItem.name}** for ${selectedItem.price} ${emojis.credits}! Congratulations!`,
                            });
                        }
                    } catch (err) {
                        console.error("Error during purchase:", err);
                        await confirmation.update({
                            content: "Error during purchase. Please try again later.",
                            components: [],
                        });
                    }
                    // --- END PURCHASE LOGIC ---
                } else {
                    await confirmation.update({
                        content: "Purchase cancelled.",
                        components: [],
                    });
                }
            } catch {
                // Timeout
                await reply.edit({
                    content: "No response, purchase cancelled.",
                    components: [],
                });
            }
        });

        interaction.client.on("interactionCreate", async (modalInt) => {
            if (!modalInt.isModalSubmit() || modalInt.customId !== "shop_search_modal") return;
            if (modalInt.user.id !== interaction.user.id) return;

            filter = modalInt.fields.getTextInputValue("search_input").trim();
            if (filter.toLowerCase() === "all") {
                filteredItems = items;
            } else {
                filteredItems = items.filter((item) =>
                    item.name && item.name.toLowerCase().includes(filter.toLowerCase())
                );
            }
            page = 1;
            await modalInt.reply({
                embeds: [createEmbed(page)],
                components: createRow(page),
                ephemeral: true,
            });
        });

        collector.on("end", async () => {
            await interaction.editReply({ components: [] });
        });
        selectCollector.on("end", async () => {
            // Optionally clean up select menu
        });
    },
};

export default command;