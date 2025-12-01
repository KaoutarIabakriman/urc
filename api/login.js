import { sql } from '@vercel/postgres';
import { Redis } from '@upstash/redis';

export const config = {
    runtime:  'edge', 
};

const redis = Redis.fromEnv();

function stringToArrayBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function hashPassword(username, password) {
    const hash = await crypto.subtle.digest(
        'SHA-256',
        stringToArrayBuffer(username + password)
    );
    return arrayBufferToBase64(hash);
}

export default async function handler(request) {
    try {
        const { username, password } = await request.json();
        console.log('🔐 Tentative de login pour:', username);

        const hashedPassword = await hashPassword(username, password);
        console.log('🔐 Hash généré:', hashedPassword.substring(0, 20) + '...');

        const result = await sql`
            SELECT * FROM users 
            WHERE username = ${username}
        `;

        console.log('Utilisateurs trouvés:', result.rowCount);

        if (result.rowCount === 0) {
            console.log('Utilisateur non trouvé');
            return new Response(JSON.stringify({ 
                error: "Identifiant ou mot de passe incorrect" 
            }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        const user = result.rows[0];
        console.log('Hash stocké:', user.password.substring(0, 20) + '...');
        console.log('Hash fourni:', hashedPassword.substring(0, 20) + '...');
        console.log('Match:', user.password === hashedPassword ? 'OUI' : 'NON');

        if (user.password !== hashedPassword) {
            console.log('Mot de passe incorrect');
            return new Response(JSON.stringify({ 
                error: "Identifiant ou mot de passe incorrect" 
            }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        console.log('Authentification réussie');

        await sql`
            UPDATE users 
            SET last_login = NOW() 
            WHERE user_id = ${user.user_id}
        `;

        const token = crypto.randomUUID();
        const userSession = {
            id: user.user_id,
            username: user.username,
            email: user.email,
            externalId: user.external_id
        };

        await redis.set(`session:${token}`, JSON.stringify(userSession), { ex: 3600 });
        await redis.set(token, JSON.stringify(userSession), { ex: 3600 });
        await redis.hset("users", { [userSession.id]: JSON.stringify(userSession) });

        console.log('Session créée');

        return new Response(JSON.stringify({
            token: token,
            user: userSession
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    } catch (error) {
        console.error('Erreur login:', error);
        return new Response(JSON.stringify({
            error: "Erreur serveur",
            details: error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}