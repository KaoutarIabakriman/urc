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
        
        console.log('🔐 Tentative de login pour:', username);
        
        const hash = await crypto.subtle.digest(
            'SHA-256', 
            stringToArrayBuffer(username + password)
        );
        const hashed64 = arrayBufferToBase64(hash);
        
        console.log('🔐 Hash généré:', hashed64.substring(0, 20) + '...');
        
        const client = await db.connect();
        
        try {
            // ✅ CORRECTION : Utiliser sql avec backticks corrects
            const result = await client.sql`
                SELECT * FROM users 
                WHERE username = ${username} AND password = ${hashed64}
            `;
            
            console.log('📊 Résultats trouvés:', result.rowCount);
            
            if (result.rowCount !== 1) {
                console.log('❌ Aucun utilisateur trouvé ou mot de passe incorrect');
                
                client.release();
                
                return new Response(JSON.stringify({ 
                    error: "Identifiant ou mot de passe incorrect" 
                }), {
                    status: 401,
                    headers: { 'content-type': 'application/json' },
                });
            }
            
            const user = result.rows[0];
            console.log('✅ Utilisateur trouvé:', user.username);
            
            // Mise à jour du last_login
            await client.sql`
                UPDATE users 
                SET last_login = NOW() 
                WHERE user_id = ${user.user_id}
            `;
            
            client.release();
            
            // Génération du token
            const token = crypto.randomUUID();
            
            const userSession = {
                id: user.user_id,
                username: user.username,
                email: user.email,
                externalId: user.external_id
            };
            
            console.log('💾 Stockage Redis pour token:', token.substring(0, 20) + '...');
            
            // ✅ CORRECTION : Parenthèses au lieu de backticks pour les appels de fonction
            await redis.set(`session:${token}`, JSON.stringify(userSession), { ex: 3600 });
            await redis.set(token, JSON.stringify(userSession), { ex: 3600 });
            await redis.hset("users", { [userSession.id]: JSON.stringify(userSession) });
            
            console.log('✅ Session stockée dans Redis');
            
            // Vérification
            const verify = await redis.get(`session:${token}`);
            console.log('🔍 Vérification stockage:', verify ? 'OK' : 'ÉCHEC');
            
            return new Response(JSON.stringify({
                token: token,
                user: userSession
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
            
        } catch (dbError) {
            console.error('💥 Erreur DB:', dbError);
            client.release();
            throw dbError;
        }
        
    } catch (error) {
        console.error('💥 Erreur login:', error);
        
        return new Response(JSON.stringify({
            error: "Erreur serveur",
            details: error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}