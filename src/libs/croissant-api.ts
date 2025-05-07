const croissantBaseUrl = 'https://croissant-api.fr/api';

export interface IUser {
    userId: string;
    username: string;
    balance: number;
}

export interface IUserCreateOptions {
    userId: string;
    username: string;
    balance: number;
}

export interface IUserResponse {
    message: string;
    error?: string;
}

export interface IItem {
    itemId: string;
    price: number;
    name: string;
    emoji?: string;
    type?: string;
    amount?: number;
    description?: string;
}

export interface IItemFetchOptions {
    itemId?: string;
}

export interface IGame {
    id: number;
    gameId: string;
    name: string;
    description: string;
    price: number;
    ownerId: string;
    showInStore: boolean;
}

export interface IGameCreateOptions {
    name: string;
    description: string;
    price: number;
    showInStore: boolean;
}

export interface IGameUpdateOptions {
    name?: string;
    description?: string;
    price?: number;
    showInStore?: boolean;
}

export interface IGameResponse {
    message: string;
    error?: string;
}

export interface ILobby {
    id: number;
    users: string[];
}

export interface ILobbyCreateOptions {
    users: string[];
}

export interface ILobbyResponse {
    message: string;
    error?: string;
}


// --- Classe API organisée par catégories ---
class CroissantAPI {
    static users = {
        async create(options: IUserCreateOptions): Promise<IUserResponse> {
            const res = await fetch(`${croissantBaseUrl}/users/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });
            return await res.json();
        },
        async get(userId: string): Promise<IUser | null> {
            const res = await fetch(`${croissantBaseUrl}/users/${userId}`);
            if (!res.ok) return null;
            return await res.json();
        },
        async verify(userId: string, verificationKey: string): Promise<{ success: boolean }> {
            const res = await fetch(
                `${croissantBaseUrl}/users/auth-verification?userId=${encodeURIComponent(userId)}&verificationKey=${encodeURIComponent(verificationKey)}`,
                { method: 'POST' }
            );
            if (!res.ok) throw new Error('Failed to verify user');
            return await res.json();
        }
    };

    static items = {
        async get(options: IItemFetchOptions = {}): Promise<IItem[] | IItem> {
            const res = await fetch(`${croissantBaseUrl}/items${options.itemId ? `/${options.itemId}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch items');
            return await res.json();
        }
    };

    static inventory = {
        async get(userId: string): Promise<IItem[]> {
            const res = await fetch(`${croissantBaseUrl}/inventory/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch inventory');
            return await res.json();
        }
    };

    static games = {
        async list(): Promise<IGame[]> {
            const res = await fetch(`${croissantBaseUrl}/games`);
            if (!res.ok) throw new Error('Failed to fetch games');
            return await res.json();
        },
        async get(gameId: string): Promise<IGame | null> {
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`);
            if (!res.ok) return null;
            return await res.json();
        },
        async create(options: IGameCreateOptions, token: string): Promise<IGameResponse> {
            const res = await fetch(`${croissantBaseUrl}/games`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(options)
            });
            return await res.json();
        },
        async update(gameId: string, options: IGameUpdateOptions): Promise<IGameResponse> {
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });
            return await res.json();
        },
        async delete(gameId: string): Promise<IGameResponse> {
            const res = await fetch(`${croissantBaseUrl}/games/${gameId}`, {
                method: 'DELETE'
            });
            return await res.json();
        }
    };

    static lobbies = {
        async get(lobbyId: string): Promise<ILobby | null> {
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}`);
            if (!res.ok) return null;
            return await res.json();
        },
        async getUserLobby(userId: string): Promise<ILobby | null> {
            const res = await fetch(`${croissantBaseUrl}/lobbies/user/${userId}`);
            if (!res.ok) return null;
            return await res.json();
        },
        async create(options: ILobbyCreateOptions): Promise<ILobbyResponse> {
            const res = await fetch(`${croissantBaseUrl}/lobbies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });
            return await res.json();
        },
        async join(lobbyId: string, userId: string): Promise<ILobbyResponse> {
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return await res.json();
        },
        async leave(lobbyId: string, userId: string): Promise<ILobbyResponse> {
            const res = await fetch(`${croissantBaseUrl}/lobbies/${lobbyId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
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