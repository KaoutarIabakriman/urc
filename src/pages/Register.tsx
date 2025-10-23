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
import { PersonAdd } from '@mui/icons-material'

const Register: React.FC = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()
    const usernameRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (usernameRef.current) {
            usernameRef.current.focus()
        }
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        setIsLoading(true)

        // Validations côté client
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            setIsLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            setIsLoading(false)
            return
        }

        try {
            console.log('📤 Envoi inscription...', {
                username: formData.username,
                email: formData.email,
                passwordLength: formData.password.length
            })

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }),
            })

            console.log('📥 Réponse reçue - Status:', response.status)
            console.log('📥 Content-Type:', response.headers.get('content-type'))

            // 🔥 VÉRIFIER LE CONTENT-TYPE AVANT DE PARSER
            const contentType = response.headers.get('content-type')

            if (!contentType || !contentType.includes('application/json')) {
                // Si ce n'est pas du JSON, lire comme texte
                const textResponse = await response.text()
                console.error('❌ Réponse non-JSON reçue:', textResponse.substring(0, 200))

                if (textResponse.includes('<!DOCTYPE') || textResponse.includes('<html')) {
                    throw new Error('Erreur serveur (HTML reçu). Vérifiez les logs Vercel.')
                } else {
                    throw new Error(`Réponse invalide: ${textResponse.substring(0, 100)}`)
                }
            }

            // 🔥 PARSER LE JSON EN TOUTE SÉCURITÉ
            let data
            try {
                const responseText = await response.text()
                console.log('📄 Texte brut:', responseText.substring(0, 200))

                if (!responseText.trim()) {
                    throw new Error('Réponse vide du serveur')
                }

                data = JSON.parse(responseText)
                console.log('✅ JSON parsé:', data)
            } catch (parseError) {
                console.error('❌ Erreur parsing JSON:', parseError)
                throw new Error('Format de réponse invalide du serveur')
            }

            // 🔥 GÉRER LA RÉPONSE SELON LE STATUS
            if (response.ok) {
                // Succès (201)
                setSuccess('Compte créé avec succès ! Redirection...')
                console.log('🎉 Inscription réussie')

                if (data.token) {
                    localStorage.setItem('auth_token', data.token)
                    console.log('🔑 Token stocké')
                }

                setTimeout(() => {
                    navigate('/login')
                }, 2000)
            } else {
                // Erreur (400, 409, 500, etc.)
                let errorMessage = `Erreur ${response.status}`

                if (data.error) {
                    if (typeof data.error === 'object' && data.error.message) {
                        errorMessage = data.error.message
                    } else if (typeof data.error === 'string') {
                        errorMessage = data.error
                    }
                } else if (data.message) {
                    errorMessage = data.message
                } else if (data.details) {
                    errorMessage = data.details
                }

                setError(errorMessage)
                console.error('❌ Erreur inscription:', errorMessage)
            }
        } catch (err) {
            console.error('💥 Erreur catch:', err)

            let errorMessage = 'Erreur de connexion au serveur'
            if (err instanceof Error) {
                errorMessage = err.message
            } else if (typeof err === 'string') {
                errorMessage = err
            }

            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
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
                            <PersonAdd fontSize="large" />
                        </Avatar>
                        <Typography component="h1" variant="h4" gutterBottom>
                            Créer un compte
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Rejoignez UBO Relay Chat
                        </Typography>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert
                            severity="success"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                            }}
                        >
                            {success}
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
                            value={formData.username}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email"
                            label="Adresse email"
                            name="email"
                            autoComplete="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
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
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            sx={{ mb: 2 }}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirmer le mot de passe"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            sx={{ mb: 3 }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={isLoading ? <CircularProgress size={20} /> : <PersonAdd />}
                            disabled={isLoading}
                            sx={{
                                py: 1.5,
                                fontSize: '1.1rem',
                                mb: 3,
                            }}
                        >
                            {isLoading ? 'Création du compte...' : 'Créer mon compte'}
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
                                Déjà un compte ?
                            </Typography>
                            <Link to="/login" style={{ textDecoration: 'none' }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    sx={{
                                        borderRadius: 2,
                                        px: 3,
                                    }}
                                >
                                    Se connecter
                                </Button>
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Fade>
        </Container>
    )
}

export default Register