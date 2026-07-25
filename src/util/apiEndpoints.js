const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1.0";

export const apiEndpoints = {
    FETCH_FILES: `${BASE_URL}/files/my`,
    GET_CREDITS: `${BASE_URL}/users/credits`,
    TOGGLE_FILE: (id) => `${BASE_URL}/files/${id}/toggle-public`,
    DOWNLOAD_FILE: (id) => `${BASE_URL}/files/download/${id}`,
    DELETE_FILE: (id) => `${BASE_URL}/files/${id}`,
    UPLOAD_FILE: `${BASE_URL}/files/upload`,
    GET_CURRENT_USER: `${BASE_URL}/users/me`,
    UPDATE_PROFILE: `${BASE_URL}/users/me`,
    SET_PASSWORD: `${BASE_URL}/users/me/password`,
    DELETE_ACCOUNT: `${BASE_URL}/users/me`,
    LIST_SESSIONS: `${BASE_URL}/users/sessions`,
    REVOKE_OTHER_SESSIONS: `${BASE_URL}/users/sessions/others`,
    REVOKE_SESSION: (id) => `${BASE_URL}/users/sessions/${id}`,
    CREATE_ORDER: `${BASE_URL}/payments/create-order`,
    TRANSACTIONS: `${BASE_URL}/transactions`,
    PUBLIC_FILE_VIEW: (fileId) => `${BASE_URL}/files/public/${fileId}`
}