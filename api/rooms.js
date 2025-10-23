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

        if (request.method === 'GET') {
            const { rows: userRooms } = await client.sql`
                SELECT 
                    r.room_id,
                    r.name,
                    r.created_on,
                    r.created_by,
                    COUNT(rm.user_id) as member_count
                FROM rooms r
                JOIN room_members rm ON r.room_id = rm.room_id
                WHERE r.room_id IN (
                    SELECT room_id FROM room_members WHERE user_id = ${user.id}
                )
                GROUP BY r.room_id, r.name, r.created_on, r.created_by
                ORDER BY r.name ASC
            `;

            const rooms = userRooms.map(room => ({
                id: room.room_id.toString(),
                name: room.name,
                created_on: room.created_on,
                created_by: room.created_by.toString(),
                member_count: parseInt(room.member_count),
                type: 'room'
            }));

            return new Response(JSON.stringify(rooms), {
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
        console.error('Erreur gestion salons:', error);
        return new Response(JSON.stringify({
            code: "SERVER_ERROR",
            message: "Erreur serveur: " + error.message
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}