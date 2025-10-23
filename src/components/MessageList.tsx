import React, { useEffect, useRef } from 'react'
import {
    Box,
    Typography,
    Avatar,
    Paper,
    List,
    ListItem,
    Divider,
} from '@mui/material'
import { useChatStore } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const MessageList: React.FC = () => {
    const { messages, currentConversation } = useChatStore()
    const { user: currentUser } = useAuthStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (!currentConversation) {
        return (
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.50',
                    p: 3,
                }}
            >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    UBO Relay Chat
                </Typography>
                <Typography variant="body1" color="text.secondary" align="center">
                    Sélectionnez une conversation pour commencer à discuter
                </Typography>
            </Box>
        )
    }

    const displayMessages = messages.length > 0 ? messages : [
        {
            id: '1',
            content: 'Bienvenue sur UBO Relay Chat ! 👋',
            sender_id: 'system',
            sender_username: 'Système',
            timestamp: new Date(),
            conversation_id: currentConversation.id,
            type: 'private'
        }
    ]

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {currentConversation.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">{currentConversation.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentConversation.type === 'private' ? 'Discussion privée' : 'Salon de discussion'}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                <List sx={{ py: 0 }}>
                    {displayMessages.map((message, index) => {
                        const isCurrentUser = message.sender_id === currentUser?.id
                        const showAvatar = index === 0 || displayMessages[index - 1]?.sender_id !== message.sender_id

                        return (
                            <React.Fragment key={message.id}>
                                <ListItem
                                    sx={{
                                        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                                        alignItems: 'flex-start',
                                        py: 1,
                                        px: 0,
                                    }}
                                >
                                    {!isCurrentUser && showAvatar && (
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                mr: 1,
                                                mt: 0.5,
                                            }}
                                        >
                                            {message.sender_username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    )}

                                    <Box
                                        sx={{
                                            maxWidth: '70%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        {showAvatar && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mb: 0.5, mx: 1 }}
                                            >
                                                {message.sender_username}
                                            </Typography>
                                        )}

                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 1.5,
                                                bgcolor: isCurrentUser ? 'primary.main' : 'background.paper',
                                                color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
                                                borderRadius: 2,
                                                borderTopLeftRadius: isCurrentUser ? 12 : 4,
                                                borderTopRightRadius: isCurrentUser ? 4 : 12,
                                            }}
                                        >
                                            <Typography variant="body1">{message.content}</Typography>
                                        </Paper>

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ mt: 0.5, mx: 1 }}
                                        >
                                            {message.timestamp.toLocaleTimeString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Typography>
                                    </Box>

                                    {isCurrentUser && showAvatar && (
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                ml: 1,
                                                mt: 0.5,
                                                bgcolor: 'secondary.main',
                                            }}
                                        >
                                            {currentUser?.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    )}
                                </ListItem>

                                {index < displayMessages.length - 1 &&
                                    displayMessages[index + 1]?.sender_id !== message.sender_id && (
                                        <Divider variant="inset" component="li" sx={{ my: 1 }} />
                                    )}
                            </React.Fragment>
                        )
                    })}
                </List>
                <div ref={messagesEndRef} />
            </Box>
        </Box>
    )
}

export default MessageList