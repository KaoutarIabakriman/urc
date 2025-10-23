// api/users.js - VERSION AVEC PRÉSENCE
import { db } from '@vercel/postgres';
import { checkSession, unauthorizedResponse } from '../lib/session';

export const config = { runtime: 'edge' };

export default async function handler(request) {
    console.log('🔐 Début /api/users');

    try {
        const user = await checkSession(request);

        if (!user) {
            console.log('❌ Session invalide');
            return unauthorizedResponse();
        }

        console.log('✅ Session valide pour:', user.username);

        const client = await db.connect();

        try {
            // 🔥 METTRE À JOUR LA PRÉSENCE DE L'UTILISATEUR CONNECTÉ
            await client.sql`
                UPDATE users 
                SET last_login = NOW() 
                WHERE user_id = ${user.id}
            `;
            console.log('🟢 Présence mise à jour pour:', user.username);

            // 🔥 RÉCUPÉRER TOUS LES UTILISATEURS AVEC STATUT EN LIGNE
            const result = await client.sql`
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

            console.log(`✅ ${result.rows.length} utilisateurs récupérés`);

            // Compter les utilisateurs en ligne
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