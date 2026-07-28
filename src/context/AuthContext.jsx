import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { apiEndpoints } from '../util/apiEndpoints.js';

const AuthContext = createContext(null);
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1.0";

const deriveDisplayName = (fullName, email) => {
    const name = (fullName || '').trim();
    if (name) {
        return name;
    }

    if (!email) {
        return 'User';
    }

    return email.split('@')[0];
};

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
 
                    const authHeaders = {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    };
                    const response = await axios.get(apiEndpoints.GET_CURRENT_USER, authHeaders);
                    const profile = response.data;
 
                    const fullNameValue = profile.fullName || profile.name || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || decoded.sub;
                    const displayName = deriveDisplayName(fullNameValue, profile.email || decoded.sub);
 
                    const storedAvatar = localStorage.getItem('userAvatar');
                    const profileAvatar = profile.photoUrl || profile.avatar || decoded.picture || decoded.avatar || storedAvatar || '';

                    setUser({
                        email: profile.email || decoded.sub,
                        id: profile.id || decoded.userId,
                        fullName: fullNameValue,
                        displayName,
                        firstName: profile.firstName || decoded.given_name || decoded.firstName || fullNameValue?.split(' ')[0] || '',
                        lastName: profile.lastName || decoded.family_name || decoded.lastName || fullNameValue?.split(' ').slice(1).join(' ') || '',
                        username: profile.username || decoded.username || displayName,
                        avatar: profileAvatar,
                    });
                    setIsAuthenticated(true);
                } catch (error) {
                    console.error("Error initializing auth:", error);
                    logout();
                }
            }
            setIsLoading(false);
        };
 
        initializeAuth();
    }, [token]); // Re-run if token changes

    const login = async (identifier, password) => {
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, { identifier, password });
            const { accessToken, refreshToken, userId, email, fullName, name, avatar, firstName, lastName, username } = response.data;
            const fullNameValue = fullName || name || `${firstName || ''} ${lastName || ''}`.trim();
            const displayName = deriveDisplayName(fullNameValue, email || identifier);
 
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setToken(accessToken); // Update token in state
 
            setUser({
                email: email || identifier,
                id: userId,
                fullName: fullNameValue,
                displayName,
                firstName: firstName || fullNameValue?.split(' ')[0] || '',
                lastName: lastName || fullNameValue?.split(' ').slice(1).join(' ') || '',
                username: username || displayName,
                avatar,
            });
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
            const { accessToken, refreshToken, userId, email, fullName, name, avatar, firstName, lastName, username } = response.data;
            const fullNameValue = fullName || name || `${firstName || ''} ${lastName || ''}`.trim();
            const displayName = deriveDisplayName(fullNameValue, email || name);

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            setToken(accessToken);
            setUser({
                email: email || name,
                id: userId,
                fullName: fullNameValue,
                displayName,
                firstName: firstName || fullNameValue?.split(' ')[0] || '',
                lastName: lastName || fullNameValue?.split(' ').slice(1).join(' ') || '',
                username: username || displayName,
                avatar,
            });
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
                const fullNameValue = data.fullName || `${firstName || ''} ${lastName || ''}`.trim();
                const displayName = deriveDisplayName(fullNameValue, email);

                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                setToken(data.accessToken);
                setUser({
                    email,
                    id: data.userId ?? data.user?.id,
                    fullName: fullNameValue,
                    displayName,
                    firstName: firstName || data.firstName || fullNameValue?.split(' ')[0] || '',
                    lastName: lastName || data.lastName || fullNameValue?.split(' ').slice(1).join(' ') || '',
                    username: username || data.username || displayName,
                    avatar: data.avatar || data.user?.avatar,
                });
                setIsAuthenticated(true);
            }
            return data;
        } catch (error) {
            throw error;
        }
    };
 
    const updateProfile = async ({ firstName, lastName, username, photoUrl }) => {
        try {
            const finalPhotoUrl = photoUrl || user?.avatar || '';

            const requestBody = {
                firstName: firstName || '',
                lastName: lastName || '',
                username: username || '',
                photoUrl: finalPhotoUrl,
                avatar: finalPhotoUrl,
            };

            const response = await axios.put(apiEndpoints.UPDATE_PROFILE, requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = response.data;
            const fullNameValue = `${data.firstName || firstName || ''} ${data.lastName || lastName || ''}`.trim();
            const displayName = deriveDisplayName(fullNameValue, user?.email);

            const updatedUser = {
                ...user,
                fullName: fullNameValue,
                displayName,
                firstName: data.firstName || firstName || user?.firstName || '',
                lastName: data.lastName || lastName || user?.lastName || '',
                username: data.username || username || user?.username || displayName,
                avatar: data.photoUrl || data.avatar || finalPhotoUrl || user?.avatar,
            };

            if (updatedUser.avatar) {
                localStorage.setItem('userAvatar', updatedUser.avatar);
            }

            setUser(updatedUser);
            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const setPassword = async (password) => {
        try {
            await axios.put(apiEndpoints.SET_PASSWORD, {
                password,
                newPassword: password,
                confirmPassword: password,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Error setting password:', error);
            throw error;
        }
    };

    const deleteAccount = async () => {
        try {
            await axios.delete(apiEndpoints.DELETE_ACCOUNT, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            logout();
        } catch (error) {
            console.error('Error deleting account:', error);
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
            updateProfile,
            setPassword,
            deleteAccount,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);