import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1.0";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('accessToken')); // State for the token
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Renamed for clarity, matches previous suggestion

    useEffect(() => {
        const initializeAuth = async () => {
            // Use the token from state
            if (token) {
                try {
                    // A library like 'jwt-decode' can simplify this block
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
 
                    const decoded = JSON.parse(jsonPayload);
 
                    // Check if token is expired
                    if (decoded.exp * 1000 < Date.now()) {
                        // Here you could implement token refresh logic
                        console.log("Token expired, logging out.");
                        logout();
                        return;
                    }
 
                    setUser({ email: decoded.sub, id: decoded.userId });
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Error decoding token:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };
 
        initializeAuth();
    }, [token]); // Re-run if token changes

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
            const { accessToken, refreshToken, userId } = response.data;
 
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setToken(accessToken); // Update token in state
 
            setUser({ email, id: userId });
            setIsAuthenticated(true);
            return response.data;
        } catch (error) {
            setIsAuthenticated(false);
            throw error;
        }
    };
 
    const loginWithGoogle = async (idToken) => {
        try {
            const response = await axios.post(`${BASE_URL}/auth/google`, { idToken });
            const { accessToken, refreshToken, userId, email } = response.data;
 
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setToken(accessToken);
            setUser({ email, id: userId });
            setIsAuthenticated(true);
            return response.data;
        } catch (error) {
            setIsAuthenticated(false);
            throw error;
        }
    };
 
    const register = async (firstName, lastName, email, password, username) => {
        try {
            const response = await axios.post(`${BASE_URL}/auth/register`, {
                firstName,
                lastName,
                email,
                password,
                username,
            });
            const data = response.data;
            if (data.accessToken && data.refreshToken) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                setToken(data.accessToken);
                setUser({ email, id: data.userId ?? data.user?.id });
                setIsAuthenticated(true);
            }
            return data;
        } catch (error) {
            throw error;
        }
    };
 
    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setToken(null); // Clear token from state
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    };
    return (
        <AuthContext.Provider value={{
            user,
            token,
            isAuthenticated,
            isLoading,
            login,
            logout,
            register,
            loginWithGoogle,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);