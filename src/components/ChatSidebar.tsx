import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Button,
    Badge,
    IconButton,
    Tooltip,
} from '@mui/material'
import {
    Search,
    Refresh,
    Logout,
} from '@mui/icons-material'
import { useChatStore, User } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const ChatSidebar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)
    const navigate = useNavigate()
    const hasLoaded = useRef(false)

    const {
        users,
        currentConversation,
        setCurrentConversation,
        isLoading,
        error,
        fetchUsers,
        createPrivateConversation,
        clearError,
    } = useChatStore()

    const { user: currentUser, logout, isInitialized } = useAuthStore()

    const loadUsers = useCallback(async () => {
        try {
            setLocalError(null)
            await fetchUsers()
        } catch (err) {
            console.error('Erreur lors du chargement:', err)
            setLocalError('Impossible de charger les utilisateurs')
        }
    }, [fetchUsers])

    // 🔥 RAFRAÎCHISSEMENT AUTOMATIQUE toutes les 15 secondes
    useEffect(() => {
        if (!currentUser || !isInitialized) return

        console.log('🔄 Démarrage rafraîchissement automatique')

        // Rafraîchir immédiatement
        loadUsers()

        // Puis toutes les 15 secondes
        const intervalId = setInterval(() => {
            console.log('🔄 Rafraîchissement automatique des utilisateurs')
            loadUsers()
        }, 15000) // 15 secondes

        return () => {
            console.log('🛑 Arrêt rafraîchissement automatique')
            clearInterval(intervalId)
        }
    }, [currentUser, isInitialized, loadUsers])

    useEffect(() => {
        console.log('🔄 ChatSidebar - État auth:', {
            currentUser: currentUser?.username,
            currentUserId: currentUser?.id,
            isInitialized,
            hasLoaded: hasLoaded.current,
            usersCount: users.length
        })

        if (isInitialized && currentUser && !hasLoaded.current && users.length === 0 && !isLoading) {
            console.log('🎯 Déclenchement du chargement initial - Utilisateur prêt')
            hasLoaded.current = true
            loadUsers()
        }
    }, [currentUser, isInitialized, users.length, isLoading, loadUsers])

    // 🔥 FONCTION POUR FORMATER LA DERNIÈRE CONNEXION
    const formatLastConnection = (lastConnection?: string) => {
        console.log('🕐 Format dernière connexion:', lastConnection, typeof lastConnection)

        if (!lastConnection) return 'Jamais connecté'

        try {
            const date = new Date(lastConnection)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMinutes = Math.floor(diffMs / (1000 * 60))
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

            console.log('🕐 Différence:', { diffMinutes, diffHours, diffDays })

            if (diffMinutes < 1) return 'À l\'instant'
            if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
            if (diffHours < 24) return `Il y a ${diffHours}h`
            if (diffDays === 1) return 'Hier'
            if (diffDays < 7) return `Il y a ${diffDays} jours`

            // Format date complète
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            console.error('❌ Erreur formatage date:', error)
            return 'Hors ligne'
        }
    }

    const isUserOnline = (user: User) => {
        // 🔥 DEBUG: Afficher les données reçues
        console.log('🔍 Vérification statut pour:', user.username, {
            is_online: (user as any).is_online,
            type: typeof (user as any).is_online,
            last_connection: user.last_connection
        });

        // 🔥 PRIORITÉ: Utiliser is_online de la base de données si disponible
        const isOnlineField = (user as any).is_online;

        if (typeof isOnlineField === 'boolean') {
            console.log(isOnlineField ? '🟢' : '⚫', user.username, '- statut DB');
            return isOnlineField;
        }

        // 🔥 Si is_online est une string "true"/"false" (parfois le cas avec PostgreSQL)
        if (isOnlineField === 'true' || isOnlineField === true) {
            console.log('🟢', user.username, '- statut DB (converti)');
            return true;
        }

        // Fallback: Calcul basé sur last_connection (moins de 2 minutes)
        if (!user.last_connection) {
            console.log('⚫', user.username, '- pas de last_connection');
            return false;
        }

        const lastConnection = new Date(user.last_connection);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastConnection.getTime()) / (1000 * 60);
        const isOnline = diffMinutes < 2;

        console.log(isOnline ? '🟢' : '⚫', user.username, `- fallback (${diffMinutes.toFixed(1)} min)`);
        return isOnline;
    }

    // 🔥 FILTRAGE AMÉLIORÉ avec logs de debug
    const filteredUsers = React.useMemo(() => {
        if (!currentUser) {
            console.log('⚠️ Pas d\'utilisateur connecté pour filtrer')
            return []
        }

        console.log('🔍 Filtrage utilisateurs:', {
            total: users.length,
            currentUserId: currentUser.id,
            currentUserIdType: typeof currentUser.id
        })

        // Filtrer l'utilisateur connecté ET appliquer la recherche
        const filtered = users.filter(user => {
            // 🔥 CONVERSION EN STRING POUR COMPARAISON SÛRE
            const userId = String(user.id)
            const currentId = String(currentUser.id)

            // Exclure l'utilisateur connecté
            if (userId === currentId) {
                console.log('🚫 Exclusion utilisateur connecté:', user.username)
                return false
            }

            // Appliquer le filtre de recherche
            if (searchTerm) {
                return user.username.toLowerCase().includes(searchTerm.toLowerCase())
            }

            return true
        })

        console.log('✅ Utilisateurs filtrés:', filtered.length)
        return filtered
    }, [users, currentUser, searchTerm])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleUserSelect = (user: User) => {
        // Double vérification (normalement impossible grâce au filtrage)
        if (String(user.id) === String(currentUser?.id)) {
            console.log('🚫 Impossible de chatter avec soi-même')
            return
        }

        const conversation = createPrivateConversation(user)
        setCurrentConversation(conversation)
        navigate(`/chat/${user.id}`)
    }

    const handleRetry = () => {
        setLocalError(null)
        clearError()
        hasLoaded.current = false
        loadUsers()
    }

    const displayError = localError || error

    return (
        <Box sx={{ width: 320, height: '100vh', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                        Utilisateurs ({filteredUsers.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Actualiser">
                            <IconButton
                                onClick={handleRetry}
                                disabled={isLoading || !currentUser}
                                size="small"
                            >
                                <Refresh />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Déconnexion">
                            <IconButton
                                onClick={handleLogout}
                                color="error"
                                size="small"
                            >
                                <Logout />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!currentUser}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {/* Indicateur de chargement de session */}
            {!currentUser && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Chargement de la session...
                    </Typography>
                </Box>
            )}

            {/* Erreurs et contenu principal */}
            {currentUser && displayError && (
                <Alert
                    severity="error"
                    sx={{ m: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={handleRetry}>
                            Réessayer
                        </Button>
                    }
                >
                    {displayError}
                </Alert>
            )}

            {currentUser && isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            {currentUser && (
                <List sx={{ p: 0, overflow: 'auto', height: 'calc(100vh - 120px)' }}>
                    {filteredUsers.map((user) => {
                        const isOnline = isUserOnline(user)
                        const isSelected = currentConversation?.target_user_id === user.id

                        return (
                            <ListItem key={user.id} disablePadding>
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => handleUserSelect(user)}
                                    sx={{
                                        '&.Mui-selected': {
                                            bgcolor: 'primary.light',
                                            '&:hover': { bgcolor: 'primary.light' },
                                        },
                                    }}
                                >
                                    <ListItemAvatar>
                                        <Badge
                                            color="success"
                                            variant="dot"
                                            invisible={!isOnline}
                                            anchorOrigin={{
                                                vertical: 'bottom',
                                                horizontal: 'right',
                                            }}
                                        >
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'primary.main',
                                                    width: 40,
                                                    height: 40,
                                                }}
                                            >
                                                {user.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                        </Badge>
                                    </ListItemAvatar>

                                    <ListItemText
                                        primary={
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: 'medium',
                                                    color: isSelected ? 'primary.contrastText' : 'text.primary'
                                                }}
                                                component="div"
                                            >
                                                {user.username}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography
                                                variant="body2"
                                                color={isSelected ? 'primary.contrastText' : 'text.secondary'}
                                                component="div"
                                                sx={{ fontSize: '0.75rem' }}
                                            >
                                                {isOnline
                                                    ? 'En ligne'
                                                    : formatLastConnection(user.last_connection)
                                                }
                                            </Typography>
                                        }
                                    />
                                </ListItemButton>
                            </ListItem>
                        )
                    })}

                    {filteredUsers.length === 0 && !isLoading && !displayError && currentUser && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun autre utilisateur'}
                            </Typography>
                        </Box>
                    )}
                </List>
            )}
        </Box>
    )
}

export default ChatSidebar