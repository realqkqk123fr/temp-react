import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';

// 컴포넌트 import
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/common/Navbar';
import MyPage from './components/user/MyPage';
import RecipeChat from './components/chat/RecipeChat';
import ProtectedRoute from './components/common/ProtectedRoute';
import RecipeUpload from './components/recipe/RecipeUpload';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authCheckError, setAuthCheckError] = useState(null);

  // 앱 시작 시 사용자 인증 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('accessToken');
      console.log('App.js - 인증 상태 확인:', token ? '토큰 있음' : '토큰 없음');
      
      if (token) {
        try {
          // 사용자 정보 가져오기
          const response = await authAPI.getMyProfile();
          console.log('사용자 정보 로드 성공:', response.data);
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('인증 확인 오류:', error);
          setAuthCheckError(error.message || '인증 확인 중 오류가 발생했습니다.');
          
          // 오류 시 토큰 제거
          localStorage.removeItem('accessToken');
          setIsAuthenticated(false);
        }
      } else {
        console.log('저장된 토큰 없음');
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // 로그인 핸들러
  const handleLogin = async (userData) => {
    try {
      console.log('로그인 핸들러 호출:', userData);
      
      // 토큰 확인
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('로그인 후 토큰이 저장되지 않았습니다.');
        setAuthCheckError('로그인에 성공했지만 인증 토큰이 저장되지 않았습니다.');
        return false;
      }
      
      // 사용자 정보 가져오기 시도
      try {
        const response = await authAPI.getMyProfile();
        console.log('로그인 후 사용자 정보 로드:', response.data);
        setUser(response.data);
      } catch (profileError) {
        console.error('사용자 정보 로드 오류:', profileError);
        // 사용자 정보 로드 실패 시 기본 정보 설정
        setUser({ 
          username: userData?.username || '사용자',
          email: userData?.email || 'unknown'
        });
        
        // 경고 메시지 설정 (선택적)
        setAuthCheckError('로그인은 성공했지만 사용자 정보를 불러오는데 실패했습니다.');
      }
      
      // 토큰이 있으면 인증 성공으로 처리
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('로그인 핸들러 오류:', error);
      setAuthCheckError(error.message || '로그인 처리 중 오류가 발생했습니다.');
      setIsAuthenticated(false);
      return false;
    }
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    console.log('로그아웃 핸들러 호출');
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar 
          isAuthenticated={isAuthenticated} 
          user={user} 
          onLogout={handleLogout} 
        />
        
        {authCheckError && (
          <div className="auth-error-banner">
            {authCheckError}
          </div>
        )}
        
        <div className="container">
          <Routes>
            {/* 공개 경로 */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/chat" /> : 
                <Login onLoginSuccess={handleLogin} />
              } 
            />
            
            <Route 
              path="/register" 
              element={
                isAuthenticated ? 
                <Navigate to="/chat" /> : 
                <Register />
              } 
            />
            
            {/* 보호된 경로 */}
            <Route 
              path="/mypage" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <MyPage user={user} setUser={setUser} />
                </ProtectedRoute>
              } 
            />

            {/* 레시피 업로드 페이지 추가 (보호된 경로) */}
            <Route 
              path="/recipe/upload" 
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <RecipeUpload user={user} />
                </ProtectedRoute>
              } 
            />
            
            {/* 채팅은 보호된 경로가 아님 - 인증되지 않은 사용자도 볼 수 있음 */}
            <Route 
              path="/chat" 
              element={<RecipeChat user={user} isAuthenticated={isAuthenticated} />}
            />
            
            {/* 기본 리다이렉트를 레시피 업로드 페이지로 변경 (인증된 경우) */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                <Navigate to="/recipe/upload" /> : 
                <Navigate to="/chat" />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;