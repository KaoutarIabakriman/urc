import React, { useEffect, useState } from 'react'
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
    Chip,
    Badge,
    TextField,
    InputAdornment,
    CircularProgress,
    Alert,
    Button,
} from '@mui/material'
import {
    Search,
    Person,
    Refresh,
} from '@mui/icons-material'
import { useChatStore, User } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const ChatSidebar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)
    const navigate = useNavigate()

    const {
        users,
        conversations,
        currentConversation,
        setCurrentConversation,
        isLoading,
        error,
        fetchUsers,
        createPrivateConversation,
        clearError,
        loadConversations
    } = useChatStore()

    const { user: currentUser } = useAuthStore()

    useEffect(() => {
        const loadData = async () => {
            try {
                setLocalError(null)
                await loadConversations()
            } catch (err) {
                console.error('Erreur lors du chargement:', err)
                setLocalError('Impossible de charger les conversations')
            }
        }

        loadData()
    }, [loadConversations])

    const formatLastConnection = (dateString: string) => {
        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffTime = Math.abs(now.getTime() - date.getTime())
            const diffMinutes = Math.floor(diffTime / (1000 * 60))
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

            if (diffMinutes < 1) return 'À l\'instant'
            if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
            if (diffHours < 24) return `Il y a ${diffHours} h`
            if (diffDays === 1) return 'Hier'
            return `Il y a ${diffDays} jours`
        } catch {
            return 'Date inconnue'
        }
    }

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleUserSelect = (user: User) => {
        const conversation = createPrivateConversation(user)
        setCurrentConversation(conversation)
        navigate(`/messages/user/${user.id}`)
    }

    const handleRetry = () => {
        setLocalError(null)
        clearError()
        loadConversations()
    }

    const displayError = localError || error

    return (
        <Box sx={{ width: 320, height: '100vh', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
            {/* En-tête avec bouton recharger */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                        Messages
                    </Typography>
                    <Button
                        startIcon={<Refresh />}
                        onClick={handleRetry}
                        disabled={isLoading}
                        size="small"
                    >
                        Actualiser
                    </Button>
                </Box>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher une conversation..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {displayError && (
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

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            <List sx={{ p: 0, overflow: 'auto', height: 'calc(100vh - 120px)' }}>
                {filteredConversations.map((conversation) => {
                    const targetUser = users.find(u => u.id === conversation.target_user_id)

                    return (
                        <ListItem key={conversation.id} disablePadding>
                            <ListItemButton
                                selected={currentConversation?.id === conversation.id}
                                onClick={() => {
                                    if (targetUser) {
                                        handleUserSelect(targetUser)
                                    } else {
                                        // Créer un utilisateur temporaire si non trouvé
                                        const tempUser: User = {
                                            id: conversation.target_user_id || 'unknown',
                                            username: conversation.name,
                                            email: '',
                                            external_id: '',
                                            last_connection: new Date().toISOString()
                                        }
                                        handleUserSelect(tempUser)
                                    }
                                }}
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
                                        invisible={!targetUser?.last_connection ||
                                            Date.now() - new Date(targetUser.last_connection).getTime() > 5 * 60 * 1000
                                        }
                                    >
                                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                                            {conversation.name.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Badge>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography
                                                variant="subtitle1"
                                                noWrap
                                                sx={{ fontWeight: 'medium' }}
                                                component="div" // 🔥 CORRECTION : changer de p à div
                                            >
                                                {conversation.name}
                                            </Typography>
                                            {conversation.unread_count > 0 && (
                                                <Chip
                                                    label={conversation.unread_count}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ minWidth: 20, height: 20, fontSize: '0.75rem' }}
                                                />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box component="div"> {/* 🔥 CORRECTION : explicitement div */}
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                noWrap
                                                component="div" // 🔥 CORRECTION : changer de p à div
                                            >
                                                {conversation.last_message || 'Aucun message'}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                component="div" // 🔥 CORRECTION : changer de p à div
                                            >
                                                {conversation.last_message_time && formatLastConnection(conversation.last_message_time.toString())}
                                            </Typography>
                                        </Box>
                                    }
                                    primaryTypographyProps={{ component: 'div' }} // 🔥 CORRECTION supplémentaire
                                    secondaryTypographyProps={{ component: 'div' }} // 🔥 CORRECTION supplémentaire
                                />
                            </ListItemButton>
                        </ListItem>
                    )
                })}

                {filteredConversations.length === 0 && !isLoading && !displayError && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => fetchUsers()}
                        >
                            Charger les utilisateurs
                        </Button>
                    </Box>
                )}
            </List>
        </Box>
    )
}

export default ChatSidebar