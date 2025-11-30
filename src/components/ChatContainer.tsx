import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Box } from '@mui/material'
import ChatSidebar from './ChatSidebar'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { useChatStore } from '../stores/useChatStore'

const useUrlParams = () => {
    const location = useLocation()
    const [params, setParams] = useState<{ type?: 'user' | 'room'; id?: string }>({})

    useEffect(() => {
        const path = location.pathname
        console.log('Parsing URL:', path)

        const parts = path.split('/').filter(Boolean)
        console.log('Parts:', parts)

        let type: 'user' | 'room' | undefined = undefined
        let id: string | undefined = undefined

        if (parts.length === 3 && parts[0] === 'chat') {
            if (parts[1] === 'user' || parts[1] === 'room') {
                type = parts[1] as 'user' | 'room'
                id = parts[2]
            }
        }

        console.log('Résultat parsing:', { type, id })
        setParams({ type, id })

    }, [location.pathname])

    return params
}

const ChatContainer: React.FC = () => {
    const location = useLocation()
    const { type, id } = useUrlParams()

    const {
        setCurrentConversation,
        setCurrentRoom,
        users,
        rooms,
        createPrivateConversation,
        currentConversation,
        currentRoom,
        fetchUsers,
        fetchRooms,
        loadRoomMessages,
        loadMessages
    } = useChatStore()

    const [isInitialized, setIsInitialized] = useState(false)
    const [lastProcessedUrl, setLastProcessedUrl] = useState<string>('')

    // Chargement initial des données - UNE SEULE FOIS
    useEffect(() => {
        console.log('Chargement initial des données...')
        const loadData = async () => {
            await fetchUsers()
            await fetchRooms()
            setIsInitialized(true)
        }
        loadData()
    }, [fetchUsers, fetchRooms])

    // 🔥 FIX: Improved polling without duplication
    useEffect(() => {
        if (!isInitialized) return

        let intervalId: NodeJS.Timeout | null = null

        const pollMessages = async () => {
            if (currentRoom) {
                console.log('🔄 Rafraîchissement messages salon:', currentRoom.id)
                await loadRoomMessages(currentRoom.id)
            } else if (currentConversation?.target_user_id) {
                console.log('🔄 Rafraîchissement messages privés:', currentConversation.target_user_id)
                await loadMessages(currentConversation.target_user_id!)
            }
        }

        if (currentRoom || currentConversation?.target_user_id) {
            console.log('🔄 Démarrage polling')

            // Poll immediately first
            pollMessages()

            // Then set interval
            intervalId = setInterval(pollMessages, 3000)
        }

        // Nettoyage à la fin
        return () => {
            if (intervalId) {
                console.log('🛑 Arrêt du polling')
                clearInterval(intervalId)
            }
        }
    }, [currentRoom, currentConversation, isInitialized, loadRoomMessages, loadMessages])

    // Gestion des paramètres d'URL
    useEffect(() => {
        if (!isInitialized) {
            console.log('En attente de l\'initialisation...')
            return
        }

        const currentUrl = `${type}-${id}`
        if (currentUrl === lastProcessedUrl) {
            console.log('URL déjà traitée, ignore:', currentUrl)
            return
        }

        console.log('Traitement URL - Type:', type, 'ID:', id)
        console.log('État actuel - Conversation:', currentConversation?.name, 'Room:', currentRoom?.name)

        // Éviter les mises à jour inutiles
        const isAlreadyOnCorrectConversation = type === 'user' && currentConversation?.target_user_id === id
        const isAlreadyOnCorrectRoom = type === 'room' && currentRoom?.id === id

        if (isAlreadyOnCorrectConversation || isAlreadyOnCorrectRoom) {
            console.log('Déjà sur la bonne conversation/salon')
            setLastProcessedUrl(currentUrl)
            return
        }

        if (type === 'user' && id) {
            const targetUser = users.find(u => String(u.id) === String(id))
            if (targetUser) {
                console.log('Utilisateur trouvé:', targetUser.username)
                const conversation = createPrivateConversation(targetUser)
                setCurrentConversation(conversation)
                setCurrentRoom(null)
                setLastProcessedUrl(currentUrl)
                console.log('Conversation définie:', conversation.name)
            } else {
                console.log('Utilisateur NON trouvé dans la liste actuelle')
            }
        }
        else if (type === 'room' && id) {
            const targetRoom = rooms.find(r => String(r.id) === String(id))
            if (targetRoom) {
                console.log('Salon trouvé:', targetRoom.name)
                setCurrentRoom(targetRoom)
                setCurrentConversation(null)
                loadRoomMessages(targetRoom.id)
                setLastProcessedUrl(currentUrl)
                console.log('Salon défini:', targetRoom.name)
            } else {
                console.log('Salon NON trouvé dans la liste actuelle')
            }
        }
        else {
            console.log('Aucune sélection valide dans URL')
        }
    }, [
        type,
        id,
        users,
        rooms,
        isInitialized,
        lastProcessedUrl,
        currentConversation,
        currentRoom,
        createPrivateConversation,
        setCurrentConversation,
        setCurrentRoom,
        loadRoomMessages
    ])

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <ChatSidebar />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <MessageList />
                <MessageInput />
            </Box>
        </Box>
    )
}

// 🔥 IMPORTANT : Export par défaut
export default ChatContainer