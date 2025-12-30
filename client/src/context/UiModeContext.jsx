import React, { createContext, useContext, useState, useEffect } from 'react';

const UiModeContext = createContext();

export const useUiMode = () => {
    const context = useContext(UiModeContext);
    if (!context) {
        throw new Error('useUiMode must be used within a UiModeProvider');
    }
    return context;
};

export const UiModeProvider = ({ children }) => {
    // Mocked isAdmin state - default to true for development
    const [isAdmin, setIsAdmin] = useState(true);

    // Initialize uiMode from localStorage or default to 'user'
    const [uiMode, setUiMode] = useState(() => {
        const savedMode = localStorage.getItem('uiMode');
        return savedMode ? savedMode : 'user';
    });

    useEffect(() => {
        localStorage.setItem('uiMode', uiMode);
    }, [uiMode]);

    const toggleUiMode = () => {
        if (uiMode === 'admin') {
            setUiMode('user');
            return { success: true, mode: 'user' };
        } else {
            // Switching to admin - check permissions
            if (isAdmin) {
                setUiMode('admin');
                return { success: true, mode: 'admin' };
            } else {
                console.warn('Access denied. Admin privileges required.');
                return { success: false, error: 'Access denied. Admin privileges required.' };
            }
        }
    };

    const value = {
        uiMode,
        setUiMode,
        isAdmin,
        setIsAdmin,
        toggleUiMode,
    };

    return (
        <UiModeContext.Provider value={value}>
            {children}
        </UiModeContext.Provider>
    );
};
