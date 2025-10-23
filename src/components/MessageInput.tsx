import React, { useState } from 'react'
import {
    Box,
    TextField,
    IconButton,
    Paper,
} from '@mui/material'
import {
    Send,
    AttachFile,
    EmojiEmotions,
} from '@mui/icons-material'
import { useChatStore } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const MessageInput: React.FC = () => {
    const [message, setMessage] = useState('')
    const { currentConversation, addMessage, isSending, setSending } = useChatStore()
    const { user: currentUser } = useAuthStore()

    const handleSendMessage = async () => {
        if (!message.trim() || !currentConversation || !currentUser) return

        const newMessage = {
            id: Date.now().toString(),
            content: message.trim(),
            sender_id: currentUser.id,
            sender_username: currentUser.username,
            timestamp: new Date(),
            conversation_id: currentConversation.id,
            type: currentConversation.type,
        }

        setSending(true)

        try {
            console.log('Envoi du message:', newMessage)

            addMessage(newMessage)
            setMessage('')
        } catch (error) {
            console.error('Erreur envoi message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    if (!currentConversation) {
        return null
    }

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <IconButton size="small" color="primary">
                    <AttachFile />
                </IconButton>

                <IconButton size="small" color="primary">
                    <EmojiEmotions />
                </IconButton>

                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder={`Envoyer un message à ${currentConversation.name}...`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSending}
                    variant="outlined"
                    size="small"
                />

                <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending}
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'primary.dark',
                        },
                        '&:disabled': {
                            bgcolor: 'grey.400',
                        },
                    }}
                >
                    <Send />
                </IconButton>
            </Box>
        </Paper>
    )
}

export default MessageInput