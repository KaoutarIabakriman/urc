import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/useAuthStore'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useAuthStore((state) => state.user)
    return user ? <>{children}</> : <Navigate to="/login" />
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const user = useAuthStore((state) => state.user)
    return !user ? <>{children}</> : <Navigate to="/chat" />
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                {/* 🔥 CORRECTION : Route unique qui capture tout */}
                <Route path="/chat/*" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

                <Route path="/" element={<Navigate to="/chat" replace />} />

                <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App