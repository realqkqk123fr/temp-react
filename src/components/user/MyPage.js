import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './MyPage.css';

const MyPage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    age: '',
    height: '',
    weight: '',
    habit: '',
    preference: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 사용자 정보 불러오기
  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingProfile(true);
      
      try {
        // App.js에서 전달받은 사용자 정보가 있으면 사용
        if (user && user.username) {
          setFormData({
            username: user.username || '',
            password: '', // 보안상 비밀번호는 빈 값으로 설정
            age: user.age || '',
            height: user.height || '',
            weight: user.weight || '',
            habit: user.habit || '',
            preference: user.preference || ''
          });
          setLoadingProfile(false);
          return;
        }
        
        // App.js에서 전달받은 정보가 없으면 API 호출
        const response = await authAPI.getMyProfile();
        const userData = response.data;
        
        setFormData({
          username: userData.username || '',
          password: '', // 보안상 비밀번호는 빈 값으로 설정
          age: userData.age || '',
          height: userData.height || '',
          weight: userData.weight || '',
          habit: userData.habit || '',
          preference: userData.preference || ''
        });
      } catch (err) {
        console.error('사용자 정보 로드 오류:', err);
        setError('사용자 정보를 불러오는데 실패했습니다. 다시 로그인해주세요.');
        
        // 5초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          authAPI.logout(); // 토큰 제거
          navigate('/login');
        }, 5000);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchUserData();
  }, [user, navigate]);

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
    setSuccess('');
    setLoading(true);

    // 입력 검증
    if (!formData.username) {
      setError('이름은 필수 입력 항목입니다.');
      setLoading(false);
      return;
    }

    try {
      // 숫자 필드를 실제 숫자로 변환
      const userData = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : 0,
        height: formData.height ? parseInt(formData.height, 10) : 0,
        weight: formData.weight ? parseInt(formData.weight, 10) : 0
      };

      // 비밀번호가 비어있으면 API 요청에서 제외
      if (!userData.password) {
        delete userData.password;
      }

      // 사용자 정보 업데이트 API 호출
      const response = await authAPI.updateProfile(userData);
      
      // 사용자 정보 업데이트
      if (setUser) {
        setUser(response.data);
      }
      
      setSuccess('사용자 정보가 성공적으로 업데이트되었습니다.');
    } catch (err) {
      console.error('사용자 정보 업데이트 오류:', err);
      
      if (err.response && err.response.status === 401) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        
        // 3초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          authAPI.logout(); // 토큰 제거
          navigate('/login');
        }, 3000);
      } else {
        setError('사용자 정보 업데이트에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="mypage-container">
        <div className="mypage-form-container">
          <div className="loading-spinner">사용자 정보를 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <div className="mypage-form-container">
        <h2>내 정보 관리</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">이름 *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">비밀번호 (변경 시에만 입력)</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="변경하지 않으려면 비워두세요"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="age">나이</label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="height">키 (cm)</label>
              <input
                type="number"
                id="height"
                name="height"
                value={formData.height}
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
              value={formData.weight}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="habit">식습관</label>
            <select
              id="habit"
              name="habit"
              value={formData.habit}
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
              value={formData.preference}
              onChange={handleChange}
              placeholder="선호하는 음식이나 재료를 적어주세요"
            />
          </div>
          
          <button 
            type="submit" 
            className="update-button"
            disabled={loading}
          >
            {loading ? '업데이트 중...' : '정보 업데이트'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyPage;