import React, { useState, useRef } from 'react'
import {
    Box,
    TextField,
    IconButton,
    Paper,
    CircularProgress,
    Tooltip,
} from '@mui/material'
import {
    Send,
    AttachFile,
    EmojiEmotions,
    Close,
} from '@mui/icons-material'
import { useChatStore } from '../stores/useChatStore'
import { useAuthStore } from '../stores/useAuthStore'

const MessageInput: React.FC = () => {
    const [message, setMessage] = useState('')
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const {
        currentConversation,
        currentRoom,
        isSending,
        sendMessage,
        sendRoomMessage,
    } = useChatStore()
    const { user: currentUser } = useAuthStore()



    const handleSendMessage = async () => {
        console.log('📤 Tentative d\'envoi:', {
            hasMessage: !!message.trim(),
            hasImage: !!selectedImage,
            messageLength: message.length,
            currentRoom: currentRoom?.name,
            currentConversation: currentConversation?.name,
            currentUser: currentUser?.username
        })

        if ((!message.trim() && !selectedImage) || !currentUser) {
            console.log('❌ Conditions non remplies pour envoi')
            return
        }

        try {
            if (selectedImage) {
                console.log('📸 Envoi d\'image...')
                setIsUploadingImage(true)

                const textToSend = message.trim()
                console.log('📝 Texte accompagnant:', textToSend || '(vide)')

                if (currentRoom) {
                    console.log('🏢 Envoi vers salon:', currentRoom.id, currentRoom.name)
                    console.log('✅ Image envoyée au salon')
                } else if (currentConversation?.target_user_id) {
                    console.log('👤 Envoi vers utilisateur:', currentConversation.target_user_id, currentConversation.name)
                    console.log('✅ Image envoyée à l\'utilisateur')
                } else {
                    console.error('❌ Pas de destination définie')
                    throw new Error('Aucune destination définie')
                }

                setIsUploadingImage(false)
                setMessage('')
                console.log('✅ Envoi terminé avec succès')
            } else if (message.trim()) {
                console.log('💬 Envoi de message texte seul...')

                if (currentRoom) {
                    console.log('🏢 Envoi vers salon:', currentRoom.id)
                    await sendRoomMessage(message, currentRoom.id)
                } else if (currentConversation?.target_user_id) {
                    console.log('👤 Envoi vers utilisateur:', currentConversation.target_user_id)
                    await sendMessage(message, currentConversation.target_user_id)
                }

                setMessage('')
                console.log('✅ Message texte envoyé')
            }

        } catch (error) {
            console.error('❌ ERREUR lors de l\'envoi:', error)
            console.error('Détails de l\'erreur:', {
                message: error instanceof Error ? error.message : 'Erreur inconnue',
                stack: error instanceof Error ? error.stack : undefined,
                error
            })
            setIsUploadingImage(false)
            alert(`Erreur lors de l'envoi: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    if (!currentConversation && !currentRoom) {
        return null
    }

    const isDisabled = isSending || isUploadingImage

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
            {imagePreview && (
                <Box
                    sx={{
                        mb: 2,
                        position: 'relative',
                        display: 'inline-block',
                    }}
                >
                    <img
                        src={imagePreview}
                        alt="Aperçu"
                        style={{
                            maxWidth: '200px',
                            maxHeight: '200px',
                            borderRadius: '8px',
                            border: '2px solid #e0e0e0',
                        }}
                    />
                    <IconButton
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'error.dark',
                            },
                        }}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                />

                <Tooltip title="Joindre un fichier">
                    <IconButton
                        size="small"
                        color="primary"
                        disabled={isDisabled}
                    >
                        <AttachFile />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Émojis">
                    <IconButton size="small" color="primary" disabled>
                        <EmojiEmotions />
                    </IconButton>
                </Tooltip>

                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder={
                        currentRoom
                            ? `Envoyer un message dans #${currentRoom.name}...`
                            : `Envoyer un message à ${currentConversation?.name}...`
                    }
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isDisabled}
                    variant="outlined"
                    size="small"
                />

                <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={(!message.trim() && !selectedImage) || isDisabled}
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
                    {isUploadingImage ? (
                        <CircularProgress size={24} color="inherit" />
                    ) : (
                        <Send />
                    )}
                </IconButton>
            </Box>
        </Paper>
    )
}

export default MessageInput