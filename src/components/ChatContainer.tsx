import React from 'react'
import { Box } from '@mui/material'
import ChatSidebar from './ChatSidebar'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

const ChatContainer: React.FC = () => {
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
