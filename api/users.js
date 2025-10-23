// api/users.js - VERSION CORRIGÉE
import { db } from '@vercel/postgres';
import { checkSession, unauthorizedResponse } from '../lib/session';

export const config = { runtime: 'edge' };

export default async function handler(request) {
    console.log('🔐 Début /api/users');

    try {
        // 🔥 UTILISER LA FONCTION IMPORTÉE (pas de JSON.parse ici)
        const user = await checkSession(request);

        if (!user) {
            console.log('❌ Session invalide');
            return unauthorizedResponse();
        }

        console.log('✅ Session valide pour:', user.username);

        const client = await db.connect();

        try {
            const result = await client.sql`
                SELECT 
                    user_id AS id,
                    username,
                    email,
                    external_id,
                    last_login AS last_connection
                FROM users
                ORDER BY username
            `;

            console.log(`✅ ${result.rows.length} utilisateurs récupérés`);

            return new Response(JSON.stringify(result.rows), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'cache-control': 'no-cache'
                }
            });

        } catch (dbError) {
            console.error('❌ Erreur DB:', dbError);
            return new Response(JSON.stringify({ error: 'Erreur base de données' }), {
                status: 500,
                headers: { 'content-type': 'application/json' }
            });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('💥 Erreur API /users:', error);
        return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}