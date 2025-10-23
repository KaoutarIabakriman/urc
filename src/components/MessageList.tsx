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
    const { messages, currentConversation, loadMessages } = useChatStore()
    const { user: currentUser } = useAuthStore()
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (currentConversation?.target_user_id && currentConversation.target_user_id !== currentUser?.id) {
            console.log('🔄 Chargement messages pour:', currentConversation.target_user_id)
            loadMessages(currentConversation.target_user_id)
        }
    }, [currentConversation, loadMessages, currentUser?.id])

    const formatTimestamp = (timestamp: string | Date) => {
        try {
            const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
            return date.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch (error) {
            console.error('Erreur formatage timestamp:', error, timestamp)
            return '--:--'
        }
    }

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

    const isNewConversation = messages.length === 0
    const displayMessages = isNewConversation ? [
        {
            id: 'welcome',
            content: `Commencez la conversation avec ${currentConversation.name} ! 👋`,
            sender_id: 'system',
            sender_username: 'Système',
            timestamp: new Date(),
            conversation_id: currentConversation.id,
            type: 'private'
        }
    ] : messages

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
                            {isNewConversation ? 'Nouvelle conversation' : 'Discussion privée'}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: 'grey.50' }}>
                <List sx={{ py: 0 }}>
                    {displayMessages.map((message, index) => {
                        // 🔥 CORRECTION : Déterminer correctement l'expéditeur
                        const isCurrentUser = message.sender_id === currentUser?.id
                        const isSystemMessage = message.sender_id === 'system'

                        // 🔥 CORRECTION : Afficher l'avatar seulement pour les messages de l'autre utilisateur
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
                                    {/* 🔥 CORRECTION : Avatar du destinataire (gauche) */}
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

                                    {/* 🔥 CORRECTION : Avatar de l'utilisateur courant (droite) */}
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
                                                // 🔥 CORRECTION : Forme des bulles comme WhatsApp
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

                                {/* 🔥 CORRECTION : Espacement entre groupes de messages */}
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