import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    CircularProgress,
    Avatar,
    Fade,
} from '@mui/material'
import { Lock, School } from '@mui/icons-material'
import { useAuthStore } from '../stores/useAuthStore'

const Login: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [localError, setLocalError] = useState('')
    const navigate = useNavigate()
    const { login, isLoading } = useAuthStore()
    const usernameRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError('')

        try {
            console.log('🔐 Connexion via store pour:', username)

            // 🔥 UTILISER UNIQUEMENT LE STORE
            await login(username, password)

            console.log('✅ Connexion réussie, redirection vers /chat')
            navigate('/chat')

        } catch (error) {
            console.error('❌ Erreur login:', error)
            setLocalError(
                error instanceof Error
                    ? error.message
                    : 'Identifiant ou mot de passe incorrect'
            )
        }
    }

    // Remplissage automatique pour test
    const handleDemoLogin = () => {
        setUsername('lala1')
        setPassword('testubo')
    }

    return (
        <Container
            component="main"
            maxWidth="sm"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0055a0 0%, #003a6e 100%)',
            }}
        >
            <Fade in={true} timeout={800}>
                <Paper
                    elevation={8}
                    sx={{
                        padding: 6,
                        width: '100%',
                        borderRadius: 3,
                        background: 'white',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Avatar
                            sx={{
                                bgcolor: 'secondary.main',
                                width: 60,
                                height: 60,
                                margin: '0 auto 16px',
                            }}
                        >
                            <School fontSize="large" />
                        </Avatar>
                        <Typography component="h1" variant="h4" gutterBottom>
                            UBO Relay Chat
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Plateforme de messagerie universitaire
                        </Typography>
                    </Box>

                    {localError && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                            }}
                        >
                            {localError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Nom d'utilisateur"
                            name="username"
                            autoComplete="username"
                            inputRef={usernameRef}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="Mot de passe"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={isLoading ? <CircularProgress size={20} /> : <Lock />}
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                mb: 2,
                            }}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>


                        <Box
                            sx={{
                                textAlign: 'center',
                                pt: 2,
                                borderTop: 1,
                                borderColor: 'grey.200'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Première utilisation ?
                            </Typography>
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    disabled={isLoading}
                                    sx={{
                                        borderRadius: 2,
                                        px: 3,
                                    }}
                                >
                                    Créer un compte étudiant
                                </Button>
                            </Link>
                        </Box>

                        <Box
                            sx={{
                                mt: 3,
                                p: 2,
                                bgcolor: 'grey.50',
                                borderRadius: 2,
                                border: 1,
                                borderColor: 'grey.200'
                            }}
                        >
                        </Box>
                    </Box>
                </Paper>
            </Fade>
        </Container>
    )
}

export default Login