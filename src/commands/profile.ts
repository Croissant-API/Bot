import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { CroissantAPI } from "../libs/croissant-api";
import { emojis } from "../utils";
import { EmbedBuilder } from "discord.js";

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

    async execute(interaction: ChatInputCommandInteraction, croissantAPI: CroissantAPI) {
        try {
            const member = interaction.options.getUser("member") || interaction.user;
            const userId = member.id;
            const user = await croissantAPI.users.getUser(userId);
            console.log(user);

            // Determine main certification (shown in title)
            let certif = "";
            switch (true) {
                case user.verified && user.admin: certif = emojis.admin; break;
                case user.verified && user.isStudio: certif = emojis.brandVerified; break;
                case user.verified: certif = emojis.verified; break;
            }

            // Prepare other badges (excluding certif)
            const badges: string[] = [];
            if (user.disabled) badges.push("🚫");
            // Add possible Croissant badges
            const possibleBadges = [
                { key: "staff", emoji: emojis.staff },
                { key: "bug_hunter", emoji: emojis.bugHunter },
                { key: "contributor", emoji: emojis.contributor },
                { key: "moderator", emoji: emojis.moderator },
                { key: "community_manager", emoji: emojis.communityManager },
                { key: "partner", emoji: emojis.partner },
                { key: "early_user", emoji: emojis.earlyUser }
            ];

            if (user.badges && Array.isArray(user.badges)) {
                for (const badge of possibleBadges) {
                    if (user.badges.includes(badge.key)) {
                        badges.push(badge.emoji);
                    }
                }
            }

            // Statistics
            const stats = [
                `🎮 Games created: ${user.createdGames?.length ?? 0} games`,
                `🛍️ Owned items: ${user.ownedItems?.length ?? 0} created items`,
                `🎒 Inventory: ${user.inventory?.length ?? 0} items`,
                `🏢 Studios: ${user.studios?.length ?? 0} studios`,
                `💰 Credits: ${user.balance ?? 0} ${emojis.credits}`,
            ].join("\n");

            // Embed
            const embed = new EmbedBuilder()
                .setTitle(`Profile of ${user.username} ${certif}`)
                .setThumbnail(`https://croissant-api.fr/avatar/${user.userId}`)
                .addFields(
                    { name: "Badges", value: badges.length ? badges.join("") : "None", inline: false },
                    { name: "Statistics", value: stats, inline: false },
                    { name: "View profile", value: `[Open profile](https://croissant-api.fr/profile?user=${user.userId})`, inline: false }
                )
                .setFooter({ text: `Croissant ID: ${user.userId}` });

            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error("Error while fetching profile:", error);
            const notFoundEmbed = new EmbedBuilder()
                .setTitle("Profile not found")
                .setDescription("This user does not have a Croissant profile.")
                .setColor(0xff0000);

            await interaction.reply({ embeds: [notFoundEmbed], ephemeral: true });
        }
    },
};

export default command;