import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ isAuthenticated, children }) => {
  if (!isAuthenticated) {
    // 인증되지 않은 경우 로그인 페이지로 리디렉션
    return <Navigate to="/login" />;
  }
  
  // 인증된 경우 자식 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;