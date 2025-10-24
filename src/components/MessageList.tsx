import React, { useEffect, useRef } from 'react'
import {
    Box,
    Typography,
    Avatar,
    Paper,
    List,
    ListItem,
} from '@mui/material'
import { useChatStore } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const MessageList: React.FC = () => {
    const {
        messages,
        roomMessages,
        currentConversation,
        currentRoom,
        loadMessages
    } = useChatStore()
    const { user: currentUser } = useAuthStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, roomMessages])

    useEffect(() => {

        if (currentRoom) {
            return
        }

        if (currentConversation?.target_user_id &&
            currentConversation.target_user_id !== currentUser?.id) {
            console.log('Chargement messages pour:', currentConversation.target_user_id)
            loadMessages(currentConversation.target_user_id)
        }
    }, [currentConversation, currentRoom, loadMessages, currentUser?.id])

    const formatTimestamp = (timestamp: string | Date) => {
        try {
            const date = new Date(timestamp)

            const dateWithOffset = new Date(date.getTime() + (2 * 60 * 60 * 1000))

            const hours = dateWithOffset.getHours().toString().padStart(2, '0')
            const minutes = dateWithOffset.getMinutes().toString().padStart(2, '0')

            return `${hours}:${minutes}`
        } catch (error) {
            console.error('Erreur formatage timestamp:', error, timestamp)
            return '--:--'
        }
    }

    if (!currentConversation && !currentRoom) {
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
                    Sélectionnez une conversation ou un salon pour commencer à discuter
                </Typography>
            </Box>
        )
    }

    const isNewConversation = !currentRoom && messages.length === 0
    const displayMessages = currentRoom
        ? roomMessages
        : isNewConversation
            ? [{
                id: 'welcome',
                content: `Commencez la conversation avec ${currentConversation?.name} ! 👋`,
                sender_id: 'system',
                sender_username: 'Système',
                timestamp: new Date(),
                conversation_id: currentConversation?.id || '',
                type: 'private' as const
            }]
            : messages

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
                    <Avatar sx={{ bgcolor: currentRoom ? 'secondary.main' : 'primary.main' }}>
                        {(currentRoom?.name || currentConversation?.name || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="h6">
                            {currentRoom?.name || currentConversation?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {currentRoom
                                ? `Salon public • ${currentRoom.member_count} membre(s)`
                                : isNewConversation
                                    ? 'Nouvelle conversation'
                                    : 'Discussion privée'
                            }
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                <List sx={{ py: 0 }}>
                    {displayMessages.map((message, index) => {
                        const isCurrentUser = message.sender_id === currentUser?.id
                        const isSystemMessage = message.sender_id === 'system'

                        const showAvatar = !isSystemMessage && !isCurrentUser &&
                            (index === 0 || displayMessages[index - 1]?.sender_id !== message.sender_id)

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
                                    {!isCurrentUser && !isSystemMessage && showAvatar && (
                                        <Avatar
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                mr: 1,
                                                mt: 0.5,
                                                bgcolor: 'primary.main',
                                            }}
                                        >
                                            {message.sender_username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    )}

                                    {isCurrentUser && !isSystemMessage && (
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

                                    <Box
                                        sx={{
                                            maxWidth: isSystemMessage ? '90%' : '70%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: isSystemMessage ? 'center' : (isCurrentUser ? 'flex-end' : 'flex-start'),
                                        }}
                                    >
                                        {!isSystemMessage && !isCurrentUser && showAvatar && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mb: 0.5, mx: 1 }}
                                            >
                                                {message.sender_username}
                                            </Typography>
                                        )}

                                        <Paper
                                            elevation={isSystemMessage ? 0 : 1}
                                            sx={{
                                                p: 1.5,
                                                bgcolor: isSystemMessage
                                                    ? 'transparent'
                                                    : isCurrentUser
                                                        ? 'primary.main'
                                                        : 'background.paper',
                                                color: isSystemMessage
                                                    ? 'text.secondary'
                                                    : isCurrentUser
                                                        ? 'primary.contrastText'
                                                        : 'text.primary',
                                                borderRadius: 2,
                                                borderTopLeftRadius: isCurrentUser ? 12 : 4,
                                                borderTopRightRadius: isCurrentUser ? 4 : 12,
                                                borderBottomLeftRadius: 12,
                                                borderBottomRightRadius: 12,
                                                textAlign: isSystemMessage ? 'center' : 'left',
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    fontStyle: isSystemMessage ? 'italic' : 'normal',
                                                    whiteSpace: 'pre-line'
                                                }}
                                            >
                                                {message.content}
                                            </Typography>
                                        </Paper>

                                        {!isSystemMessage && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mt: 0.5, mx: 1 }}
                                            >
                                                {formatTimestamp(message.timestamp)}
                                            </Typography>
                                        )}
                                    </Box>
                                </ListItem>

                                {!isSystemMessage && index < displayMessages.length - 1 &&
                                    displayMessages[index + 1]?.sender_id !== message.sender_id && (
                                        <Box sx={{ height: 8 }} />
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