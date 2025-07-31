/* eslint-disable @typescript-eslint/no-explicit-any */
const croissantBaseUrl = 'https://croissant-api.fr/api';

/**
 * Game object as returned by the API.
 */
export interface Game {
    gameId: string;
    name: string;
    description: string;
    price: number;
    owner_id: string;
    showInStore: boolean;
    iconHash?: string;
    splashHash?: string;
    bannerHash?: string;
    genre?: string;
    release_date?: string;
    developer?: string;
    publisher?: string;
    platforms?: string[];
    rating: number;
    website?: string;
    trailer_link?: string;
    multiplayer: boolean;
    download_link?: string;
}

/**
 * User object as returned by the API.
 */
export interface User {
    userId: string;
    username: string;
    email?: string;
    verified: boolean;
    studios?: Studio[];
    roles?: string[];
    inventory?: InventoryItem[];
    ownedItems?: Item[];
    createdGames?: Game[];
    verificationKey?: string;
    steam_id?: string;
    steam_username?: string;
    steam_avatar_url?: string;
    isStudio?: boolean;
    admin?: boolean;
    disabled?: boolean;
    google_id?: string;
    discord_id?: string;
    balance?: number;
    haveAuthenticator?: boolean;
}

/**
 * Item object as returned by the API.
 */
export interface Item {
    itemId: string;
    name: string;
    description: string;
    owner: string;
    price: number;
    iconHash: string;
    showInStore?: boolean;
    deleted?: boolean;
}

/**
 * Inventory item instance, including item details.
 */
export interface InventoryItem {
    user_id?: string;
    item_id?: string;
    amount: number;
    metadata?: Record<string, any>;
    itemId: string;
    name: string;
    description: string;
    iconHash: string;
    price: number;
    owner: string;
    showInStore: boolean;
}

/**
 * Studio object as returned by the API.
 */
export interface Studio {
    user_id: string;
    username: string;
    verified: boolean;
    admin_id: string;
    isAdmin?: boolean;
    apiKey?: string;
    users?: Array<{
        user_id: string;
        username: string;
        verified: boolean;
        admin: boolean;
    }>;
}

/**
 * Lobby object as returned by the API.
 */
export interface Lobby {
    lobbyId: string;
    users: Array<{
        username: string;
        user_id: string;
        verified: boolean;
        steam_username?: string;
        steam_avatar_url?: string;
        steam_id?: string;
    }>;
}

/**
 * Trade item structure for trade operations.
 */
export interface TradeItem {
    itemId: string;
    amount: number;
    metadata?: Record<string, any>;
}

/**
 * Trade object as returned by the API.
 */
export interface Trade {
    id: string;
    fromUserId: string;
    toUserId: string;
    fromUserItems: Array<{
        itemId: string;
        name: string;
        description: string;
        iconHash: string;
        amount: number;
    }>;
    toUserItems: Array<{
        itemId: string;
        name: string;
        description: string;
        iconHash: string;
        amount: number;
    }>;
    approvedFromUser: boolean;
    approvedToUser: boolean;
    status: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * OAuth2 application object as returned by the API.
 */
export interface OAuth2App {
    client_id: string;
    client_secret: string;
    name: string;
    redirect_urls: string[];
}

/**
 * Main CroissantAPI client. All methods are typed and documented for VS Code autocompletion.
 */
export class CroissantAPI {
    private token?: string;

    /**
     * Create a new CroissantAPI client.
     * @param params Optional object with a token for authentication.
     */
    constructor(params: { token?: string } = {}) {
        this.token = params.token;
    }

