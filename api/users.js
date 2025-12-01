import { sql } from '@vercel/postgres';
import { checkSession, unauthorizedResponse } from '../lib/session';

export const config = { 
    runtime: 'nodejs' // ✅ Changed from 'edge'
};

export default async function handler(request) {
    console.log('🔐 Début /api/users');
    
    try {
        const user = await checkSession(request);
        
        if (!user) {
            console.log('❌ Session invalide');
            return unauthorizedResponse();
        }
        
        console.log('✅ Session valide pour:', user.username);
        
        try {
            // Update last login
            await sql`
                UPDATE users 
                SET last_login = NOW() 
                WHERE user_id = ${user.id}
            `;
            
            console.log('🟢 Présence mise à jour pour:', user.username);
            
            // Get all users with online status
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
            
            console.log(`📊 ${result.rows.length} utilisateurs récupérés`);
            
            const onlineCount = result.rows.filter(u => u.is_online).length;
            console.log(`🟢 ${onlineCount} utilisateurs en ligne`);
            
            return new Response(JSON.stringify(result.rows), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'cache-control': 'no-cache, no-store, must-revalidate'
                }
            });
            
        } catch (dbError) {
            console.error('💥 Erreur DB:', dbError);
            return new Response(JSON.stringify({ 
                error: 'Erreur base de données',
                details: dbError.message 
            }), {
                status: 500,
                headers: { 'content-type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('💥 Erreur API /users:', error);
        return new Response(JSON.stringify({ 
            error: 'Erreur serveur',
            details: error.message 
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}