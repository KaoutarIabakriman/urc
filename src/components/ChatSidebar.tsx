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

    useEffect(() => {
        console.log('🔄 ChatSidebar - État auth:', {
            currentUser: currentUser?.username,
            isInitialized,
            hasLoaded: hasLoaded.current,
            usersCount: users.length
        })

        if (isInitialized && currentUser && !hasLoaded.current && users.length === 0 && !isLoading) {
            console.log('🎯 Déclenchement du chargement initial - Utilisateur prêt')
            hasLoaded.current = true
            loadUsers()
        }
    }, [loadUsers, users.length, isLoading, currentUser, isInitialized])

    const isUserOnline = (user: User) => {
        if (!user.last_connection) return false
        const lastConnection = new Date(user.last_connection)
        const now = new Date()
        return (now.getTime() - lastConnection.getTime()) < 5 * 60 * 1000
    }

    const filteredUsers = currentUser
        ? users.filter(user => user.id !== currentUser.id)
            .filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        : []

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleUserSelect = (user: User) => {
        if (user.id === currentUser?.id) {
            console.log('Impossible de chatter avec soi-même')
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
                                            >
                                                {isOnline ? 'En ligne' : 'Hors ligne'}
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