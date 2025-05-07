const croissantBaseUrl = 'https://croissant-api.fr/api';

/**
 * Represents a game in the Croissant API.
 * @property gameId - Unique identifier for the game.
 * @property name - Name of the game.
 * @property description - Description of the game.
 * @property owner_id - ID of the game's owner.
 * @property download_link - Optional download link for the game.
 * @property price - Price of the game.
 * @property showInStore - Whether the game is visible in the store.
 * @property iconHash - Optional hash for the game's icon.
 * @property splashHash - Optional hash for the game's splash image.
 * @property bannerHash - Optional hash for the game's banner.
 * @property genre - Optional genre of the game.
 * @property release_date - Optional release date.
 * @property developer - Optional developer name.
 * @property publisher - Optional publisher name.
 * @property platforms - Optional supported platforms.
 * @property rating - Game rating.
 * @property website - Optional website URL.
 * @property trailer_link - Optional trailer link.
 * @property multiplayer - Whether the game supports multiplayer.
 * @example
 * const game: Game = {
 *   gameId: "123",
 *   name: "Croissant Adventure",
 *   description: "A fun game.",
 *   owner_id: "owner123",
 *   price: 10,
 *   showInStore: true,
 *   rating: 4.5,
 *   multiplayer: false
 * };
 */
export interface Game {
    gameId: string;
    name: string;
    description: string;
    owner_id: string;
    download_link?: string | null;
    price: number;
    showInStore: boolean;
    iconHash?: string | null;
    splashHash?: string | null;
    bannerHash?: string | null;
    genre?: string | null;
    release_date?: string | null;
    developer?: string | null;
    publisher?: string | null;
    platforms?: string | null;
    rating: number;
    website?: string | null;
    trailer_link?: string | null;
    multiplayer: boolean;
}

/**
 * Represents a game owner.
 * @property gameId - The ID of the game.
 * @property owner_id - The ID of the owner.
 */
export interface GameOwner {
    gameId: string;
    owner_id: string;
}

/**
 * Represents a user's inventory.
 * @property user_id - The user's ID.
 * @property inventory - Array of inventory items.
 */
export interface Inventory {
    user_id: string;
    inventory: InventoryItem[];
}

/**
 * Represents an item in a user's inventory.
 * @property user_id - The user's ID.
 * @property item_id - The item's ID.
 * @property amount - The quantity of the item.
 */
export interface InventoryItem {
    name: string;
    description: string;
    itemId: string;
    amount: number;
}

/**
 * Represents an item in the Croissant API.
 * @property itemId - Unique identifier for the item.
 * @property name - Name of the item.
 * @property description - Description of the item.
 * @property price - Price of the item.
 * @property owner - Owner's ID.
 * @property showInStore - Whether the item is visible in the store.
 * @property iconHash - Hash for the item's icon.
 * @property deleted - Whether the item is deleted.
 * @example
 * const item: Item = {
 *   itemId: "item123",
 *   name: "Golden Croissant",
 *   description: "A rare item.",
 *   price: 100,
 *   owner: "owner123",
 *   showInStore: true,
 *   iconHash: "hash",
 *   deleted: false
 * };
 */
export interface Item {
    itemId: string;
    name: string;
    description: string;
    price: number;
    owner: string;
    showInStore: boolean;
    iconHash: string;
    deleted: boolean;
}

/**
 * Represents a lobby.
 * @property lobbyId - Unique identifier for the lobby.
 * @property users - Array of user IDs in the lobby.
 */
export interface Lobby {
    lobbyId: string; // Unique identifier for the lobby
    users: string; // Array of user IDs in the lobby
}

/**
 * Represents a user in the Croissant API.
 * @property username - The user's username.
 * @property avatar - The user's avatar hash.
 * @property discriminator - The user's discriminator.
 * @property public_flags - Public flags.
 * @property flags - User flags.
 * @property banner - Banner hash.
 * @property accent_color - Accent color.
 * @property global_name - Global display name.
 * @property balance - User's balance.
 * @example
 * const user: User = {
 *   username: "CroissantFan",
 *   avatar: "avatarhash",
 *   discriminator: "1234",
 *   public_flags: 0,
 *   flags: 0,
 *   banner: "bannerhash",
 *   accent_color: null,
 *   global_name: "CroissantFan",
 *   balance: 500
 * };
 */
