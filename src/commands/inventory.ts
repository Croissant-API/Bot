/* eslint-disable @typescript-eslint/no-explicit-any */
import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { CroissantAPI } from "../libs/croissant-api";

const ITEMS_PER_PAGE = 15;

function buildInventoryEmbed(user: any, items: any[], page: number, totalPages: number) {
  const embed = new EmbedBuilder()
    .setTitle(`${user.username}'s Inventory`)
    .setColor(0xFF69B4)
    .setThumbnail(user.displayAvatarURL())
    .setFooter({ text: `Page ${page} of ${totalPages}` });

  if (items.length > 0) {
    embed.setDescription(
      items
        .map(
          (item) =>
            `**${item.name}**${item.amount ? ` x${item.amount}` : ""}`
        )
        .join("\n")
    );
  } else {
    embed.setDescription("No items to display on this page.");
  }
  return embed;
}

function buildInventoryButtons(page: number, totalPages: number) {
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
  return row;
}

const command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Displays a user's inventory")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose inventory to display")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
    try {
      const user = interaction.options.getUser("user") ?? interaction.user;
      const croissantUser = await croissantAPI.users.getUser(user.id);

      await interaction.deferReply({ ephemeral: false });

      const inventoryResponse = await croissantAPI.inventory.get(croissantUser.userId);
      const inventoryData = inventoryResponse.inventory;

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

      const embed = buildInventoryEmbed(user, itemsToShow, page, totalPages);
      const row = buildInventoryButtons(page, totalPages);

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

        const embed = buildInventoryEmbed(user, itemsToShow, page, totalPages);
        const row = buildInventoryButtons(page, totalPages);

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