    // --- USERS ---
    users = {
        /**
         * Get the authenticated user's profile.
         * @returns The current user object.
         * @throws If no token is set or the request fails.
         * @example
         *   const me = await api.users.getMe();
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
         * Search users by username or other criteria.
         * @param query The search string.
         * @returns Array of matching users.
         * @example
         *   const users = await api.users.search('John');
         */
        search: async (query: string): Promise<User[]> => {
            const res = await fetch(`${croissantBaseUrl}/users/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Get a user by their userId.
         * @param userId The user's ID.
         * @returns The user object.
         * @throws If the user is not found.
         */
        getUser: async (userId: string): Promise<User> => {
            const res = await fetch(`${croissantBaseUrl}/users/${userId}`);
            if (!res.ok) throw new Error('User not found');
            return await res.json();
        },

        /**
         * Transfer credits to another user.
         * @param targetUserId The recipient's user ID.
         * @param amount The amount to transfer.
         * @returns A message about the transfer.
         * @throws If not authenticated or the request fails.
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
            if (!res.ok) throw new Error('Failed to transfer credits');
            return await res.json();
        },

        /**
         * Verify a user with a verification key.
         * @param userId The user ID to verify.
         * @param verificationKey The verification key.
         * @returns Success status.
         */
        verify: async (userId: string, verificationKey: string): Promise<{ success: boolean }> => {
            const res = await fetch(`${croissantBaseUrl}/users/auth-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, verificationKey })
            });
            if (!res.ok) return { success: false };
            return await res.json();
        }
    };

    // --- GAMES ---
    games = {
        /**
         * List all games visible in the store.
         * @returns Array of games.
         */
        list: async (): Promise<Game[]> => {
            const res = await fetch(`${croissantBaseUrl}/games`);
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Search for games by name, genre, or description.
         * @param query The search string.
         * @returns Array of matching games.
         */
        search: async (query: string): Promise<Game[]> => {
            const res = await fetch(`${croissantBaseUrl}/games/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Get all games created by the authenticated user.
         * @returns Array of games created by the user.
         * @throws If not authenticated.
         */
        getMyCreatedGames: async (): Promise<Game[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games/@mine`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Get all games owned by the authenticated user.
         * @returns Array of games owned by the user.
         * @throws If not authenticated.
         */
        getMyOwnedGames: async (): Promise<Game[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/games/list/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Get a game by its ID.
         * @param gameId The game ID.
         * @returns The game object.
         * @throws If the game is not found.
         */
        get: async (gameId: string): Promise<Game> => {
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`);
            if (!res.ok) throw new Error('Game not found');
            return await res.json();
        }
    };

    // --- INVENTORY ---
    inventory = {
        /**
         * Get the inventory of the authenticated user.
         * @returns The user's inventory.
         * @throws If not authenticated.
         */
        getMyInventory: async (): Promise<{ user_id: string; inventory: InventoryItem[] }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/inventory/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch inventory');
            return await res.json();
        },

        /**
         * Get the inventory of a user by userId.
         * @param userId The user ID.
         * @returns The user's inventory.
         */
        get: async (userId: string): Promise<{ user_id: string; inventory: InventoryItem[] }> => {
            const res = await fetch(`${croissantBaseUrl}/inventory/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch inventory');
            return await res.json();
        }
    };

    // --- ITEMS ---
    items = {
        /**
         * List all non-deleted items visible in the store.
         * @returns Array of items.
         */
        list: async (): Promise<Item[]> => {
            const res = await fetch(`${croissantBaseUrl}/items`);
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Get all items owned by the authenticated user.
         * @returns Array of items owned by the user.
         * @throws If not authenticated.
         */
        getMyItems: async (): Promise<Item[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/@mine`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Search for items by name (only those visible in store).
         * @param query The search string.
         * @returns Array of matching items.
         */
        search: async (query: string): Promise<Item[]> => {
            const res = await fetch(`${croissantBaseUrl}/items/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) return [];
            return await res.json();
        },

        /**
         * Get a single item by itemId.
         * @param itemId The item ID.
         * @returns The item object.
         * @throws If the item is not found.
         */
        get: async (itemId: string): Promise<Item> => {
            const res = await fetch(`${croissantBaseUrl}/items/${itemId}`);
            if (!res.ok) throw new Error('Item not found');
            return await res.json();
        },

        /**
         * Create a new item.
         * @param itemData The item data to create.
         * @returns A message about the creation.
         * @throws If not authenticated or the request fails.
         */
        create: async (itemData: { name: string; description: string; price: number; iconHash?: string; showInStore?: boolean }): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(itemData)
            });
            if (!res.ok) throw new Error('Failed to create item');
            return await res.json();
        },

        /**
         * Update an existing item.
         * @param itemId The item ID.
         * @param itemData The fields to update.
         * @returns A message about the update.
         * @throws If not authenticated or the request fails.
         */
        update: async (itemId: string, itemData: Partial<Item>): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/update/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(itemData)
            });
            if (!res.ok) throw new Error('Failed to update item');
            return await res.json();
        },

        /**
         * Delete an item by its ID.
         * @param itemId The item ID.
         * @returns A message about the deletion.
         * @throws If not authenticated or the request fails.
         */
        delete: async (itemId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/delete/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to delete item');
            return await res.json();
        },

        /**
         * Buy an item by its ID.
         * @param itemId The item ID.
         * @param amount The amount to buy.
         * @returns A message about the purchase.
         * @throws If not authenticated or the request fails.
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
            if (!res.ok) throw new Error('Failed to buy item');
            return await res.json();
        },

        /**
         * Sell an item by its ID.
         * @param itemId The item ID.
         * @param amount The amount to sell.
         * @returns A message about the sale.
         * @throws If not authenticated or the request fails.
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
            if (!res.ok) throw new Error('Failed to sell item');
            return await res.json();
        },

        /**
         * Give an item to a user.
         * @param itemId The item ID.
         * @param amount The amount to give.
         * @param userId The recipient's user ID.
         * @param metadata Optional metadata for the item instance.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        give: async (itemId: string, amount: number, userId: string, metadata?: Record<string, any>): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const body: any = { amount, userId };
            if (metadata) body.metadata = metadata;
            const res = await fetch(`${croissantBaseUrl}/items/give/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Failed to give item');
            return await res.json();
        },

        /**
         * Consume an item instance.
         * @param itemId The item ID.
         * @param params Consumption parameters (amount, uniqueId, userId).
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        consume: async (itemId: string, params: { amount?: number; uniqueId?: string; userId: string }): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/consume/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(params)
            });
            if (!res.ok) throw new Error('Failed to consume item');
            return await res.json();
        },

        /**
         * Update metadata for an item instance.
         * @param itemId The item ID.
         * @param uniqueId The unique instance ID.
         * @param metadata The new metadata.
         * @returns A message about the update.
         * @throws If not authenticated or the request fails.
         */
        updateMetadata: async (itemId: string, uniqueId: string, metadata: Record<string, any>): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/update-metadata/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ uniqueId, metadata })
            });
            if (!res.ok) throw new Error('Failed to update metadata');
            return await res.json();
        },

        /**
         * Drop an item instance from the user's inventory.
         * @param itemId The item ID.
         * @param params Drop parameters (amount, uniqueId).
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        drop: async (itemId: string, params: { amount?: number; uniqueId?: string }): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/items/drop/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(params)
            });
            if (!res.ok) throw new Error('Failed to drop item');
            return await res.json();
        }
    };

    // --- LOBBIES ---
    lobbies = {
        /**
         * Create a new lobby for the authenticated user.
         * @returns A message about the creation.
         * @throws If not authenticated or the request fails.
         */
        create: async (): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to create lobby');
            return await res.json();
        },

        /**
         * Get a lobby by its ID.
         * @param lobbyId The lobby ID.
         * @returns The lobby object.
         * @throws If the lobby is not found.
         */
        get: async (lobbyId: string): Promise<Lobby> => {
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}`);
            if (!res.ok) throw new Error('Lobby not found');
            return await res.json();
        },

        /**
         * Get the lobby the authenticated user is in.
         * @returns The lobby object.
         * @throws If not authenticated or not in a lobby.
         */
        getMyLobby: async (): Promise<Lobby> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies/user/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('User not in any lobby');
            return await res.json();
        },

        /**
         * Get the lobby a user is in by userId.
         * @param userId The user ID.
         * @returns The lobby object.
         * @throws If the user is not in a lobby.
         */
        getUserLobby: async (userId: string): Promise<Lobby> => {
            const res = await fetch(`${croissantBaseUrl}/lobbies/user/${userId}`);
            if (!res.ok) throw new Error('User not in any lobby');
            return await res.json();
        },

        /**
         * Join a lobby by its ID.
         * @param lobbyId The lobby ID.
         * @returns A message about the join operation.
         * @throws If not authenticated or the request fails.
         */
        join: async (lobbyId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to join lobby');
            return await res.json();
        },

        /**
         * Leave a lobby by its ID.
         * @param lobbyId The lobby ID.
         * @returns A message about the leave operation.
         * @throws If not authenticated or the request fails.
         */
        leave: async (lobbyId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}/leave`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to leave lobby');
            return await res.json();
        }
    };

    // --- STUDIOS ---
    studios = {
        /**
         * Create a new studio.
         * @param studioName The name of the studio.
         * @returns A message about the creation.
         * @throws If not authenticated or the request fails.
         */
        create: async (studioName: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/studios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ studioName })
            });
            if (!res.ok) throw new Error('Failed to create studio');
            return await res.json();
        },

        /**
         * Get a studio by its ID.
         * @param studioId The studio ID.
         * @returns The studio object.
         * @throws If the studio is not found.
         */
        get: async (studioId: string): Promise<Studio> => {
            const res = await fetch(`${croissantBaseUrl}/studios/${studioId}`);
            if (!res.ok) throw new Error('Studio not found');
            return await res.json();
        },

        /**
         * Get all studios the authenticated user is a member of.
         * @returns Array of studios.
         * @throws If not authenticated or the request fails.
         */
        getMyStudios: async (): Promise<Studio[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/studios/user/@me`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch studios');
            return await res.json();
        },

        /**
         * Add a user to a studio.
         * @param studioId The studio ID.
         * @param userId The user ID to add.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        addUser: async (studioId: string, userId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/studios/${studioId}/add-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error('Failed to add user to studio');
            return await res.json();
        },

        /**
         * Remove a user from a studio.
         * @param studioId The studio ID.
         * @param userId The user ID to remove.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        removeUser: async (studioId: string, userId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/studios/${studioId}/remove-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error('Failed to remove user from studio');
            return await res.json();
        }
    };

    // --- TRADES ---
    trades = {
        /**
         * Start a new trade or get the latest pending trade with a user.
         * @param userId The user ID to trade with.
         * @returns The trade object.
         * @throws If not authenticated or the request fails.
         */
        startOrGetPending: async (userId: string): Promise<Trade> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/start-or-latest/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to start or get trade');
            return await res.json();
        },

        /**
         * Get a trade by its ID.
         * @param tradeId The trade ID.
         * @returns The trade object.
         * @throws If not authenticated or the trade is not found.
         */
        get: async (tradeId: string): Promise<Trade> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/${tradeId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Trade not found');
            return await res.json();
        },

        /**
         * Get all trades for a user.
         * @param userId The user ID.
         * @returns Array of trades.
         * @throws If not authenticated or the request fails.
         */
        getUserTrades: async (userId: string): Promise<Trade[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/user/${userId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch trades');
            return await res.json();
        },

        /**
         * Add an item to a trade.
         * @param tradeId The trade ID.
         * @param tradeItem The item to add.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        addItem: async (tradeId: string, tradeItem: TradeItem): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/${tradeId}/add-item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ tradeItem })
            });
            if (!res.ok) throw new Error('Failed to add item to trade');
            return await res.json();
        },

        /**
         * Remove an item from a trade.
         * @param tradeId The trade ID.
         * @param tradeItem The item to remove.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        removeItem: async (tradeId: string, tradeItem: TradeItem): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/${tradeId}/remove-item`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ tradeItem })
            });
            if (!res.ok) throw new Error('Failed to remove item from trade');
            return await res.json();
        },

        /**
         * Approve a trade.
         * @param tradeId The trade ID.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        approve: async (tradeId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/${tradeId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to approve trade');
            return await res.json();
        },

        /**
         * Cancel a trade.
         * @param tradeId The trade ID.
         * @returns A message about the operation.
         * @throws If not authenticated or the request fails.
         */
        cancel: async (tradeId: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/trades/${tradeId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to cancel trade');
            return await res.json();
        }
    };

    // --- OAUTH2 ---
    oauth2 = {
        /**
         * Get an OAuth2 app by its client ID.
         * @param client_id The client ID.
         * @returns The OAuth2 app object.
         * @throws If the app is not found.
         */
        getApp: async (client_id: string): Promise<OAuth2App> => {
            const res = await fetch(`${croissantBaseUrl}/oauth2/app/${client_id}`);
            if (!res.ok) throw new Error('OAuth2 app not found');
            return await res.json();
        },

        /**
         * Create a new OAuth2 app.
         * @param name The app name.
         * @param redirect_urls The allowed redirect URLs.
         * @returns The new app's client ID and secret.
         * @throws If not authenticated or the request fails.
         */
        createApp: async (name: string, redirect_urls: string[]): Promise<{ client_id: string; client_secret: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/oauth2/app`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ name, redirect_urls })
            });
            if (!res.ok) throw new Error('Failed to create OAuth2 app');
            return await res.json();
        },

        /**
         * Get all OAuth2 apps owned by the authenticated user.
         * @returns Array of OAuth2 apps.
         * @throws If not authenticated or the request fails.
         */
        getMyApps: async (): Promise<OAuth2App[]> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/oauth2/apps`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch OAuth2 apps');
            return await res.json();
        },

        /**
         * Update an OAuth2 app.
         * @param client_id The client ID.
         * @param data The fields to update (name, redirect_urls).
         * @returns Success status.
         * @throws If not authenticated or the request fails.
         */
        updateApp: async (client_id: string, data: { name?: string; redirect_urls?: string[] }): Promise<{ success: boolean }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/oauth2/app/${client_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to update OAuth2 app');
            return await res.json();
        },

        /**
         * Delete an OAuth2 app by its client ID.
         * @param client_id The client ID.
         * @returns A message about the deletion.
         * @throws If not authenticated or the request fails.
         */
        deleteApp: async (client_id: string): Promise<{ message: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/oauth2/app/${client_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to delete OAuth2 app');
            return await res.json();
        },

        /**
         * Authorize a user for an OAuth2 app.
         * @param client_id The client ID.
         * @param redirect_uri The redirect URI.
         * @returns The authorization code.
         * @throws If not authenticated or the request fails.
         */
        authorize: async (client_id: string, redirect_uri: string): Promise<{ code: string }> => {
            if (!this.token) throw new Error('Token is required');
            const res = await fetch(`${croissantBaseUrl}/oauth2/authorize?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            if (!res.ok) throw new Error('Failed to authorize');
            return await res.json();
        },

        /**
         * Get a user by OAuth2 code and client ID.
         * @param code The authorization code.
         * @param client_id The client ID.
         * @returns The user object.
         * @throws If the request fails.
         */
        getUserByCode: async (code: string, client_id: string): Promise<User> => {
            const res = await fetch(`${croissantBaseUrl}/oauth2/user?code=${encodeURIComponent(code)}&client_id=${encodeURIComponent(client_id)}`);
            if (!res.ok) throw new Error('Failed to fetch user by code');
            return await res.json();
        }
    };
}

export default CroissantAPI;