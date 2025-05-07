import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({path: path.join(__dirname, ".env")});

export function genKey(userId: string): string {
    if (!userId) throw new Error('userId is required for key generation');
    return crypto.createHash('md5').update(userId + userId + process.env.HASH_SECRET).digest('hex');
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const emojis = {
  credits : "<:credit:1369444764906164316>",
}