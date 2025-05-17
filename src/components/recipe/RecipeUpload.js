import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recipeAPI } from '../../services/api';
import './RecipeUpload.css';

const RecipeUpload = ({ user }) => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 이미지 선택 핸들러 수정
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        const selectedFile = e.target.files[0];
        
        // 파일 확장자 추출
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        
        // 새 파일 이름 생성 (타임스탬프 + 랜덤 숫자 + 확장자)
        const timestamp = new Date().getTime();
        const randomNum = Math.floor(Math.random() * 1000);
        const newFileName = `image_${timestamp}_${randomNum}.${fileExtension}`;
        
        // 파일 객체 복제 및 이름 변경 (File 객체는 직접 수정할 수 없으므로 새 객체 생성)
        const renamedFile = new File([selectedFile], newFileName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified,
        });
        
        setImage(renamedFile);
        
        // 이미지 미리보기 생성
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
        setImagePreview(loadEvent.target.result);
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  // 지시사항 변경 핸들러
  const handleInstructionsChange = (e) => {
    setInstructions(e.target.value);
  };

  // 레시피 생성 요청 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!image) {
        setError('이미지를 업로드해주세요.');
        return;
    }
    
    if (!instructions.trim()) {
        setError('지시사항을 입력해주세요.');
        return;
    }
    
    setLoading(true);
    setError('');
    
    try {
        console.log("Sending recipe generation request:", { image, instructions });
        
        // 레시피 생성 API 호출
        const response = await recipeAPI.generateRecipe(image, instructions);
        console.log("Recipe generation response:", response.data);
        
        // 채팅 화면으로 이동하면서 생성된 레시피 데이터 전달
        navigate('/chat', { 
        state: { 
            generatedRecipe: response.data,
            fromRecipeUpload: true
        } 
        });
    } catch (err) {
        console.error('레시피 생성 오류:', err);
        
        // 오류 응답 상세 정보 출력
        if (err.response) {
        console.error('Error response:', err.response.data);
        }
        
        setError('레시피 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="recipe-upload-container">
      <div className="recipe-upload-card">
        <h2>레시피 생성하기</h2>
        <p className="recipe-upload-description">
          재료 이미지를 업로드하고 원하는 레시피에 대한 지시사항을 입력해주세요.
        </p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="recipe-upload-form">
          <div className="image-upload-section">
            <label className="image-upload-label">
              <div className={`image-upload-area ${imagePreview ? 'with-preview' : ''}`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="미리보기" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="upload-icon">+</i>
                    <p>재료 이미지 업로드</p>
                    <p className="upload-hint">클릭하여 이미지 선택</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="image-input"
              />
            </label>
            
            {imagePreview && (
              <button 
                type="button" 
                className="change-image-button"
                onClick={() => {
                  setImage(null);
                  setImagePreview('');
                }}
              >
                이미지 변경
              </button>
            )}
          </div>
          
          <div className="instructions-section">
            <label htmlFor="instructions" className="instructions-label">
              지시사항
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={handleInstructionsChange}
              placeholder="원하는 레시피에 대한 지시사항을 입력해주세요. (예: '간단한 저녁 식사', '건강한 샐러드', '30분 안에 만들 수 있는 요리')"
              className="instructions-input"
              rows={5}
            />
          </div>
          
          <button 
            type="submit" 
            className="generate-button"
            disabled={loading}
          >
            {loading ? '레시피 생성 중...' : '레시피 생성하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecipeUpload;