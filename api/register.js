import { sql } from '@vercel/postgres';
import { Redis } from '@upstash/redis';

export const config = {
    runtime: 'nodejs', // ✅ Changed from 'edge'
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
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
            status: 405,
            headers: { 'content-type': 'application/json' },
        });
    }

    try {
        const { username, email, password } = await request.json();

        console.log('📨 Inscription demandée pour:', username, email);

        if (!username || !email || !password) {
            return new Response(JSON.stringify({
                error: 'Données manquantes'
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (password.length < 6) {
            return new Response(JSON.stringify({
                error: 'Le mot de passe doit contenir au moins 6 caractères'
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const hashedPassword = await hashPassword(username, password);
        console.log('🔐 Mot de passe haché:', hashedPassword.substring(0, 20) + '...');

        const externalId = crypto.randomUUID();

        // Check if user exists
        const checkUser = await sql`
            SELECT user_id FROM users
            WHERE username = ${username} OR email = ${email}
        `;

        if (checkUser.rows.length > 0) {
            console.log('❌ Utilisateur déjà existant');
            return new Response(JSON.stringify({
                error: 'Utilisateur ou email déjà existant'
            }), {
                status: 409,
                headers: { 'content-type': 'application/json' },
            });
        }

        // Insert new user
        const result = await sql`
            INSERT INTO users (username, email, password, created_on, external_id)
            VALUES (${username}, ${email}, ${hashedPassword}, NOW(), ${externalId})
            RETURNING user_id, username, email, external_id
        `;

        const newUser = result.rows[0];
        console.log('✅ Utilisateur créé:', newUser);

        const token = crypto.randomUUID();

        const user = {
            id: newUser.user_id,
            username: newUser.username,
            email: newUser.email,
            externalId: newUser.external_id
        };

        // Store session in Redis
        await redis.set(`session:${token}`, JSON.stringify(user), { ex: 3600 });
        await redis.set(token, JSON.stringify(user), { ex: 3600 });
        await redis.hset("users", { [user.id]: JSON.stringify(user) });

        console.log('✅ Session créée');

        return new Response(JSON.stringify({
            user: {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email
            },
            token: token
        }), {
            status: 201,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error('💥 Erreur inscription:', error);
        console.error('💥 Stack:', error.stack);
        return new Response(JSON.stringify({
            error: "Erreur lors de l'inscription",
            details: error.message || String(error)
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}