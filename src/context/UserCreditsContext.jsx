import {createContext, useCallback, useEffect, useState} from "react";
import axios from "axios";
import {apiEndpoints} from "../util/apiEndpoints.js";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext.jsx";

export const UserCreditsContext = createContext();

export const UserCreditsProvider = ({children}) => {
    const [credits, setCredits] = useState(5);
    const [loading, setLoading] = useState(false);
    const { token, isAuthenticated } = useAuth();


    //Function to fetch the user credits that can be called from anywhere
    const fetchUserCredits = useCallback(async () => {
        if (!isAuthenticated || !token) return;

        setLoading(true);

        try {
            const response = await axios.get(apiEndpoints.GET_CREDITS, {headers: {Authorization: `Bearer ${token}`}});
            if (response.status === 200) {
                setCredits(response.data.credits);
            } else {
                toast.error('Unable to get the credits.');
            }
        }catch (error) {
            console.error('Error fetching the user credits', error);
        }finally {
            setLoading(false);
        }
    },[token, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchUserCredits();
        }
    }, [fetchUserCredits, isAuthenticated]);


    const updateCredits = useCallback(newCredits => {
        console.log('Updating the credits', newCredits);
        setCredits(newCredits);
    }, []);


    const contextValue = {
        credits,
        setCredits,
        fetchUserCredits,
        updateCredits
    }

    return (
        <UserCreditsContext.Provider value={contextValue}>
            {children}
        </UserCreditsContext.Provider>
    )
}