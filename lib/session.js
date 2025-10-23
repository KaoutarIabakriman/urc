// lib/session.js - VERSION CORRIGÉE
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

/**
 * Stocke une session utilisateur dans Redis
 */
export async function storeUserSession(token, userData) {
    try {
        console.log('💾 Stockage session Redis pour token:', token.substring(0, 20) + '...');

        // Upstash Redis gère automatiquement la sérialisation JSON
        await redis.set(`session:${token}`, JSON.stringify(userData), { ex: 3600 });
        console.log('✅ Session stockée avec clé: session:' + token.substring(0, 20) + '...');

        // Vérification
        const verify = await redis.get(`session:${token}`);
        if (verify) {
            console.log('✅ Stockage Redis confirmé');
            return true;
        } else {
            console.log('❌ Échec vérification Redis');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur stockage session Redis:', error);
        return false;
    }
}

/**
 * Récupère une session utilisateur depuis Redis - VERSION CORRIGÉE
 */
export async function getUserSession(token) {
    try {
        if (!token) return null;

        console.log('🔍 Recherche session avec token:', token.substring(0, 20) + '...');

        // 🔥 CORRECTION : Upstash Redis renvoie déjà l'objet parsé
        const userData = await redis.get(`session:${token}`);

        console.log('📦 Données récupérées de Redis:', typeof userData, userData);

        // Si userData est déjà un objet, le retourner directement
        if (userData && typeof userData === 'object') {
            console.log('✅ Session trouvée (objet déjà parsé)');
            return userData;
        }

        // Si c'est une string, tenter de la parser
        if (typeof userData === 'string') {
            try {
                const parsed = JSON.parse(userData);
                console.log('✅ Session trouvée (string parsée)');
                return parsed;
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError);
                return null;
            }
        }

        return null;

    } catch (error) {
        console.error('❌ Erreur récupération session Redis:', error);
        return null;
    }
}

/**
 * Vérifie la session à partir de la requête
 */
export async function checkSession(request) {
    try {
        console.log('🔐 Début vérification session...');

        // Récupérer le header Authorization
        let authHeader;

        if (request.headers && request.headers.authorization) {
            authHeader = request.headers.authorization;
        }
        else if (request.headers && typeof request.headers.get === 'function') {
            authHeader = request.headers.get('authorization');
        }
        else if (request.headers) {
            const headers = request.headers;
            authHeader = headers.Authorization || headers.authorization;
        }

        console.log('🔑 Auth header:', authHeader ? 'présent' : 'absent');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ Header Authorization manquant ou invalide');
            return null;
        }

        const token = authHeader.substring(7);

        if (!token) {
            console.log('❌ Token manquant');
            return null;
        }

        console.log('🔐 Vérification token:', token.substring(0, 20) + '...');

        const userSession = await getUserSession(token);

        if (!userSession) {
            console.log('❌ Session non trouvée dans Redis');
            return null;
        }

        console.log('✅ Session valide pour:', userSession.username);
        return userSession;

    } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        return null;
    }
}

/**
 * Réponse standard pour non autorisé
 */
export function unauthorizedResponse() {
    return new Response(
        JSON.stringify({
            error: "Non autorisé",
            message: "Session invalide ou expirée"
        }), {
            status: 401,
            headers: {
                'content-type': 'application/json',
                'www-authenticate': 'Bearer'
            },
        }
    );
}

/**
 * Supprime une session utilisateur de Redis
 */
export async function deleteUserSession(token) {
    try {
        await redis.del(`session:${token}`);
        console.log('✅ Session supprimée:', token.substring(0, 20) + '...');
        return true;
    } catch (error) {
        console.error('❌ Erreur suppression session Redis:', error);
        return false;
    }
}