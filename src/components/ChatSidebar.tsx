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
    Tabs,
    Tab,
} from '@mui/material'
import {
    Search,
    Refresh,
    Logout,
    Group,
    Person,
} from '@mui/icons-material'
import { useChatStore, User, Room } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const ChatSidebar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState(0) // 0: Utilisateurs, 1: Salons
    const navigate = useNavigate()
    const hasLoaded = useRef(false)

    const {
        users,
        rooms,
        currentConversation,
        currentRoom,
        setCurrentConversation,
        setCurrentRoom,
        isLoading,
        error,
        fetchUsers,
        fetchRooms,
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

    const loadRooms = useCallback(async () => {
        try {
            setLocalError(null)
            await fetchRooms()
        } catch (err) {
            console.error('Erreur lors du chargement des salons:', err)
            setLocalError('Impossible de charger les salons')
        }
    }, [fetchRooms])

    useEffect(() => {
        if (!currentUser || !isInitialized) return

        loadUsers()
        loadRooms()

        const intervalId = setInterval(() => {
            loadUsers()
            loadRooms()
        }, 15000)

        return () => {
            clearInterval(intervalId)
        }
    }, [currentUser, isInitialized, loadUsers, loadRooms])

    useEffect(() => {
        if (isInitialized && currentUser && !hasLoaded.current && users.length === 0 && !isLoading) {
            hasLoaded.current = true
            loadUsers()
            loadRooms()
        }
    }, [currentUser, isInitialized, users.length, isLoading, loadUsers, loadRooms])

    const formatLastConnection = (lastConnection?: string) => {
        if (!lastConnection) return 'Jamais connecté'

        try {
            const date = new Date(lastConnection)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMinutes = Math.floor(diffMs / (1000 * 60))
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

            if (diffMinutes < 1) return 'À l\'instant'
            if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
            if (diffHours < 24) return `Il y a ${diffHours}h`
            if (diffDays === 1) return 'Hier'
            if (diffDays < 7) return `Il y a ${diffDays} jours`

            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            return 'Hors ligne'
        }
    }

    const isUserOnline = (user: User) => {
        const isOnlineField = (user as any).is_online;

        if (typeof isOnlineField === 'boolean') {
            return isOnlineField;
        }

        if (isOnlineField === 'true' || isOnlineField === true) {
            return true;
        }

        if (!user.last_connection) {
            return false;
        }

        const lastConnection = new Date(user.last_connection);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastConnection.getTime()) / (1000 * 60);
        return diffMinutes < 2;
    }

    const filteredUsers = React.useMemo(() => {
        if (!currentUser) return []

        const filtered = users.filter(user => {
            const userId = String(user.id)
            const currentId = String(currentUser.id)

            if (userId === currentId) {
                return false
            }

            if (searchTerm) {
                return user.username.toLowerCase().includes(searchTerm.toLowerCase())
            }

            return true
        })

        return filtered
    }, [users, currentUser, searchTerm])

    const filteredRooms = React.useMemo(() => {
        if (!currentUser) return []

        const filtered = rooms.filter(room => {
            if (searchTerm) {
                return room.name.toLowerCase().includes(searchTerm.toLowerCase())
            }
            return true
        })

        return filtered
    }, [rooms, currentUser, searchTerm])

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleUserSelect = (user: User) => {
        console.log('Sélection utilisateur:', user.username, 'ID:', user.id)

        if (String(user.id) === String(currentUser?.id)) {
            console.log('Impossible de chatter avec soi-même')
            return
        }

        const conversation = createPrivateConversation(user)
        setCurrentConversation(conversation)
        setCurrentRoom(null)

        navigate(`/chat/user/${user.id}`)
        console.log('Navigation vers:', `/chat/user/${user.id}`)
    }

    const handleRoomSelect = (room: Room) => {
        console.log('Sélection salon:', room.name, 'ID:', room.id)

        setCurrentRoom(room)
        setCurrentConversation(null)

        navigate(`/chat/room/${room.id}`)
        console.log('Navigation vers:', `/chat/room/${room.id}`)
    }

    const handleRetry = () => {
        setLocalError(null)
        clearError()
        hasLoaded.current = false
        loadUsers()
        loadRooms()
    }

    const displayError = localError || error

    return (
        <Box sx={{ width: 320, height: '100vh', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                        {activeTab === 0 ? `Utilisateurs (${filteredUsers.length})` : `Salons (${filteredRooms.length})`}
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

                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    sx={{ mb: 2 }}
                    variant="fullWidth"
                >
                    <Tab
                        icon={<Person />}
                        label="Utilisateurs"
                        sx={{ minHeight: 48 }}
                    />
                    <Tab
                        icon={<Group />}
                        label="Salons"
                        sx={{ minHeight: 48 }}
                    />
                </Tabs>

                <TextField
                    fullWidth
                    size="small"
                    placeholder={activeTab === 0 ? "Rechercher un utilisateur..." : "Rechercher un salon..."}
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

            {!currentUser && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Chargement de la session...
                    </Typography>
                </Box>
            )}

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
                <List sx={{ p: 0, overflow: 'auto', height: 'calc(100vh - 180px)' }}>
                    {activeTab === 0 ? (
                        // Liste des utilisateurs
                        filteredUsers.map((user) => {
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
                                                <Typography variant="subtitle2" noWrap>
                                                    {user.username}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {isOnline ? 'En ligne' : formatLastConnection(user.last_connection)}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )
                        })
                    ) : (
                        filteredRooms.map((room) => {
                            const isSelected = currentRoom?.id === room.id

                            return (
                                <ListItem key={room.id} disablePadding>
                                    <ListItemButton
                                        selected={isSelected}
                                        onClick={() => handleRoomSelect(room)}
                                        sx={{
                                            '&.Mui-selected': {
                                                bgcolor: 'secondary.light',
                                                '&:hover': { bgcolor: 'secondary.light' },
                                            },
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                sx={{
                                                    bgcolor: 'secondary.main',
                                                    width: 40,
                                                    height: 40,
                                                }}
                                            >
                                                <Group />
                                            </Avatar>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" noWrap>
                                                        {room.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            bgcolor: 'success.light',
                                                            color: 'success.contrastText',
                                                            px: 0.5,
                                                            borderRadius: 0.5,
                                                            fontSize: '0.6rem'
                                                        }}
                                                    >
                                                        Public
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="text.secondary">
                                                    {room.member_count} membre(s) • Accès automatique
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            )
                        })
                    )}

                    {activeTab === 0 && filteredUsers.length === 0 && !isLoading && !displayError && currentUser && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {searchTerm ? 'Aucun utilisateur trouvé' : 'Aucun autre utilisateur'}
                            </Typography>
                        </Box>
                    )}

                    {activeTab === 1 && filteredRooms.length === 0 && !isLoading && !displayError && currentUser && (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {searchTerm ? 'Aucun salon trouvé' : 'Aucun salon disponible'}
                            </Typography>
                        </Box>
                    )}
                </List>
            )}
        </Box>
    )
}

export default ChatSidebar