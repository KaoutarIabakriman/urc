import { db } from '@vercel/postgres';
import { Redis } from '@upstash/redis';

export const config = {
    runtime: 'edge',
};

const redis = Redis.fromEnv();

// ✅ MÊMES FONCTIONS QUE REGISTER.TS
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
    let client;
    
    try {
        const { username, password } = await request.json();
        
        console.log('🔐 Tentative de login pour:', username);
        
        // Hash le mot de passe avec la MÊME méthode que register
        const hashedPassword = await hashPassword(username, password);
        console.log('🔐 Hash généré:', hashedPassword.substring(0, 20) + '...');
        
        client = await db.connect();
        
        // Recherche l'utilisateur
        const result = await client.sql`
            SELECT * FROM users 
            WHERE username = ${username}
        `;
        
        console.log('📊 Utilisateurs trouvés:', result.rowCount);
        
        if (result.rowCount === 0) {
            console.log('❌ Utilisateur non trouvé');
            return new Response(JSON.stringify({ 
                error: "Identifiant ou mot de passe incorrect" 
            }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }
        
        const user = result.rows[0];
        console.log('🔍 Hash stocké en DB:', user.password.substring(0, 20) + '...');
        console.log('🔍 Hash fourni:', hashedPassword.substring(0, 20) + '...');
        console.log('🔍 Match:', user.password === hashedPassword ? '✅ OUI' : '❌ NON');
        
        // Vérifie le mot de passe
        if (user.password !== hashedPassword) {
            console.log('❌ Mot de passe incorrect');
            return new Response(JSON.stringify({ 
                error: "Identifiant ou mot de passe incorrect" 
            }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }
        
        console.log('✅ Authentification réussie pour:', user.username);
        
        // Mise à jour du last_login
        await client.sql`
            UPDATE users 
            SET last_login = NOW() 
            WHERE user_id = ${user.user_id}
        `;
        
        // Génération du token
        const token = crypto.randomUUID();
        
        const userSession = {
            id: user.user_id,
            username: user.username,
            email: user.email,
            externalId: user.external_id
        };
        
        console.log('💾 Stockage session Redis...');
        
        // Stockage dans Redis
        await redis.set(`session:${token}`, JSON.stringify(userSession), { ex: 3600 });
        await redis.set(token, JSON.stringify(userSession), { ex: 3600 });
        await redis.hset("users", { [userSession.id]: JSON.stringify(userSession) });
        
        console.log('✅ Session créée avec succès');
        
        return new Response(JSON.stringify({
            token: token,
            user: userSession
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
        
    } catch (error) {
        console.error('💥 Erreur login:', error);
        return new Response(JSON.stringify({
            error: "Erreur serveur",
            details: error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    } finally {
        if (client) {
            client.release();
        }
    }
}