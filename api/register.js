import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';

// 🔥 CONFIGURATION EDGE RUNTIME (comme login.js)
export const config = {
    runtime: 'edge',
};

const redis = Redis.fromEnv();

// Fonction pour générer un UUID (compatible Edge)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Fonction pour convertir string en ArrayBuffer
function stringToArrayBuffer(str) {
    const encoder = new TextEncoder();
    return encoder.encode(str);
}

// Fonction pour convertir ArrayBuffer en Base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// 🔥 HACHAGE IDENTIQUE À LOGIN.JS
async function hashPassword(username, password) {
    const hash = await crypto.subtle.digest(
        'SHA-256',
        stringToArrayBuffer(username + password)
    );
    return arrayBufferToBase64(hash);
}

export default async function handler(request) {
    // Vérifier la méthode
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
            status: 405,
            headers: { 'content-type': 'application/json' },
        });
    }

    try {
        // Parser le JSON
        const { username, email, password } = await request.json();

        console.log('📨 Inscription demandée pour:', username);

        // Validation des données
        if (!username || !email || !password) {
            return new Response(JSON.stringify({
                error: 'Données manquantes',
                received: { username: !!username, email: !!email, password: !!password }
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

        // 🔥 HACHER LE MOT DE PASSE
        const hashedPassword = await hashPassword(username, password);
        console.log('🔐 Mot de passe haché:', hashedPassword.substring(0, 20) + '...');

        const client = await db.connect();

        try {
            const externalId = generateUUID();
            console.log('🆔 External ID généré:', externalId);

            // Vérifier si l'utilisateur existe déjà
            const checkUser = await client.sql`
                SELECT user_id FROM users
                WHERE username = ${username} OR email = ${email}
            `;

            if (checkUser.rows.length > 0) {
                client.release();
                return new Response(JSON.stringify({
                    error: 'Utilisateur ou email déjà existant'
                }), {
                    status: 409,
                    headers: { 'content-type': 'application/json' },
                });
            }

            // 🔥 INSÉRER L'UTILISATEUR AVEC MOT DE PASSE HACHÉ
            const result = await client.sql`
                INSERT INTO users (username, email, password, created_on, external_id)
                VALUES (${username}, ${email}, ${hashedPassword}, NOW(), ${externalId})
                    RETURNING user_id, username, email, external_id
            `;

            if (!result.rows || result.rows.length === 0) {
                throw new Error('Aucun utilisateur créé');
            }

            const newUser = result.rows[0];
            console.log('✅ Utilisateur créé:', newUser);

            // Générer un token (compatible Edge)
            const token = crypto.randomUUID().toString();
            console.log('🔑 Token généré:', token.substring(0, 20) + '...');

            // Créer l'objet utilisateur
            const user = {
                id: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
                externalId: newUser.external_id
            };

            // 🔥 STOCKER LA SESSION DANS REDIS (comme login.js)
            console.log('💾 Stockage Redis pour token:', token.substring(0, 20) + '...');

            await redis.set(`session:${token}`, JSON.stringify(user), { ex: 3600 });
            await redis.set(token, JSON.stringify(user), { ex: 3600 });
            await redis.hset("users", { [user.id]: JSON.stringify(user) });

            console.log('✅ Session stockée dans Redis');

            client.release();

            // Réponse finale
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

        } catch (dbError) {
            console.error('❌ Erreur DB:', dbError);

            if (client) {
                client.release();
            }

            if (dbError.code === '23505') {
                return new Response(JSON.stringify({
                    error: 'Utilisateur ou email déjà existant'
                }), {
                    status: 409,
                    headers: { 'content-type': 'application/json' },
                });
            }

            return new Response(JSON.stringify({
                error: "Erreur base de données",
                details: dbError.message
            }), {
                status: 500,
                headers: { 'content-type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('💥 Erreur générale register:', error);

        return new Response(JSON.stringify({
            error: "Erreur lors de l'inscription",
            details: error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}