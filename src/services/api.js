import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - JWT 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 401 에러 (인증 실패) & 토큰 갱신 시도하지 않은 경우
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 리프레시 토큰으로 새 액세스 토큰 요청 로직
        // 실제 구현에서는 서버에 refresh 요청을 보내야 함
        // 여기서는 간단히 로그아웃 처리
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  // 로그인
  login: async (email, password) => {
    try {
      console.log('로그인 요청:', { email, password: '보안상 생략' });
      
      const response = await api.post('/api/auth/login', { email, password });
      console.log('로그인 응답:', response);
      
      let token = null;
      
      // 1. 헤더에서 토큰 추출 시도
      const authHeader = response.headers['authorization'];
      console.log('Authorization 헤더:', authHeader);
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('헤더에서 추출된 토큰:', token.substring(0, 10) + '...');
      } 
      // 2. 응답 본문에서 토큰 추출 시도
      else if (response.data && (response.data.accessToken || typeof response.data === 'string')) {
        if (response.data.accessToken) {
          token = response.data.accessToken;
          console.log('응답 본문 객체에서 추출된 토큰:', token.substring(0, 10) + '...');
        } else if (typeof response.data === 'string' && response.data.includes('accessToken:')) {
          // "accessToken: [token]\nrefreshToken: [token]" 형식의 응답 처리
          const tokenMatch = response.data.match(/accessToken: (.*?)(?:\n|$)/);
          if (tokenMatch && tokenMatch[1]) {
            token = tokenMatch[1].trim();
            console.log('응답 본문 문자열에서 추출된 토큰:', token.substring(0, 10) + '...');
          }
        }
      }
      
      // 토큰을 찾았으면 저장
      if (token) {
        localStorage.setItem('accessToken', token);
        
        // 토큰이 제대로 저장되었는지 확인
        const savedToken = localStorage.getItem('accessToken');
        console.log('토큰 저장 확인:', savedToken ? '성공' : '실패');
        
        return response.data;
      } else {
        console.error('응답에서 토큰을 찾을 수 없습니다.');
        throw new Error('로그인 응답에서 인증 토큰을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      // 오류 세부 정보 로깅
      if (error.response) {
        console.error('서버 응답:', error.response.status, error.response.data);
      }
      throw error;
    }
  },

  // 회원가입
  register: async (userData) => {
    try {
      return await api.post('/api/auth/register', userData);
    } catch (error) {
      throw error;
    }
  },

  // 로그아웃
  logout: () => {
    console.log('로그아웃: 토큰 제거');
    localStorage.removeItem('accessToken');
  },

  // 현재 사용자 정보 가져오기
  getMyProfile: async () => {
    try {
      return await api.get('/api/mypage');
    } catch (error) {
      throw error;
    }
  },

  // 사용자 정보 업데이트
  updateProfile: async (userData) => {
    try {
      return await api.post('/api/mypage', userData);
    } catch (error) {
      throw error;
    }
  },
  
  // 토큰 확인
  checkToken: () => {
    const token = localStorage.getItem('accessToken');
    console.log('토큰 확인:', token ? '토큰 있음' : '토큰 없음');
    return !!token;
  }
};

// 레시피 관련 API
export const recipeAPI = {
  // 레시피 AI 어시스턴스 요청
  getRecipeAssistance: async (recipeId) => {
    try {
      return await api.get(`/api/recipe/${recipeId}/cooking-assistance`);
    } catch (error) {
      throw error;
    }
  },

  // 레시피 영양 정보 가져오기
  getNutrition: async (recipeId) => {
    try {
      return await api.get(`/api/recipe/${recipeId}/nutrition`);
    } catch (error) {
      throw error;
    }
  },

  // 레시피 만족도 평가 제출
  submitSatisfaction: async (recipeId, satisfactionData) => {
    try {
      return await api.post(`/api/recipe/${recipeId}/satisfaction`, satisfactionData);
    } catch (error) {
      throw error;
    }
  },

  // 레시피 생성 API
  generateRecipe: async (image, instructions) => {
    const formData = new FormData();
    formData.append('image', image);
    formData.append('instructions', instructions);
    
    console.log("FormData contents:", {
      image: image ? image.name : 'no image',
      instructions
    });
    
    try {
      const response = await api.post('/api/recipe/generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("Recipe generation successful:", response.data);
      return response;
    } catch (error) {
      console.error("Recipe generation API error:", error);
      throw error;
    }
  },

  // 대체 재료 API
  substituteIngredient: async (substituteData) => {
    try {
      return await api.post('/api/recipe/substitute', substituteData);
    } catch (error) {
      throw error;
    }
  }
};

export default api;