import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

        console.log('🎯 Résultat parsing:', { type, id })
        setParams({ type, id })

    }, [location.pathname])

    return params
}

const ChatContainer: React.FC = () => {
    const location = useLocation()
    const navigate = useNavigate()
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
        loadRoomMessages
    } = useChatStore()


    const [debugCount, setDebugCount] = useState(0)

    useEffect(() => {
        console.log('Chargement initial des données...')
        fetchUsers()
        fetchRooms()
    }, [fetchUsers, fetchRooms])

    // 🔥 SURVEILLANCE des changements d'état
    useEffect(() => {
        console.log('SURVEILLANCE currentRoom:', currentRoom?.name || 'null')
        console.log('SURVEILLANCE currentConversation:', currentConversation?.name || 'null')
        setDebugCount(prev => prev + 1)
    }, [currentRoom, currentConversation])

    useEffect(() => {
        console.log('Traitement URL - Type:', type, 'ID:', id)
        console.log('Chemin complet:', location.pathname)
        console.log('Users disponibles:', users.map(u => ({ id: u.id, username: u.username })))
        console.log('Rooms disponibles:', rooms.map(r => ({ id: r.id, name: r.name })))

        if (type === 'user' && id) {
            console.log('Recherche utilisateur avec ID:', id)
            const targetUser = users.find(u => String(u.id) === String(id))

            if (targetUser) {
                console.log('Utilisateur trouvé:', targetUser.username)
                const conversation = createPrivateConversation(targetUser)
                setCurrentConversation(conversation)
                setCurrentRoom(null)
            } else {
                console.warn('Utilisateur NON trouvé avec ID:', id)
                console.log('IDs disponibles:', users.map(u => ({ id: u.id, type: typeof u.id })))
                setCurrentConversation(null)
            }
        }
        else if (type === 'room' && id) {
            console.log('Recherche salon avec ID:', id)
            const targetRoom = rooms.find(r => String(r.id) === String(id))
            if (targetRoom) {
                console.log('Salon trouvé:', targetRoom.name)
                console.log('Avant setCurrentRoom - currentRoom:', currentRoom?.name || 'null')
                setCurrentRoom(targetRoom)
                setCurrentConversation(null)
                console.log('Après setCurrentRoom')

                console.log('Chargement des messages du salon...')
                loadRoomMessages(targetRoom.id)

            } else {
                console.warn('Salon NON trouvé avec ID:', id)
                setCurrentRoom(null)
            }
        }
        else {
            console.log('Mode général - Aucune conversation sélectionnée')
            setCurrentConversation(null)
            setCurrentRoom(null)
        }
    }, [type, id, users, rooms, setCurrentConversation, setCurrentRoom, createPrivateConversation, loadRoomMessages, location.pathname])

    console.log('État final (render:', debugCount, '):', {
        type,
        id,
        currentConversation: currentConversation?.name || 'Aucune',
        currentRoom: currentRoom?.name || 'Aucun',
        hasUsers: users.length > 0,
        hasRooms: rooms.length > 0,
        path: location.pathname
    })

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

export default ChatContainer