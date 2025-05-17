import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

const Login = ({ onLoginSuccess }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  // location state에서 메시지 표시
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccess(location.state.message);
      
      // 상태 지우기 (새로고침 시 메시지가 다시 표시되지 않도록)
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 폼 제출 핸들러
  // Login.js의 handleSubmit 함수 일부 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // 입력 검증
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      // 로그인 API 호출
      console.log('로그인 시도:', { email, password: '보안상 생략' });
      const response = await authAPI.login(email, password);
    
      // 토큰 확인
      const token = localStorage.getItem('accessToken');
      console.log('로그인 후 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
    
      if (!token) {
        throw new Error('로그인 후 인증 토큰이 저장되지 않았습니다.');
      }
    
      setSuccess('로그인에 성공했습니다.');
    
      // 기본 사용자 정보 생성
      const userData = {
        email: email,
        username: response.username || email.split('@')[0]  // 응답에 username이 있으면 사용, 없으면 이메일에서 추출
      };
    
      // 잠시 후 리다이렉션
      setTimeout(async () => {
        // 로그인 성공 처리
        if (onLoginSuccess) {
          const success = await onLoginSuccess(userData);
          if (success) {
            navigate('/chat');
          }
        } else {
          navigate('/chat');
        }
      }, 1000);
    } catch (err) {
      console.error('로그인 오류:', err);
    
      // 오류 메시지 표시
      if (err.response && err.response.status === 401) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setError('로그인에 실패했습니다. ' + (err.message || '다시 시도해주세요.'));
      }
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>로그인</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            계정이 없으신가요? <Link to="/register">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;