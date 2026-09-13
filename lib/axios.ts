// import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_URL,
// });

// // Request Interceptor: Attach token
// api.interceptors.request.use((config) => {
//   if (typeof window !== "undefined") {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//   }

//   return config;
// });

// // Response Interceptor: Handle 401
// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       if (
//         typeof window !== "undefined" &&
//         window.location.pathname !== "/login"
//       ) {
//         localStorage.removeItem("token");
//         localStorage.removeItem("user");

//         window.location.href = "/login?expired=true";
//       }
//     }

//     return Promise.reject(error);
//   },
// );

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Request Interceptor: Attach token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error(
        "401 Unauthorized:",
        error.config?.url,
        error.response?.data,
      );

      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login?expired=true";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
