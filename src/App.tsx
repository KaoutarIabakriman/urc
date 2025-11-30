// App.tsx
import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'

// Ajoutez un composant de chargement
const LoadingScreen = () => (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
    }}>
        <div>Chargement...</div>
    </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isInitialized } = useAuthStore()

    // Attendre que l'authentification soit initialisée
    if (!isInitialized) {
        return <LoadingScreen />
    }

    return user ? <>{children}</> : <Navigate to="/login" />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isInitialized } = useAuthStore()

    // Attendre que l'authentification soit initialisée
    if (!isInitialized) {
        return <LoadingScreen />
    }

    return !user ? <>{children}</> : <Navigate to="/chat" />
}

function App() {
    const { checkAuth, isInitialized } = useAuthStore()
    const [isCheckingAuth, setIsCheckingAuth] = useState(true)

    // Vérifier l'authentification au démarrage
    useEffect(() => {
        const initializeAuth = async () => {
            console.log('🔐 Initialisation de l\'authentification...')
            await checkAuth()
            setIsCheckingAuth(false)
        }

        initializeAuth()
    }, [checkAuth])

    // Afficher un écran de chargement pendant la vérification
    if (isCheckingAuth || !isInitialized) {
        return <LoadingScreen />
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* Routes protégées */}
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat/user/:userId"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat/room/:roomId"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />

                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App