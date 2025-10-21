import { SlashCommandBuilder } from "discord.js";
import CroissantAPI, { InventoryItem } from "../libs/croissant-api";
import { DiscordInteraction, InteractionResponse } from "../types";

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

      // Get target user ID (from options or current user)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetUserId = (interaction.data.options as any)?.[0]?.value || interaction.member?.user?.id || interaction.user?.id;
      const croissantUser = await croissantAPI.users.getUser(targetUserId);
      const inventoryResponse = await croissantAPI.inventory.get(croissantUser.userId);
      const inventoryData = inventoryResponse.inventory;

      if (!inventoryData || inventoryData.length === 0) {
        return {
          type: 4, // InteractionResponseType.ChannelMessageWithSource
          data: {
            content: `📦 **${croissantUser.username}'s Inventory**\n\n🔍 This inventory is empty.`
          }
        };
      }

      // Show first 15 items (basic pagination for HTTP)
      const itemsToShow = inventoryData.slice(0, 15);
      const hasMore = inventoryData.length > 15;
      
      const itemsList = itemsToShow
        .map((item: InventoryItem) => `• **${item.name}**${item.amount ? ` ×${item.amount}` : ""}`)
        .join("\n");

      const content = `📦 **${croissantUser.username}'s Inventory**\n\n` +
        `${itemsList}\n\n` +
        (hasMore ? `*... and ${inventoryData.length - 15} more items*\n\n` : "") +
        `**Total items:** ${inventoryData.length}`;

      return {
        type: 4, // InteractionResponseType.ChannelMessageWithSource
        data: {
          content: content
        }
      };
    } catch (error) {
      console.error("Error fetching inventory:", error);
      return {
        type: 4, // InteractionResponseType.ChannelMessageWithSource
        data: {
          content: "❌ An error occurred while fetching the inventory.",
          flags: 64 // MessageFlags.Ephemeral
        }
      };
    }
  },
};

export default command;