export interface User {
    username: string;
    avatar: string;
    discriminator: string;
    public_flags: number;
    flags: number;
    banner: string;
    accent_color: number | null;
    global_name: string;
    balance: number;
}

/**
 * CroissantAPI provides methods to interact with the Croissant API.
 * @example
 * const api = new CroissantAPI('your_token');
 * const games = await api.games.list();
 */
class CroissantAPI {
    private token: string;

    /**
     * Creates a new CroissantAPI instance.
     * @param token - The user's authentication token.
     */
    constructor(params: {token: string}) {
        if(!params.token) throw new Error('Token is required');
        this.token = params.token;
    }

    // --- USERS ---
    /**
     * User-related API methods.
     */
    users = {
        /**
         * Get the current authenticated user.
         * @returns The current user.
         * @example
         * const me = await api.users.getMe();
         */
        getMe: async (): Promise<User> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/users/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch user');
            return await res.json();
        },

        /**
         * Get a user by their ID.
         * @param userId - The user's ID.
         * @returns The user.
         * @example
         * const user = await api.users.getUser('user123');
         */
        getUser: async (userId: string): Promise<User> => {
            const res = await fetch(`${croissantBaseUrl}/users/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch user');
            return await res.json();
        },

        /**
         * Search for users by query.
         * @param query - The search query.
         * @returns Array of users.
         * @example
         * const users = await api.users.search('croissant');
         */
        search: async (query: string): Promise<User[]> => {
            const res = await fetch(`${croissantBaseUrl}/users/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('Failed to search users');
            return await res.json();
        },

        /**
         * Verify a user with a verification key.
         * @param userId - The user's ID.
         * @param verificationKey - The verification key.
         * @returns Success status.
         * @example
         * const result = await api.users.verify('user123', 'key');
         */
        verify: async (userId: string, verificationKey: string): Promise<{ success: boolean }> => {
            const res = await fetch(
                `${croissantBaseUrl}/users/auth-verification?userId=${encodeURIComponent(userId)}&verificationKey=${encodeURIComponent(verificationKey)}`
            );
            if (!res.ok) throw new Error('Failed to verify user');
            return await res.json();
        },

        /**
         * Transfer credits to another user.
         * @param targetUserId - The recipient's user ID.
         * @param amount - Amount to transfer.
         * @returns Message about the transfer.
         * @example
         * const result = await api.users.transferCredits('user456', 100);
         */
        transferCredits: async (targetUserId: string, amount: number): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/users/transfer-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ targetUserId, amount })
            });
            return await res.json();
        }
    };

    // --- GAMES ---
    /**
     * Game-related API methods.
     */
    games = {
        /**
         * List all games.
         * @returns Array of games.
         * @example
         * const games = await api.games.list();
         */
        list: async (): Promise<Game[]> => {
            const res = await fetch(`${croissantBaseUrl}/games`);
            if (!res.ok) throw new Error('Failed to fetch games');
            return await res.json();
        },

        /**
         * Get a game by its ID.
         * @param gameId - The game's ID.
         * @returns The game.
         * @example
         * const game = await api.games.get('game123');
         */
        get: async (gameId: string): Promise<Game> => {
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`);
            if (!res.ok) throw new Error('Failed to fetch game');
            return await res.json();
        },

        /**
         * List games owned by the current user.
         * @returns Array of games.
         * @example
         * const myGames = await api.games.listMine();
         */
        listMine: async (): Promise<Game[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games/@mine`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch my games');
            return await res.json();
        },

        /**
         * List games owned by the current user (alternative endpoint).
         * @returns Array of games.
         * @example
         * const ownedGames = await api.games.listOwned();
         */
        listOwned: async (): Promise<Game[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games/list/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch owned games');
            return await res.json();
        },

        /**
         * List games owned by a specific user.
         * @param userId - The user's ID.
         * @returns Array of games.
         * @example
         * const userGames = await api.games.listOwnedByUser('user123');
         */
        listOwnedByUser: async (userId: string): Promise<Game[]> => {
            const res = await fetch(`${croissantBaseUrl}/games/list/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch user owned games');
            return await res.json();
        },

        /**
         * Create a new game.
         * @param options - Partial game object.
         * @returns The created game.
         * @example
         * const newGame = await api.games.create({ name: "New Game", price: 5 });
         */
        create: async (options: Partial<Game>): Promise<Game> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(options)
            });
            if (!res.ok) throw new Error('Failed to create game');
            return await res.json();
        },

        /**
         * Update an existing game.
         * @param gameId - The game's ID.
         * @param options - Partial game object.
         * @returns The updated game.
         * @example
         * const updatedGame = await api.games.update('game123', { price: 15 });
         */
        update: async (gameId: string, options: Partial<Game>): Promise<Game> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(options)
            });
            if (!res.ok) throw new Error('Failed to update game');
            return await res.json();
        },

        /**
         * Delete a game.
         * @param gameId - The game's ID.
         * @returns Message about the deletion.
         * @example
         * const result = await api.games.delete('game123');
         */
        delete: async (gameId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return await res.json();
        }
    };

    // --- ITEMS ---
    /**
     * Item-related API methods.
     */
    items = {
        /**
         * List all items.
         * @returns Array of items.
         * @example
         * const items = await api.items.list();
         */
        list: async (): Promise<Item[]> => {
            const res = await fetch(`${croissantBaseUrl}/items`);
            if (!res.ok) throw new Error('Failed to fetch items');
            return await res.json();
        },

        /**
         * List items owned by the current user.
         * @returns Array of items.
         * @example
         * const myItems = await api.items.listMine();
         */
        listMine: async (): Promise<Item[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/@mine`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch my items');
            return await res.json();
        },

        /**
         * Get an item by its ID.
         * @param itemId - The item's ID.
         * @returns The item.
         * @example
         * const item = await api.items.get('item123');
         */
        get: async (itemId: string): Promise<Item> => {
            const res = await fetch(`${croissantBaseUrl}/items/${itemId}`);
            if (!res.ok) throw new Error('Failed to fetch item');
            return await res.json();
        },

        /**
         * Create a new item.
         * @param options - Partial item object.
         * @returns The created item.
         * @example
         * const newItem = await api.items.create({ name: "Croissant", price: 2 });
         */
        create: async (options: Partial<Item>): Promise<Item> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(options)
            });
            if (!res.ok) throw new Error('Failed to create item');
            return await res.json();
        },

        /**
         * Update an existing item.
         * @param itemId - The item's ID.
         * @param options - Partial item object.
         * @returns The updated item.
         * @example
         * const updatedItem = await api.items.update('item123', { price: 5 });
         */
        update: async (itemId: string, options: Partial<Item>): Promise<Item> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/update/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(options)
            });
            if (!res.ok) throw new Error('Failed to update item');
            return await res.json();
        },

        /**
         * Delete an item.
         * @param itemId - The item's ID.
         * @returns Message about the deletion.
         * @example
         * const result = await api.items.delete('item123');
         */
        delete: async (itemId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/delete/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return await res.json();
        },

        /**
         * Buy an item.
         * @param itemId - The item's ID.
         * @param amount - Amount to buy.
         * @returns Message about the purchase.
         * @example
         * const result = await api.items.buy('item123', 2);
         */
        buy: async (itemId: string, amount: number): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/buy/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ amount })
            });
            return await res.json();
        },

        /**
         * Sell an item.
         * @param itemId - The item's ID.
         * @param amount - Amount to sell.
         * @returns Message about the sale.
         * @example
         * const result = await api.items.sell('item123', 1);
         */
        sell: async (itemId: string, amount: number): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/sell/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ amount })
            });
            return await res.json();
        },

        /**
         * Give an item to another user.
         * @param itemId - The item's ID.
         * @param amount - Amount to give.
         * @returns Message about the transfer.
         * @example
         * const result = await api.items.give('item123', 1);
         */
        give: async (itemId: string, amount: number): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/give/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ amount })
            });
            return await res.json();
        },

        /**
         * Consume an item.
         * @param itemId - The item's ID.
         * @param amount - Amount to consume.
         * @returns Message about the consumption.
         * @example
         * const result = await api.items.consume('item123', 1);
         */
        consume: async (itemId: string, amount: number): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/consume/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ amount })
            });
            return await res.json();
        },

        /**
         * Drop an item.
         * @param itemId - The item's ID.
         * @param amount - Amount to drop.
         * @returns Message about the drop.
         * @example
         * const result = await api.items.drop('item123', 1);
         */
        drop: async (itemId: string, amount: number): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/drop/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ amount })
            });
            return await res.json();
        },

        /**
         * Transfer an item to another user.
         * @param itemId - The item's ID.
         * @param amount - Amount to transfer.
         * @param targetUserId - The recipient's user ID.
         * @returns Message about the transfer.
         * @example
         * const result = await api.items.transfer('item123', 1, 'user456');
         */
        transfer: async (itemId: string, amount: number, targetUserId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/transfer/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ amount, targetUserId })
            });
            return await res.json();
        }
    };

    // --- INVENTORY ---
    /**
     * Inventory-related API methods.
     */
    inventory = {
        /**
         * Get a user's inventory.
         * @param userId - The user's ID.
         * @returns Array of inventory items.
         * @example
         * const inventory = await api.inventory.get('user123');
         */
        get: async (userId: string): Promise<InventoryItem[]> => {
            const res = await fetch(`${croissantBaseUrl}/inventory/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch inventory');
            return await res.json();
        }
    };

    // --- LOBBIES ---
    /**
     * Lobby-related API methods.
     */
    lobbies = {
        /**
         * Get a lobby by its ID.
         * @param lobbyId - The lobby's ID.
         * @returns The lobby.
         * @example
         * const lobby = await api.lobbies.get('lobby123');
         */
        get: async (lobbyId: string): Promise<Lobby> => {
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}`);
            if (!res.ok) throw new Error('Failed to fetch lobby');
            return await res.json();
        },

        /**
         * Get the lobby a user is in.
         * @param userId - The user's ID.
         * @returns The lobby.
         * @example
         * const lobby = await api.lobbies.getUserLobby('user123');
         */
        getUserLobby: async (userId: string): Promise<Lobby> => {
            const res = await fetch(`${croissantBaseUrl}/lobbies/user/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch user lobby');
            return await res.json();
        },

        /**
         * Get the current user's lobby.
         * @returns The lobby.
         * @example
         * const myLobby = await api.lobbies.getMine();
         */
        getMine: async (): Promise<Lobby> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies/user/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch my lobby');
            return await res.json();
        },

        /**
         * Create a new lobby.
         * @param options - Partial lobby object.
         * @returns The created lobby.
         * @example
         * const newLobby = await api.lobbies.create({ users: ['user123'] });
         */
        create: async (options: Partial<Lobby>): Promise<Lobby> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(options)
            });
            if (!res.ok) throw new Error('Failed to create lobby');
            return await res.json();
        },

        /**
         * Join a lobby.
         * @param lobbyId - The lobby's ID.
         * @returns Message about joining.
         * @example
         * const result = await api.lobbies.join('lobby123');
         */
        join: async (lobbyId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return await res.json();
        },

        /**
         * Leave a lobby.
         * @param lobbyId - The lobby's ID.
         * @returns Message about leaving.
         * @example
         * const result = await api.lobbies.leave('lobby123');
         */
        leave: async (lobbyId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            return await res.json();
        }
    };
}

// --- Export ---
export {
    CroissantAPI,
    CroissantAPI as default
};