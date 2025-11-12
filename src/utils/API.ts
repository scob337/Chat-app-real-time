// api.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true // مهم جداً لإرسال واستقبال الكوكيز
});

// إضافة interceptor للتعامل مع انتهاء صلاحية التوكن
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // محاولة تجديد التوكن
        await api.post('/auth/refresh');
        // إعادة المحاولة مع التوكن الجديد
        return api(originalRequest);
      } catch (refreshError) {
        // إذا فشل التجديد، مسح البيانات المحلية وتوجيه للدخول
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
