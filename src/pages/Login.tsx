// pages/Login.tsx
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
} from '@mui/material'
import { useAuthStore } from '../stores/useAuthStore'

const Login: React.FC = () => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const { login, isLoading } = useAuthStore()
    const usernameRef = useRef<HTMLInputElement>(null)

    // Focus sur le champ username après le rendu (alternative à autoFocus)
    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus()
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            // Simulation de connexion - À REMPLACER par ton API
            if (username === 'test' && password === 'testubo') {
                const token = 'fake-jwt-token'
                const user = {
                    id: '1',
                    username,
                    email: `${username}@ubo.fr`
                }
                login(token, user)
                navigate('/chat')
            } else {
                setError('Identifiants incorrects')
            }
        } catch (err) {
            setError('Erreur de connexion')
        }
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
                    <Typography component="h1" variant="h4" align="center" gutterBottom>
                        UBO Relay Chat
                    </Typography>
                    <Typography variant="subtitle1" align="center" color="textSecondary" sx={{ mb: 3 }}>
                        Connectez-vous à votre compte
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Nom d'utilisateur"
                            name="username"
                            autoComplete="username"
                            inputRef={usernameRef} // Utilisation de inputRef au lieu de autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={isLoading}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Se connecter'}
                        </Button>
                        <Box textAlign="center">
                            <Link to="/register" style={{ textDecoration: 'none' }}>
                                <Button variant="text" color="primary">
                                    Pas de compte ? S'inscrire
                                </Button>
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    )
}

export default Login