import axios from "axios";

// Create the axios instance
const apiClient = axios.create({
    baseURL: "/api", // Base URL for API requests
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor to handle 401 errors and refresh tokens
apiClient.interceptors.response.use(
    (response) => response, // Pass through if response is successful
    async (error) => {
        if (
            error.response?.status === 401 &&
            error.response?.data?.msg === "Token has expired"
        ) {
            try {
                // Attempt to refresh the token
                const refreshToken = localStorage.getItem("refresh_token");
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const refreshResponse = await axios.post(
                    "/api/auth/refresh",
                    {},
                    {
                        headers: { Authorization: `Bearer ${refreshToken}` },
                    }
                );

                const newAccessToken = refreshResponse.data.access_token;

                // Update the access token
                localStorage.setItem("access_token", newAccessToken);
                apiClient.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the failed request
                error.config.headers.Authorization = `Bearer ${newAccessToken}`;
                return apiClient.request(error.config);
            } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);

                // Clear tokens and redirect to login if refresh fails
                localStorage.clear();
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
