import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App'


const theme = createTheme({
    palette: {
        primary: {
            main: '#0055a0',
            light: '#4d7eb5',
            dark: '#003a6e',
        },
        secondary: {
            main: '#d21034',
            light: '#db4c67',
            dark: '#930b24',
        },
        background: {
            default: '#f8f9fa',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Segoe UI", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
            color: '#0055a0',
        },
        h6: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 4px 12px rgba(0, 85, 160, 0.1)',
                },
            },
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </React.StrictMode>,
)