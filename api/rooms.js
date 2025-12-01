import { sql } from '@vercel/postgres';
import { checkSession, unauthorizedResponse } from '../lib/session.js';

export const config = {
    runtime: 'edge', 
};

export default async function handler(request) {
    console.log('Début /api/rooms');
    
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ 
            error: 'Méthode non autorisée' 
        }), {
            status: 405,
            headers: { 'content-type': 'application/json' }
        });
    }
    
    try {
        const user = await checkSession(request);
        
        if (!user) {
            console.log('Session invalide');
            return unauthorizedResponse();
        }
        
        console.log('Session valide pour:', user.username, 'ID:', user.id);
        
        try {
            const result = await sql`
                SELECT 
                    r.room_id,
                    r.name,
                    r.created_on,
                    r.created_by,
                    COUNT(rm.user_id) as member_count
                FROM rooms r
                LEFT JOIN room_members rm ON r.room_id = rm.room_id
                WHERE r.room_id IN (
                    SELECT room_id FROM room_members WHERE user_id = ${user.id}
                )
                GROUP BY r.room_id, r.name, r.created_on, r.created_by
                ORDER BY r.name ASC
            `;
            
            const rooms = result.rows.map(room => ({
                id: room.room_id.toString(),
                name: room.name,
                created_on: room.created_on,
                created_by: room.created_by.toString(),
                member_count: parseInt(room.member_count) || 0,
                type: 'room'
            }));
            
            console.log(`${rooms.length} salons récupérés pour user ${user.id}`);
            
            return new Response(JSON.stringify(rooms), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                    'cache-control': 'no-cache, no-store, must-revalidate'
                }
            });
            
        } catch (dbError) {
            console.error('Erreur DB rooms:', dbError);
            return new Response(JSON.stringify({ 
                error: 'Erreur base de données',
                details: dbError.message 
            }), {
                status: 500,
                headers: { 'content-type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('Erreur API /rooms:', error);
        return new Response(JSON.stringify({ 
            error: 'Erreur serveur',
            details: error.message 
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }
}