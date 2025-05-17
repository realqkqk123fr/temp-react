import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    habit: '',
    preference: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { username, email, password, age, height, weight, habit, preference } = formData;

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 숫자 필드의 경우 숫자만 입력 가능하도록
    if (['age', 'height', 'weight'].includes(name)) {
      if (value === '' || /^\d+$/.test(value)) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 입력 검증
    if (!username || !email || !password) {
      setError('이름, 이메일, 비밀번호는 필수 입력 항목입니다.');
      setLoading(false);
      return;
    }

    try {
      // 숫자 필드를 실제 숫자로 변환
      const userData = {
        ...formData,
        age: age ? parseInt(age, 10) : 0,
        height: height ? parseInt(height, 10) : 0,
        weight: weight ? parseInt(weight, 10) : 0
      };

      // 회원가입 API 호출
      await authAPI.register(userData);
      
      // 회원가입 성공 시 로그인 페이지로 이동
      navigate('/login', { state: { message: '회원가입이 완료되었습니다. 로그인해주세요.' } });
    } catch (err) {
      console.error('회원가입 오류:', err);
      
      if (err.response && err.response.status === 409) {
        setError('이미 사용 중인 이메일입니다.');
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container register-form">
        <h2>회원가입</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">이름 *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">이메일 *</label>
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
            <label htmlFor="password">비밀번호 *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="age">나이</label>
              <input
                type="number"
                id="age"
                name="age"
                value={age}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="height">키 (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={height}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="weight">몸무게 (kg)</label>
            <input
              type="number"
              id="weight"
              name="weight"
              value={weight}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="habit">식습관</label>
            <select
              id="habit"
              name="habit"
              value={habit}
              onChange={handleChange}
            >
              <option value="">선택하세요</option>
              <option value="균형잡힌식단">균형잡힌 식단</option>
              <option value="채식주의">채식주의</option>
              <option value="비건">비건</option>
              <option value="저탄수화물">저탄수화물</option>
              <option value="고단백">고단백</option>
              <option value="기타">기타</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="preference">음식 선호도</label>
            <textarea
              id="preference"
              name="preference"
              value={preference}
              onChange={handleChange}
              placeholder="선호하는 음식이나 재료를 적어주세요"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;