import { SlashCommandBuilder } from "discord.js";
import CroissantAPI, { InventoryItem } from "../libs/croissant-api";
import { DiscordInteraction, InteractionResponse } from "../types";

const ITEMS_PER_PAGE = 15;

const command = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Displays a user's inventory")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose inventory to display")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("page")
        .setDescription("Page number to display")
        .setRequired(false)
        .setMinValue(1)
    ),

    async execute(interaction: DiscordInteraction, croissantAPI?: CroissantAPI): Promise<InteractionResponse> {
    try {
      if (!croissantAPI) {
        return {
          type: 4,
          data: {
            content: "❌ API not available.",
            flags: 64
          }
        };
      }

      // Parse options to get user and page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options = (interaction.data.options as any) || [];
      let targetUserId = interaction.member?.user?.id || interaction.user?.id;
      let page = 1;

      // Parse user option (can be first or second option)
      for (const option of options) {
        if (option.name === "user" && option.value) {
          targetUserId = option.value;
        }
        if (option.name === "page" && option.value) {
          page = Math.max(1, option.value);
        }
      }

      if (!targetUserId) {
        return {
          type: 4,
          data: {
            content: "❌ Unable to identify user.",
            flags: 64
          }
        };
      }

      const croissantUser = await croissantAPI.users.getUser(targetUserId);
      const inventoryResponse = await croissantAPI.inventory.get(croissantUser.userId);
      const inventoryData = inventoryResponse.inventory;

      if (!inventoryData || inventoryData.length === 0) {
        return {
          type: 4, // InteractionResponseType.ChannelMessageWithSource
          data: {
            embeds: [{
              title: `📦 ${croissantUser.username}'s Inventory`,
              description: "🔍 This inventory is empty.",
              color: 0xFF69B4
            }]
          }
        };
      }

      // Calculate pagination
      const totalPages = Math.ceil(inventoryData.length / ITEMS_PER_PAGE);
      page = Math.min(page, totalPages); // Ensure page doesn't exceed total pages
      
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const itemsToShow = inventoryData.slice(startIndex, endIndex);
      
      const itemsList = itemsToShow
        .map((item: InventoryItem) => `• **${item.name}**${item.amount ? ` ×${item.amount}` : ""}`)
        .join("\n");

      // Create embed
      const embed = {
        title: `📦 ${croissantUser.username}'s Inventory`,
        description: itemsList,
        color: 0xFF69B4,
        footer: {
          text: `Page ${page} of ${totalPages} • Total items: ${inventoryData.length}`
        }
      };

      // Create navigation buttons if there are multiple pages
      const components = [];
      if (totalPages > 1) {
        const buttons = [];
        
        // Previous button
        if (page > 1) {
          buttons.push({
            type: 2, // Button component type
            style: 2, // Secondary style
            label: "◀️ Previous",
            custom_id: `inventory_prev_${targetUserId}_${page - 1}`,
            disabled: false
          });
        }

        // Page indicator
        buttons.push({
          type: 2,
          style: 2,
          label: `${page}/${totalPages}`,
          custom_id: `inventory_page_${targetUserId}_${page}`,
          disabled: true
        });

        // Next button
        if (page < totalPages) {
          buttons.push({
            type: 2,
            style: 2,
            label: "Next ▶️",
            custom_id: `inventory_next_${targetUserId}_${page + 1}`,
            disabled: false
          });
        }

        if (buttons.length > 0) {
          components.push({
            type: 1, // Action row type
            components: buttons
          });
        }
      }

      return {
        type: 4, // InteractionResponseType.ChannelMessageWithSource
        data: {
          embeds: [embed],
          components: components
        }
      };
    } catch (error) {
      console.error("Error fetching inventory:", error);
      return {
        type: 4, // InteractionResponseType.ChannelMessageWithSource
        data: {
          embeds: [{
            title: "❌ Error",
            description: "An error occurred while fetching the inventory.",
            color: 0xFF0000
          }],
          flags: 64 // MessageFlags.Ephemeral
        }
      };
    }
  },
};

export default command;