// services/authService.ts
import api from "./API";

export const login = async (phone: string, password: string) => {
  try {
    console.log('📞 Sending login request...');
    const response = await api.post("/auth/login", {
      phone,
      password,
    });

    const { user } = response.data;
    
    if (user) {
      console.log('✅ Login response received');
      // حفظ بيانات المستخدم في localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      return user;
    } else {
      throw new Error('No user data received');
    }
  } catch (error) {
    console.error('❌ Login service error:', error);
    throw error;
  }
};

export const register = async (name: string, phone: string, password: string) => {
  try {
    console.log('📝 Sending register request...');
    const response = await api.post("/auth/register", {
      name,
      phone,
      password,
    });

    const { user } = response.data;
    if (user) {
      return user;
    } else {
      throw new Error('No user data received');
    }
  } catch (error) {
    console.error('❌ Register service error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    console.log('🚪 Sending logout request...');
    await api.post("/auth/logout");
  } catch (error) {
    console.error('❌ Logout error:', error);
  } finally {
    // مسح البيانات المحلية في جميع الأحوال
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem('lastLoginTime');
    window.location.href = '/login';
  }
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem("user");
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    
    if (user && lastLoginTime) {
      // التحقق من أن آخر تسجيل دخول لم يكن منذ أكثر من 30 يوماً (بدلاً من 7)
      const loginDate = new Date(lastLoginTime);
      const now = new Date();
      const daysDiff = (now.getTime() - loginDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysDiff > 30) {
        console.log('⏰ Login session expired (>30 days)');
        localStorage.removeItem("user");
        localStorage.removeItem('lastLoginTime');
        return null;
      }
      
      return JSON.parse(user);
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
};

export const refreshToken = async () => {
  try {
    console.log('🔄 Refreshing token...');
    await api.post('/auth/refresh');
    return true;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    return false;
  }
};
