import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';
import { arrayBufferToBase64, stringToArrayBuffer } from "../lib/base64";

export const config = {
    runtime: 'edge',
};

const redis = Redis.fromEnv();

export default async function handler(request) {
    try {
        const { username, password } = await request.json();
        
        const hash = await crypto.subtle.digest('SHA-256', stringToArrayBuffer(username + password));
        const hashed64 = arrayBufferToBase64(hash);
        
        const client = await db.connect();
        
        // ✅ CORRECTION : sq -> sql
        const { rowCount, rows } = await client.sql`
            SELECT * FROM users 
            WHERE username = ${username} AND password = ${hashed64}
        `;
        
        if (rowCount !== 1) {
            const error = { 
                code: "UNAUTHORIZED", 
                message: "Identifiant ou mot de passe incorrect" 
            };
            return new Response(JSON.stringify(error), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        } else {
            // ✅ CORRECTION : sq -> sql
            await client.sql`
                UPDATE users 
                SET last_login = NOW() 
                WHERE user_id = ${rows[0].user_id}
            `;
            
            const token = crypto.randomUUID().toString();
            const user = {
                id: rows[0].user_id,
                username: rows[0].username,
                email: rows[0].email,
                externalId: rows[0].external_id
            };
            
            console.log('💾 Stockage Redis pour token:', token.substring(0, 20) + '...');
            
            await redis.set(`session:${token}`, JSON.stringify(user), { ex: 3600 });
            console.log('Stocké avec clé: session:' + token.substring(0, 20) + '...');
            
            await redis.set(token, JSON.stringify(user), { ex: 3600 });
            console.log('Stocké avec clé: ' + token.substring(0, 20) + '...');
            
            await redis.hset("users", { [user.id]: JSON.stringify(user) });
            console.log('Stocké dans hash users');
            
            // Vérification
            const verify1 = await redis.get(`session:${token}`);
            const verify2 = await redis.get(token);
            console.log('Vérification session: préfixe:', verify1 ? 'SUCCÈS' : 'ÉCHEC');
            console.log('Vérification sans préfixe:', verify2 ? 'SUCCÈS' : 'ÉCHEC');
            
            if (!verify1 && !verify2) {
                console.log('CRITIQUE: Aucun stockage réussi!');
            } else {
                console.log('Stockage Redis confirmé');
            }
            
            return new Response(JSON.stringify({
                token: token,
                user: user
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }
    } catch (error) {
        console.error('Erreur login:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur serveur"
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}