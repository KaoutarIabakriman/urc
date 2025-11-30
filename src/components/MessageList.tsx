import React, {useEffect, useRef, useState, useMemo} from 'react'
import {
    Box,
    Typography,
    Avatar,
    Paper,
    List,
    ListItem,
    Dialog,
    DialogContent,
    IconButton,
} from '@mui/material'
import { Close } from '@mui/icons-material'
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
    const [hasLoadedInitialMessages, setHasLoadedInitialMessages] = useState(false)
    const [imageDialogOpen, setImageDialogOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, roomMessages])

    useEffect(() => {
        if (currentConversation && !currentRoom) {
            setHasLoadedInitialMessages(false)
        }
    }, [currentConversation, currentRoom])

    useEffect(() => {
        if (currentRoom) {
            return
        }

        if (currentConversation?.target_user_id &&
            currentConversation.target_user_id !== currentUser?.id &&
            !hasLoadedInitialMessages) {

            loadMessages(currentConversation.target_user_id)
            setHasLoadedInitialMessages(true)
        }
    }, [currentConversation, currentRoom, loadMessages, currentUser?.id, hasLoadedInitialMessages])

    const formatTimestamp = (timestamp: string | Date) => {
        try {
            const date = new Date(timestamp) // convertit UTC en heure locale
            const hours = date.getHours().toString().padStart(2, '0')
            const minutes = date.getMinutes().toString().padStart(2, '0')
            return `${hours}:${minutes}`
        } catch (error) {
            console.error('Erreur formatage timestamp:', error, timestamp)
            return '--:--'
        }
    }


    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl)
        setImageDialogOpen(true)
    }

    const handleCloseImageDialog = () => {
        setImageDialogOpen(false)
        setSelectedImage(null)
    }

    const isNewConversation = !currentRoom && messages.length === 0

    // 🔥 FIX: Remove duplicate messages
    const displayMessages = useMemo(() => {
        if (currentRoom) {
            const uniqueRoomMessages = roomMessages.filter((message, index, self) =>
                index === self.findIndex(m => m.id === message.id)
            );
            return uniqueRoomMessages.filter(msg => msg.room_id === currentRoom.id);
        }

        if (isNewConversation) {
            return [{
                id: 'welcome',
                content: `Commencez la conversation avec ${currentConversation?.name} ! 👋`,
                sender_id: 'system',
                sender_username: 'Système',
                timestamp: new Date(),
                conversation_id: currentConversation?.id || '',
                type: 'private' as const
            }];
        }

        // Remove duplicates from messages array
        const uniqueMessages = messages.filter((message, index, self) =>
            index === self.findIndex(m => m.id === message.id)
        );

        return uniqueMessages;
    }, [currentRoom, roomMessages, isNewConversation, currentConversation, messages]);

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

                        // 🔥 FIX: Vérifier image_url ET image_data
                        const hasImage = !!((message as any).image_url || (message as any).image_data)
                        const imageUrl = (message as any).image_url || (message as any).image_data

                        const showAvatar = !isSystemMessage && !isCurrentUser &&
                            (index === 0 || displayMessages[index - 1]?.sender_id !== message.sender_id)

                        return (
                            <React.Fragment key={`${message.id}-${index}`}>
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
                                                p: hasImage ? 0.5 : 1.5,
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
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {hasImage && imageUrl && (
                                                <Box
                                                    component="button"
                                                    onClick={() => handleImageClick(imageUrl)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault()
                                                            handleImageClick(imageUrl)
                                                        }
                                                    }}
                                                    sx={{
                                                        border: 'none',
                                                        background: 'none',
                                                        padding: 0,
                                                        cursor: 'pointer',
                                                        display: 'block',
                                                        '&:focus': {
                                                            outline: '2px solid',
                                                            outlineColor: 'primary.main',
                                                            outlineOffset: '2px',
                                                        },
                                                    }}
                                                    aria-label="Agrandir l'image"
                                                >
                                                    <img
                                                        src={imageUrl}
                                                        alt="Contenu visuel"
                                                        style={{
                                                            maxWidth: '300px',
                                                            maxHeight: '300px',
                                                            borderRadius: '8px',
                                                            display: 'block',
                                                        }}
                                                        onError={(e) => {
                                                            console.error('❌ Erreur chargement image')
                                                            e.currentTarget.style.display = 'none'
                                                        }}
                                                        onLoad={() => {
                                                            console.log('✅ Image chargée avec succès')
                                                        }}
                                                    />
                                                </Box>
                                            )}

                                            {message.content && message.content.trim() && (
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontStyle: isSystemMessage ? 'italic' : 'normal',
                                                        whiteSpace: 'pre-line',
                                                        p: hasImage ? 1 : 0,
                                                    }}
                                                >
                                                    {message.content}
                                                </Typography>
                                            )}
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

            <Dialog
                open={imageDialogOpen}
                onClose={handleCloseImageDialog}
                maxWidth="lg"
            >
                <IconButton
                    onClick={handleCloseImageDialog}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                    }}
                >
                    <Close />
                </IconButton>
                <DialogContent sx={{ p: 0 }}>
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="Affichage agrandi"
                            style={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                display: 'block',
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    )
}

export default MessageList