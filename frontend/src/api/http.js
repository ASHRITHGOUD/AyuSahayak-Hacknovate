import axios from 'axios';

const http = axios.create({
  baseURL: process.env.REACT_APP_API,
  withCredentials: true, // send refresh cookie
});

// Attach access token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];

function processQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return http(original);
          })
          .catch(Promise.reject);
      }

      original._retry = true;
      refreshing = true;
      try {
        const { data } = await axios.post(
          `${process.env.REACT_APP_API}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem('accessToken', data.accessToken);
        http.defaults.headers.Authorization = `Bearer ${data.accessToken}`;
        processQueue(null, data.accessToken);
        return http(original);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default http;
