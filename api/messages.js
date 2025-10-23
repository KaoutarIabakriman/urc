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

        const url = new URL(request.url);
        const targetUserId = url.searchParams.get('targetUserId');
        const type = url.searchParams.get('type') || 'private';

        if (!targetUserId) {
            return new Response(JSON.stringify({
                code: "MISSING_PARAMS",
                message: "Paramètre targetUserId manquant"
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const client = await db.connect();

        console.log('Recherche conversation entre:', user.id, 'et', targetUserId);

        const { rows: conversationRows } = await client.sql`
            SELECT id FROM conversations
            WHERE (user1_id = ${user.id} AND user2_id = ${targetUserId})
               OR (user1_id = ${targetUserId} AND user2_id = ${user.id})
        `;
        if (conversationRows.length === 0) {
            console.log('Aucune conversation trouvée - Nouvelle conversation');
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        const conversationId = conversationRows[0].id;
        console.log(' Conversation trouvée:', conversationId);

        let messageRows;
        try {
            const result = await client.sql`
                SELECT
                    m.id,
                    m.conversation_id,
                    m.sender_id,
                    m.content,
                    m.created_at,
                    u.username as sender_username
                FROM messages m
                         JOIN users u ON m.sender_id = u.user_id
                WHERE m.conversation_id = ${conversationId}
                ORDER BY m.created_at ASC
            `;
            messageRows = result.rows;
        } catch (error) {
            console.error('Erreur récupération messages:', error);
            messageRows = [];
        }

        const messages = messageRows.map(row => ({
            id: row.id.toString(),
            content: row.content,
            sender_id: row.sender_id.toString(),
            sender_username: row.sender_username,
            timestamp: new Date(row.created_at),
            conversation_id: `conversation_${row.conversation_id}`,
            type: 'private'
        }));

        console.log(`${messages.length} messages récupérés depuis PostgreSQL`);

        return new Response(JSON.stringify(messages), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error(' Erreur récupération messages PostgreSQL:', error);
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });
    }
}