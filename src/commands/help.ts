import {
    ButtonStyle,
    ChatInputCommandInteraction,
    Client,
    ComponentType,
    EmbedBuilder,
    SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";

const ITEMS_PER_PAGE = 15;

const command: Command = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Displays the bot's help menu"),

    async execute(interaction: ChatInputCommandInteraction & { client: Client }) {
        try {
            await interaction.deferReply({ ephemeral: false });

            const commands = await interaction.client.application.commands.fetch();
            // Only include slash commands (not context menu commands)
            const slashCommands = Array.from(commands.values()).filter(
                (cmd) => cmd.type === 1 // 1 = ChatInput (slash command)
            );

            // const isOwner = owners.includes(interaction.user.id);
            const isOwner = false;

            // Filter commands for non-owners
            const filtered = slashCommands.filter(
                (cmd) => isOwner || !cmd.name.startsWith("admin-")
            );

            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
            let page = 1;

            const getEmbed = (pageNum: number) => {
                const start = (pageNum - 1) * ITEMS_PER_PAGE;
                const end = start + ITEMS_PER_PAGE;
                const cmds = filtered.slice(start, end);

                return new EmbedBuilder()
                    .setTitle("Bot Help")
                    .setColor(0x3498db)
                    .setDescription(
                        cmds
                            .map(
                                (cmd) =>
                                    `</${cmd.name}:${cmd.id}> : ${cmd.description || "*No description*"}`
                            )
                            .join("\n") || "No commands to display."
                    )
                    .setFooter({ text: `Page ${pageNum} of ${totalPages}` });
            };

            const getRow = (pageNum: number) => {
                const components = [];

                if (totalPages > 1) {
                    components.push(
                        {
                            type: 2,
                            custom_id: "prev",
                            label: "Previous",
                            style: ButtonStyle.Secondary,
                            disabled: pageNum === 1,
                        },
                        {
                            type: 2,
                            custom_id: "next",
                            label: "Next",
                            style: ButtonStyle.Secondary,
                            disabled: pageNum === totalPages,
                        }
                    );
                }

                components.push({
                    type: 2,
                    custom_id: "close",
                    label: "Close",
                    style: ButtonStyle.Danger,
                });

                return {
                    type: 1,
                    components,
                };
            };

            const message = await interaction.editReply({
                embeds: [getEmbed(page)],
                components: totalPages > 1 ? [getRow(page)] : [],
            });

            if (totalPages <= 1) return;

            const collector = message.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60_000,
            });

            collector.on("collect", async (btn) => {
                if (btn.user.id !== interaction.user.id) {
                    await btn.reply({
                        content: "You cannot interact with this help menu.",
                        ephemeral: true,
                    });
                    return;
                }

                if (btn.customId === "prev" && page > 1) {
                    page--;
                } else if (btn.customId === "next" && page < totalPages) {
                    page++;
                } else if (btn.customId === "close") {
                    await btn.update({ components: [] });
                    collector.stop();
                    return;
                }

                await btn.update({
                    embeds: [getEmbed(page)],
                    components: totalPages > 1 ? [getRow(page)] : [],
                });
            });

            collector.on("end", async () => {
                await interaction.editReply({ components: [] });
            });
        } catch (error) {
            console.error("Error displaying help:", error);
            await interaction.editReply({
                content: "An error occurred while displaying the help menu.",
            });
        }
    },
};

export default command;