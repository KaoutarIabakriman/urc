// api/message.js - VERSION CORRIGÉE
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

        const { content, targetUserId, type = 'private' } = await request.json();

        if (!content || !targetUserId) {
            return new Response(JSON.stringify({
                code: "MISSING_FIELDS",
                message: "Contenu et destinataire requis"
            }), {
                status: 400,
                headers: { 'content-type': 'application/json' },
            });
        }

        const client = await db.connect();

        // 1. Trouver ou créer la conversation
        console.log('🔍 Recherche/Création conversation...');

        // Vérifier d'abord si la conversation existe dans les deux sens
        const { rows: existingConversation } = await client.sql`
            SELECT id FROM conversations
            WHERE (user1_id = ${user.id} AND user2_id = ${targetUserId})
               OR (user1_id = ${targetUserId} AND user2_id = ${user.id})
        `;

        let conversationId;

        if (existingConversation.length > 0) {
            conversationId = existingConversation[0].id;
            console.log('✅ Conversation existante trouvée:', conversationId);
        } else {
            // Créer une nouvelle conversation
            console.log('➕ Création nouvelle conversation...');
            const { rows: newConversation } = await client.sql`
                INSERT INTO conversations (user1_id, user2_id)
                VALUES (${user.id}, ${targetUserId})
                    RETURNING id
            `;
            conversationId = newConversation[0].id;
            console.log('✅ Nouvelle conversation créée:', conversationId);
        }

        // 2. Insérer le message (avec gestion de la colonne message_type)
        console.log('💬 Insertion du message...');

        try {
            // Essayer d'abord avec message_type
            const { rows: messageRows } = await client.sql`
                INSERT INTO messages (conversation_id, sender_id, content, message_type) 
                VALUES (${conversationId}, ${user.id}, ${content}, ${type})
                RETURNING id, conversation_id, sender_id, content, created_at
            `;
            console.log('✅ Message inséré avec message_type');
        } catch (error) {
            // Si message_type n'existe pas, insérer sans
            console.log('⚠️ Colonne message_type manquante, insertion sans...');
            const { rows: messageRows } = await client.sql`
                INSERT INTO messages (conversation_id, sender_id, content) 
                VALUES (${conversationId}, ${user.id}, ${content})
                RETURNING id, conversation_id, sender_id, content, created_at
            `;
            console.log('✅ Message inséré sans message_type');
        }

        // 3. Mettre à jour updated_at de la conversation (si la colonne existe)
        try {
            await client.sql`
                UPDATE conversations 
                SET updated_at = NOW() 
                WHERE id = ${conversationId}
            `;
            console.log('✅ Conversation mise à jour avec updated_at');
        } catch (error) {
            console.log('⚠️ Colonne updated_at manquante, continuation sans...');
        }

        // 4. Récupérer le dernier message inséré
        const { rows: messageRows } = await client.sql`
            SELECT id, conversation_id, sender_id, content, created_at
            FROM messages 
            WHERE conversation_id = ${conversationId}
            ORDER BY created_at DESC 
            LIMIT 1
        `;

        const message = messageRows[0];

        // 5. Formater la réponse
        const responseMessage = {
            id: message.id.toString(),
            content: message.content,
            sender_id: message.sender_id.toString(),
            sender_username: user.username,
            timestamp: new Date(message.created_at),
            conversation_id: `conversation_${conversationId}`,
            type: type
        };

        console.log('✅ Message sauvegardé en base:', responseMessage);

        return new Response(JSON.stringify({
            success: true,
            message: responseMessage
        }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error('❌ Erreur envoi message PostgreSQL:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur lors de l'envoi du message: " + error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}