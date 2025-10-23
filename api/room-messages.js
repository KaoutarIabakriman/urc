// api/room-messages.js
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

        const client = await db.connect();

        if (request.method === 'POST') {
            const { roomId, content } = await request.json();

            if (!roomId || !content) {
                return new Response(JSON.stringify({
                    code: "MISSING_FIELDS",
                    message: "RoomId et contenu requis"
                }), {
                    status: 400,
                    headers: { 'content-type': 'application/json' },
                });
            }

            // 🔥 PAS BESOIN DE VÉRIFIER LE MEMBERSHIP - ACCÈS AUTOMATIQUE
            // Insérer le message directement
            const { rows: messageRows } = await client.sql`
                INSERT INTO room_messages (room_id, user_id, content)
                VALUES (${roomId}, ${user.id}, ${content})
                RETURNING message_id, room_id, user_id, content, created_at
            `;

            const message = messageRows[0];

            const responseMessage = {
                id: message.message_id.toString(),
                content: message.content,
                sender_id: message.user_id.toString(),
                sender_username: user.username,
                timestamp: new Date(message.created_at),
                room_id: roomId.toString(),
                type: 'room'
            };

            return new Response(JSON.stringify({
                success: true,
                message: responseMessage
            }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });

        } else if (request.method === 'GET') {
            const { searchParams } = new URL(request.url);
            const roomId = searchParams.get('roomId');

            if (!roomId) {
                return new Response(JSON.stringify({
                    code: "MISSING_ROOM_ID",
                    message: "RoomId requis"
                }), {
                    status: 400,
                    headers: { 'content-type': 'application/json' },
                });
            }

            // 🔥 PAS BESOIN DE VÉRIFIER LE MEMBERSHIP - ACCÈS AUTOMATIQUE
            // Récupérer les messages directement
            const { rows: messages } = await client.sql`
                SELECT 
                    rm.message_id,
                    rm.content,
                    rm.user_id,
                    u.username,
                    rm.created_at,
                    rm.room_id
                FROM room_messages rm
                JOIN users u ON rm.user_id = u.user_id
                WHERE rm.room_id = ${roomId}
                ORDER BY rm.created_at ASC
            `;

            const formattedMessages = messages.map(msg => ({
                id: msg.message_id.toString(),
                content: msg.content,
                sender_id: msg.user_id.toString(),
                sender_username: msg.username,
                timestamp: msg.created_at,
                room_id: msg.room_id.toString(),
                type: 'room'
            }));

            return new Response(JSON.stringify(formattedMessages), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });

        } else {
            return new Response(JSON.stringify({
                code: "METHOD_NOT_ALLOWED",
                message: "Méthode non autorisée"
            }), {
                status: 405,
                headers: { 'content-type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('❌ Erreur messages salon:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur serveur: " + error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}