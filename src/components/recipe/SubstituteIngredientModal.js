import React, { useState } from 'react';
import { recipeAPI } from '../../services/api';
import './RecipeModals.css';

const SubstituteIngredientModal = ({ recipeName, recipeId, onClose, onSuccess }) => {
  const [originalIngredient, setOriginalIngredient] = useState('');
  const [substituteIngredient, setSubstituteIngredient] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newRecipe, setNewRecipe] = useState(null);

  // 원래 재료 입력 핸들러
  const handleOriginalChange = (e) => {
    setOriginalIngredient(e.target.value);
  };

  // 대체 재료 입력 핸들러
  const handleSubstituteChange = (e) => {
    setSubstituteIngredient(e.target.value);
  };

  // 대체 재료 요청 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!originalIngredient.trim() || !substituteIngredient.trim()) {
      setError('원래 재료와 대체 재료를 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 대체 재료 API 호출
      const response = await recipeAPI.substituteIngredient({
        originalIngredient,
        substituteIngredient,
        recipeName,
        recipeId
      });
      
      // 응답 확인
      const responseData = response.data;
      
      // 대체 불가 메시지 확인
      const isSubstituteFailure = !responseData || 
        (responseData.description && (
          responseData.description.includes("적절하지 않") || 
          responseData.description.includes("생성할 수 없"))) || 
        (!responseData.ingredients || responseData.ingredients.length === 0) ||
        (!responseData.instructions || responseData.instructions.length === 0);
      
      if (isSubstituteFailure) {
        // 대체 재료 사용 실패로 처리
        const errorMessage = responseData?.description || 
                            `${originalIngredient}를 ${substituteIngredient}로 대체할 수 없습니다.`;
        
        setError(errorMessage);
        
        // 실패 정보를 포함하여 콜백 호출 (채팅에 오류 메시지 표시용)
        if (onSuccess) {
          onSuccess({
            success: false,
            message: errorMessage,
            description: responseData?.description
          });
        }
        
        return;
      }
      
      // 성공 처리
      setNewRecipe(responseData);
      setSuccess(true);
      
      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess({
          ...responseData,
          success: true
        });
      }
    } catch (err) {
      console.error('대체 재료 요청 오류:', err);
      const errorMessage = '대체 재료 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
      setError(errorMessage);
      
      // 오류 정보를 포함하여 콜백 호출
      if (onSuccess) {
        onSuccess({
          success: false,
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content substitute-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{recipeName} - 대체 재료</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {success ? (
            <div className="success-container">
              <div className="success-icon">✓</div>
              <h4>대체 레시피가 생성되었습니다!</h4>
              <p>
                <strong>{originalIngredient}</strong>를 
                <strong>{substituteIngredient}</strong>로 대체한 
                레시피: <strong>{newRecipe.name}</strong>
              </p>
              <p className="recipe-description">{newRecipe.description}</p>
              
              <div className="ingredients-list">
                <h5>재료</h5>
                <ul>
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <li key={index}>
                      {ingredient.name} {ingredient.amount}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button className="close-modal-button" onClick={onClose}>
                닫기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="substitute-form">
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="originalIngredient">대체할 재료</label>
                <input
                  type="text"
                  id="originalIngredient"
                  value={originalIngredient}
                  onChange={handleOriginalChange}
                  placeholder="예: 버터, 당근, 밀가루"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="substituteIngredient">대체 재료</label>
                <input
                  type="text"
                  id="substituteIngredient"
                  value={substituteIngredient}
                  onChange={handleSubstituteChange}
                  placeholder="예: 마가린, 시금치, 쌀가루"
                  required
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="cancel-button"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? '처리 중...' : '대체 레시피 생성'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubstituteIngredientModal;