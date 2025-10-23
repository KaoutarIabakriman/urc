// api/conversations.js
import { db } from '@vercel/postgres';
import { checkSession } from '../lib/session';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    try {
        const user = await checkSession(request);
        if (!user) {
            return new Response(JSON.stringify({
                code: "UNAUTHORIZED",
                message: "Non autorisé"
            }), {
                status: 401,
                headers: { 'content-type': 'application/json' },
            });
        }

        console.log('🔍 Récupération des conversations pour user:', user.id);

        const client = await db.connect();

        // Récupérer les conversations avec le dernier message
        const { rows } = await client.sql`
            SELECT
                c.id,
                c.user1_id,
                c.user2_id,
                c.created_at,
                u1.username as user1_username,
                u2.username as user2_username,
                last_msg.content as last_message,
                last_msg.created_at as last_message_time
            FROM conversations c
                     JOIN users u1 ON c.user1_id = u1.user_id
                     JOIN users u2 ON c.user2_id = u2.user_id
                     LEFT JOIN LATERAL (
                SELECT content, created_at
                FROM messages
                WHERE conversation_id = c.id
                ORDER BY created_at DESC
                    LIMIT 1
            ) last_msg ON true
            WHERE c.user1_id = ${user.id} OR c.user2_id = ${user.id}
            ORDER BY c.created_at DESC
        `;

        console.log(`📨 ${rows.length} conversations trouvées en base`);

        const conversations = rows.map(row => {
            const otherUser = row.user1_id.toString() === user.id ? {
                id: row.user2_id.toString(),
                username: row.user2_username
            } : {
                id: row.user1_id.toString(),
                username: row.user1_username
            };

            return {
                id: `conversation_${row.id}`,
                name: otherUser.username,
                type: 'private',
                last_message: row.last_message || 'Aucun message',
                last_message_time: new Date(row.last_message_time || row.created_at),
                unread_count: 0,
                target_user_id: otherUser.id
            };
        });

        console.log(`✅ ${conversations.length} conversations formatées`);

        return new Response(JSON.stringify(conversations), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error('❌ Erreur récupération conversations:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur lors de la récupération des conversations: " + error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}