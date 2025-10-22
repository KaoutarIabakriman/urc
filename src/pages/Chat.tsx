// pages/Chat.tsx
import React from 'react'
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Box,
    Paper,
} from '@mui/material'
import { useAuthStore } from '../stores/useAuthStore'

const Chat: React.FC = () => {
    const { user, logout } = useAuthStore()

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        UBO Relay Chat
                    </Typography>
                    <Typography variant="body1" sx={{ mr: 2 }}>
                        Bonjour, {user?.username}
                    </Typography>
                    <Button color="inherit" onClick={logout}>
                        Déconnexion
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box>
                        <Typography variant="h5" gutterBottom>
                            Interface de messagerie
                        </Typography>
                        <Typography variant="body1" color="textSecondary">
                            Connecté en tant que {user?.email}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                            La messagerie sera implémentée dans les prochaines étapes
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </>
    )
}

export default Chat