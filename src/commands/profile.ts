import { SlashCommandBuilder } from "discord.js";
import CroissantAPI, { User } from "../libs/croissant-api";
import { DiscordInteraction, InteractionResponse } from "../types";
import { emojis } from "../utils";

const command = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Displays your profile via the Croissant API")
        .addUserOption(option =>
            option
                .setName("member")
                .setDescription("The member whose profile to display")
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
            const user = await croissantAPI.users.getUser(targetUserId) as User;

            // Determine main certification
            let certif = "";
            if (user.verified && user.admin) {
                certif = emojis.admin;
            } else if (user.verified && (user).isStudio) {
                certif = emojis.brandVerified;
            } else if (user.verified) {
                certif = emojis.verified;
            }

            // Prepare badges
            const badges: string[] = [];
            if ((user).disabled) badges.push("🚫");
            
            const possibleBadges = [
                { key: "staff", emoji: emojis.staff },
                { key: "bug_hunter", emoji: emojis.bugHunter },
                { key: "contributor", emoji: emojis.contributor },
                { key: "moderator", emoji: emojis.moderator },
                { key: "community_manager", emoji: emojis.communityManager },
                { key: "partner", emoji: emojis.partner },
                { key: "early_user", emoji: emojis.earlyUser }
            ];

            if ((user).badges && Array.isArray((user).badges)) {
                for (const badge of possibleBadges) {
                    if ((user).badges.includes(badge.key)) {
                        badges.push(badge.emoji);
                    }
                }
            }

            // Create embed
            const embed = {
                title: `👤 Profile of ${user.username} ${certif}`,
                color: 0x3498db,
                thumbnail: {
                    url: `https://croissant-api.fr/avatar/${user.userId}`
                },
                fields: [
                    {
                        name: "🏷️ Badges",
                        value: badges.length ? badges.join(" ") : "None",
                        inline: false
                    },
                    {
                        name: "📊 Statistics",
                        value: `🎮 Games created: ${(user as User).createdGames?.length ?? 0}\n` +
                               `🛍️ Owned items: ${(user as User).ownedItems?.length ?? 0}\n` +
                               `🎒 Inventory: ${(user as User).inventory?.length ?? 0}\n` +
                               `🏢 Studios: ${(user as User).studios?.length ?? 0}`,
                        inline: false
                    },
                    {
                        name: "🔗 Links",
                        value: `[View full profile](https://croissant-api.fr/profile?user=${user.userId})\n` +
                               `[Avatar](https://croissant-api.fr/avatar/${user.userId})`,
                        inline: false
                    }
                ],
                footer: {
                    text: `Croissant ID: ${user.userId}`
                }
            };

            return {
                type: 4, // InteractionResponseType.ChannelMessageWithSource
                data: {
                    embeds: [embed]
                }
            };
        } catch (error) {
            console.error("Error fetching profile:", error);
            return {
                type: 4, // InteractionResponseType.ChannelMessageWithSource
                data: {
                    embeds: [{
                        title: "❌ Profile not found",
                        description: "This user does not have a Croissant profile or an error occurred.",
                        color: 0xff0000
                    }],
                    flags: 64 // MessageFlags.Ephemeral
                }
            };
        }
    },
};

export default command;