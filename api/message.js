import { db } from '@vercel/postgres';
import { checkSession } from '../lib/session';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    console.log('=== DÉBUT REQUÊTE MESSAGE (SANS IMAGES) ===');
    console.log('Method:', request.method);
    console.log('Content-Type:', request.headers.get('content-type'));

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

        let body;
        try {
            body = await request.json();
        } catch (error) {
            return new Response(JSON.stringify({
                code: "INVALID_REQUEST",
                message: "Format de requête invalide"
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const content = body.content || '';
        const targetUserId = body.targetUserId;
        const type = body.type || 'private';

        if (!targetUserId) {
            return new Response(JSON.stringify({
                code: "MISSING_FIELDS",
                message: "Destinataire requis"
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (!content.trim()) {
            return new Response(JSON.stringify({
                code: "MISSING_FIELDS",
                message: "Contenu du message requis"
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const client = await db.connect();

        const { rows: existingConversation } = await client.sql`
            SELECT id FROM conversations
            WHERE (user1_id = ${user.id} AND user2_id = ${targetUserId})
               OR (user1_id = ${targetUserId} AND user2_id = ${user.id})
        `;

        let conversationId;

        if (existingConversation.length > 0) {
            conversationId = existingConversation[0].id;
        } else {
            const { rows: newConversation } = await client.sql`
                INSERT INTO conversations (user1_id, user2_id)
                VALUES (${user.id}, ${targetUserId})
                RETURNING id
            `;
            conversationId = newConversation[0].id;
        }

        // ✅ Insertion message SANS image_data
        const result = await client.sql`
            INSERT INTO messages (conversation_id, sender_id, content, message_type)
            VALUES (${conversationId}, ${user.id}, ${content}, ${type})
                RETURNING *
        `;

        await client.sql`
            UPDATE conversations
            SET updated_at = NOW()
            WHERE id = ${conversationId}
        `;

        const message = result.rows[0];

        return new Response(JSON.stringify({
            success: true,
            message: {
                id: message.id.toString(),
                content: message.content,
                sender_id: message.sender_id.toString(),
                sender_username: user.username,
                timestamp: message.created_at,
                conversation_id: `conversation_${conversationId}`,
                type
            }
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error('❌ Erreur API Message:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur interne: " + error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
