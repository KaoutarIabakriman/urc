import { sql } from '@vercel/postgres';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const config = { 
    runtime: 'edge' 
};

async function getUserSession(token) {
    try {
        if (!token) return null;
        
        const userData = await redis.get(`session:${token}`);
        
        if (userData && typeof userData === 'object') {
            return userData;
        }
        
        if (typeof userData === 'string') {
            try {
                return JSON.parse(userData);
            } catch {
                return null;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Erreur récupération session:', error);
        return null;
    }
}

async function checkSession(request) {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        
        const token = authHeader.substring(7);
        
        if (!token) {
            return null;
        }
        
        const userSession = await getUserSession(token);
        
        if (!userSession) {
            return null;
        }
        
        console.log('Session valide pour:', userSession.username);
        return userSession;
    } catch (error) {
        console.error('Erreur vérification session:', error);
        return null;
    }
}

export default async function handler(request) {
    console.log('Début /api/users');
    
    try {
        const user = await checkSession(request);
        
        if (!user) {
            console.log('Session invalide');
            return new Response(JSON.stringify({ error: 'Non autorisé' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        console.log('Session valide pour:', user.username, 'ID:', user.id);
        
        const startTime = Date.now();
        
        try {
            await sql`
                UPDATE users 
                SET last_login = NOW() 
                WHERE user_id = ${user.id}
            `;
            
            console.log('Présence mise à jour pour:', user.username);
            
            const result = await sql`
                SELECT 
                    user_id AS id,
                    username,
                    email,
                    external_id,
                    last_login AS last_connection,
                    CASE 
                        WHEN last_login > NOW() - INTERVAL '2 minutes' THEN true
                        ELSE false
                    END AS is_online
                FROM users
                ORDER BY username
            `;
            
            const onlineCount = result.rows.filter(u => u.is_online).length;
            console.log(`${result.rows.length} utilisateurs récupérés`);
            console.log(`${onlineCount} utilisateurs en ligne`);
            
            // Retourner rapidement
            return new Response(JSON.stringify(result.rows), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
            
        } catch (dbError) {
            console.error('Erreur DB:', dbError);
            return new Response(JSON.stringify({ 
                error: 'Erreur base de données',
                details: dbError.message 
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('Erreur API /users:', error);
        return new Response(JSON.stringify({ 
            error: 'Erreur serveur',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}