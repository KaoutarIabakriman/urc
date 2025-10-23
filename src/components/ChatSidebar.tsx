import React, { useEffect, useState } from 'react'
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
} from '@mui/material'
import {
    Search,
    Person,
    Group,
} from '@mui/icons-material'
import { useChatStore, Conversation } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const ChatSidebar: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [users, setUsers] = useState<any[]>([])
    const { conversations, currentConversation, setCurrentConversation } = useChatStore()
    const { user: currentUser } = useAuthStore()

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await fetch('/api/users', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                })

                if (response.ok) {
                    const usersData = await response.json()
                    const otherUsers = usersData.filter((u: any) => u.id !== currentUser?.id)
                    setUsers(otherUsers)

                    const userConversations: Conversation[] = otherUsers.map((user: any) => ({
                        id: user.id,
                        name: user.username,
                        type: 'private',
                        last_message: 'Aucun message',
                        last_message_time: new Date(user.last_connection),
                        unread_count: 0
                    }))
                    useChatStore.getState().setConversations(userConversations)
                }
            } catch (error) {
                console.error('Erreur chargement utilisateurs:', error)
            }
        }

        if (currentUser) {
            fetchUsers()
        }
    }, [currentUser])

    const filteredConversations = conversations.filter(conv =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleConversationSelect = (conversation: Conversation) => {
        setCurrentConversation(conversation)
    }

    return (
        <Box sx={{ width: 320, height: '100vh', bgcolor: 'background.paper', borderRight: 1, borderColor: 'divider' }}>
            {/* En-tête */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    Messages
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Rechercher..."
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


            <List sx={{ p: 0, overflow: 'auto', height: 'calc(100vh - 120px)' }}>
                {filteredConversations.map((conversation) => (
                    <ListItem key={conversation.id} disablePadding>
                        <ListItemButton
                            selected={currentConversation?.id === conversation.id}
                            onClick={() => handleConversationSelect(conversation)}
                            sx={{
                                '&.Mui-selected': {
                                    bgcolor: 'primary.light',
                                    '&:hover': {
                                        bgcolor: 'primary.light',
                                    },
                                },
                            }}
                        >
                            <ListItemAvatar>
                                <Badge
                                    color="success"
                                    variant="dot"
                                    invisible={conversation.type === 'room'}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: conversation.type === 'private' ? 'primary.main' : 'secondary.main' }}>
                                        {conversation.type === 'private' ? <Person /> : <Group />}
                                    </Avatar>
                                </Badge>
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" noWrap>
                                            {conversation.name}
                                        </Typography>
                                        {conversation.unread_count > 0 && (
                                            <Chip
                                                label={conversation.unread_count}
                                                size="small"
                                                color="primary"
                                                sx={{ minWidth: 20, height: 20 }}
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <Typography variant="body2" color="text.secondary" noWrap>
                                        {conversation.last_message}
                                    </Typography>
                                }
                            />
                        </ListItemButton>
                    </ListItem>
                ))}

                {filteredConversations.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Aucune conversation trouvée' : 'Aucune conversation'}
                        </Typography>
                    </Box>
                )}
            </List>


            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Salons de discussion
                </Typography>
                <Chip
                    icon={<Group />}
                    label="Rejoindre un salon"
                    variant="outlined"
                    onClick={() => {/* À implémenter */}}
                    sx={{ width: '100%', justifyContent: 'flex-start' }}
                />
            </Box>
        </Box>
    )
}

export default ChatSidebar