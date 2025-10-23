import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';
import {arrayBufferToBase64, stringToArrayBuffer} from "../lib/base64";

export const config = {
    runtime: 'edge',
};

const redis = Redis.fromEnv();

export default async function handler(request) {
    try {
        const {username, password} = await request.json();
        const hash = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hash);

        const client = await db.connect();
        const {rowCount, rows} = await client.sql`select * from users where username = ${username} and password = ${hashed64}`;

        if (rowCount !== 1) {
            const error = {code: "UNAUTHORIZED", message: "Identifiant ou mot de passe incorrect"};
            return new Response(JSON.stringify(error), {
                status: 401,
                headers: {'content-type': 'application/json'},
            });
        } else {
            await client.sql`update users set last_login = now() where user_id = ${rows[0].user_id}`;
            const token = crypto.randomUUID().toString();
            const user = {
                id: rows[0].user_id,
                username: rows[0].username,
                email: rows[0].email,
                externalId: rows[0].external_id
            };

            console.log('ðŸ’¾ Stockage Redis pour token:', token.substring(0, 20) + '...');

            await redis.set(`session:${token}`, JSON.stringify(user), { ex: 3600 });
            console.log('StockÃ© avec clÃ©: session:' + token.substring(0, 20) + '...');

            await redis.set(token, JSON.stringify(user), { ex: 3600 });
            console.log('StockÃ© avec clÃ©: ' + token.substring(0, 20) + '...');

            await redis.hset("users", { [user.id]: JSON.stringify(user) });
            console.log('StockÃ© dans hash users');

            console.log('VÃ©rification immÃ©diate du stockage...');
            const verify1 = await redis.get(`session:${token}`);
            const verify2 = await redis.get(token);

            console.log('VÃ©rification session: prÃ©fixe:', verify1 ? 'SUCCÃˆS' : 'Ã‰CHEC');
            console.log('VÃ©rification sans prÃ©fixe:', verify2 ? 'SUCCÃˆS' : 'Ã‰CHEC');

            if (!verify1 && !verify2) {
                console.log('CRITIQUE: Aucun stockage rÃ©ussi!');
            } else {
                console.log('Stockage Redis confirmÃ©');
            }

            return new Response(JSON.stringify({
                token: token,
                user: user
            }), {
                status: 200,
                headers: {'content-type': 'application/json'},
            });
        }
    } catch (error) {
        console.error('Erreur login:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur serveur"
        }), {
            status: 500,
            headers: {'content-type': 'application/json'},
        });
    }
}