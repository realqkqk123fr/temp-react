import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();

  // 로그아웃 핸들러
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">레시피 AI 어시스턴트</Link>
      </div>
      
      <div className="navbar-links">
        {isAuthenticated ? (
          <>
            <Link to="/recipe/upload" className="nav-link">레시피 만들기</Link>
            <Link to="/chat" className="nav-link">AI 채팅</Link>
            <Link to="/mypage" className="nav-link">내 정보</Link>
            <button 
              onClick={handleLogout} 
              className="logout-button"
            >
              로그아웃
            </button>
            <span className="user-greeting">
              안녕하세요, {user?.username || '사용자'}님!
            </span>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">로그인</Link>
            <Link to="/register" className="nav-link">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;