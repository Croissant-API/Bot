/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  ContextMenuCommandInteraction,
  User,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { CroissantAPI } from "../libs/croissant-api";

const ITEMS_PER_PAGE = 15;

const command = {
  data: new ContextMenuCommandBuilder()
    .setName("View Inventory")
    .setType(ApplicationCommandType.User),

  async execute(interaction: ContextMenuCommandInteraction, croissantAPI: CroissantAPI) {
    if (!interaction.isUserContextMenuCommand()) return;

    try {
      const user: User = interaction.targetUser;

      await interaction.deferReply({ ephemeral: false });
      // Use the croissantAPI instance passed to the command, not the class directly
      const inventoryData = await croissantAPI.inventory.get(user.id);

      if (!inventoryData || inventoryData.length === 0) {
        await interaction.editReply({
          content: `:open_file_folder: **${user.username}**'s inventory is empty.`,
        });
        return;
      }

      let page = 1;
      const totalPages = Math.ceil(inventoryData.length / ITEMS_PER_PAGE);

      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      const itemsToShow = inventoryData.slice(start, end);

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Inventory`)
        .setColor("Random")
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Page ${page} of ${totalPages}` });

      if (itemsToShow.length > 0) {
        embed.setDescription(
          itemsToShow
            .map(
              (item) =>
                `**${item.name}**${item.amount ? ` x${item.amount}` : ""}`
            )
            .join("\n")
        );
      } else {
        embed.setDescription("No items to display on this page.");
      }

      const row = new ActionRowBuilder<ButtonBuilder>();
      if (totalPages > 1) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 1),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages)
        );
      }
      row.addComponents(
        new ButtonBuilder()
          .setCustomId("close")
          .setLabel("Close")
          .setStyle(ButtonStyle.Danger)
      );

      const message = await interaction.editReply({
        embeds: [embed],
        components: totalPages > 1 ? [row.toJSON() as any] : [],
      });

      if (totalPages <= 1) return;

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
      });

      collector.on("collect", async (btn) => {
        if (btn.user.id !== interaction.user.id) {
          await btn.reply({ content: "You cannot interact with this inventory.", ephemeral: true });
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

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const itemsToShow = inventoryData.slice(start, end);

        const embed = new EmbedBuilder()
          .setTitle(`${user.username}'s Inventory`)
          .setColor("Random")
          .setThumbnail(user.displayAvatarURL())
          .setFooter({ text: `Page ${page} of ${totalPages}` });

        if (itemsToShow.length > 0) {
          embed.setDescription(
            itemsToShow
              .map(
                (item) =>
                  `**${item.name}**${item.amount ? ` x${item.amount}` : ""}`
              )
              .join("\n")
          );
        } else {
          embed.setDescription("No items to display on this page.");
        }

        const row = new ActionRowBuilder<ButtonBuilder>();
        if (totalPages > 1) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === 1),
            new ButtonBuilder()
              .setCustomId("next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(page === totalPages)
          );
        }
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("close")
            .setLabel("Close")
            .setStyle(ButtonStyle.Danger)
        );

        await btn.update({
          embeds: [embed],
          components: totalPages > 1 ? [row.toJSON() as any] : [],
        });
      });

      collector.on("end", async () => {
        await interaction.editReply({ components: [] });
      });
    } catch (error) {
      console.error("Error while fetching inventory:", error);
      await interaction.editReply({
        content: "An error occurred while fetching the inventory.",
      });
    }
  },
};

export default command;
