import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import chatService from '../../services/chatService';
import { authAPI, recipeAPI } from '../../services/api';
import SubstituteIngredientModal from '../recipe/SubstituteIngredientModal';
import './RecipeChat.css';

// 영양 정보 모달 컴포넌트
function NutritionModal({ nutrition, recipeName, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content nutrition-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{recipeName}의 영양 정보</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="nutrition-content">
          <div className="nutrition-item main-nutrition">
            <div className="nutrition-value">{nutrition.calories}</div>
            <div className="nutrition-label">칼로리 (kcal)</div>
          </div>
          
          <div className="nutrition-row">
            <div className="nutrition-item">
              <div className="nutrition-value">{nutrition.carbohydrate}g</div>
              <div className="nutrition-label">탄수화물</div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-value">{nutrition.protein}g</div>
              <div className="nutrition-label">단백질</div>
            </div>
            <div className="nutrition-item">
              <div className="nutrition-value">{nutrition.fat}g</div>
              <div className="nutrition-label">지방</div>
            </div>
          </div>
          
          <div className="nutrition-details">
            <h4>상세 영양 정보</h4>
            <table>
              <tbody>
                <tr>
                  <td>당류</td>
                  <td>{nutrition.sugar}g</td>
                </tr>
                <tr>
                  <td>나트륨</td>
                  <td>{nutrition.sodium}mg</td>
                </tr>
                <tr>
                  <td>포화지방</td>
                  <td>{nutrition.saturatedFat}g</td>
                </tr>
                <tr>
                  <td>트랜스지방</td>
                  <td>{nutrition.transFat}g</td>
                </tr>
                <tr>
                  <td>콜레스테롤</td>
                  <td>{nutrition.cholesterol}mg</td>
                </tr>
                {nutrition.dietaryFiber && (
                  <tr>
                    <td>식이섬유</td>
                    <td>{nutrition.dietaryFiber}g</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {(nutrition.vitaminA || nutrition.vitaminC || nutrition.calcium || nutrition.iron) && (
            <div className="nutrition-vitamins">
              <h4>비타민 및 미네랄</h4>
              <div className="vitamin-bars">
                {nutrition.vitaminA && (
                  <div className="vitamin-bar">
                    <div className="vitamin-name">비타민 A</div>
                    <div className="vitamin-bar-container">
                      <div className="vitamin-bar-fill" style={{ width: `${nutrition.vitaminA}%` }}></div>
                    </div>
                    <div className="vitamin-value">{nutrition.vitaminA}%</div>
                  </div>
                )}
                {nutrition.vitaminC && (
                  <div className="vitamin-bar">
                    <div className="vitamin-name">비타민 C</div>
                    <div className="vitamin-bar-container">
                      <div className="vitamin-bar-fill" style={{ width: `${nutrition.vitaminC}%` }}></div>
                    </div>
                    <div className="vitamin-value">{nutrition.vitaminC}%</div>
                  </div>
                )}
                {nutrition.calcium && (
                  <div className="vitamin-bar">
                    <div className="vitamin-name">칼슘</div>
                    <div className="vitamin-bar-container">
                      <div className="vitamin-bar-fill" style={{ width: `${nutrition.calcium}%` }}></div>
                    </div>
                    <div className="vitamin-value">{nutrition.calcium}%</div>
                  </div>
                )}
                {nutrition.iron && (
                  <div className="vitamin-bar">
                    <div className="vitamin-name">철분</div>
                    <div className="vitamin-bar-container">
                      <div className="vitamin-bar-fill" style={{ width: `${nutrition.iron}%` }}></div>
                    </div>
                    <div className="vitamin-value">{nutrition.iron}%</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 요리 어시스턴스 컴포넌트
function CookingAssistant({ recipe, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const steps = recipe && recipe.instructions ? recipe.instructions : [];
  
  // 타이머 설정
  const startTimer = (seconds) => {
    if (isTimerRunning) return;
    
    setTimeRemaining(seconds);
    setIsTimerRunning(true);
    
    const interval = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          // 타이머 완료 시 알림음
          const audio = new Audio('/timer-alarm.mp3');
          audio.play().catch(e => console.log('타이머 알림음 재생 오류:', e));
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    setTimer(interval);
  };
  
  // 타이머 취소
  const cancelTimer = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setIsTimerRunning(false);
    setTimeRemaining(0);
  };
  
  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [timer]);
  
  // 다음 단계로 이동
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      if (isTimerRunning) {
        cancelTimer();
      }
    }
  };
  
  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (isTimerRunning) {
        cancelTimer();
      }
    }
  };
  
  // 현재 단계 표시 형식
  const formatStepCount = () => {
    return `${currentStep + 1}/${steps.length}`;
  };
  
  // 시간 형식 변환 (초 -> 분:초)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content cooking-assistant-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{recipe.name || '레시피'} 요리 어시스턴스</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="cooking-steps">
          <div className="step-navigation">
            <button 
              onClick={goToPrevStep} 
              disabled={currentStep === 0}
              className="step-button prev-button"
            >
              이전
            </button>
            <div className="step-counter">{formatStepCount()}</div>
            <button 
              onClick={goToNextStep} 
              disabled={currentStep === steps.length - 1}
              className="step-button next-button"
            >
              다음
            </button>
          </div>
          
          <div className="step-container">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`step-item ${index === currentStep ? 'active' : ''}`}
                style={{ display: index === currentStep ? 'block' : 'none' }}
              >
                <div className="step-header">
                  <h4>Step {step.step || index + 1}</h4>
                  <div className="step-time">{step.cookingTime || 0}분</div>
                </div>
                <p className="step-instruction">{step.text || step.instruction}</p>
                
                <div className="timer-controls">
                  {!isTimerRunning ? (
                    <button 
                      onClick={() => startTimer((step.cookingTime || 0) * 60)}
                      className="timer-button"
                    >
                      {step.cookingTime || 0}분 타이머 시작
                    </button>
                  ) : (
                    <div className="timer-running">
                      <div className="timer-display">{formatTime(timeRemaining)}</div>
                      <button onClick={cancelTimer} className="timer-cancel-button">
                        취소
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* 재료 사이드바 */}
          <div className="ingredients-sidebar">
            <h4>재료</h4>
            <ul className="ingredients-list">
              {(recipe.ingredients || []).map((ingredient, index) => (
                <li key={index} className="ingredient-item">
                  <span className="ingredient-name">{ingredient.name || '재료'}</span>
                  <span className="ingredient-amount">
                    {ingredient.amount || '적당량'} {ingredient.unit || ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 만족도 평가 모달 컴포넌트
function SatisfactionModal({ recipeId, recipeName, onClose, onSubmitSuccess }) {
  const [rating, setRating] = useState(5); // 기본값 5점
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // 별점 변경 핸들러
  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };
  
  // 코멘트 변경 핸들러
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };
  
  // 만족도 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 로딩 상태 설정
    setLoading(true);
    setError(null);
    
    try {
      // 만족도 데이터 생성
      const satisfactionData = {
        rate: rating,
        comment: comment
      };
      
      // API 호출
      await recipeAPI.submitSatisfaction(recipeId, satisfactionData);
      
      // 성공 처리
      setSuccess(true);
      
      // 부모 컴포넌트에 성공 알림
      if (onSubmitSuccess) {
        setTimeout(() => {
          onSubmitSuccess();
          onClose();
        }, 1500);
      } else {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
      
    } catch (err) {
      console.error('만족도 평가 제출 오류:', err);
      setError(err.message || '만족도 평가 제출에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content satisfaction-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{recipeName} 만족도 평가</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="satisfaction-content">
          {success ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>만족도 평가가 성공적으로 제출되었습니다!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="rating-container">
                <p className="rating-label">별점을 선택해주세요:</p>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= rating ? 'filled' : 'empty'}`}
                      onClick={() => handleRatingChange(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div className="rating-text">{rating}/5</div>
              </div>
              
              <div className="comment-container">
                <label htmlFor="comment">코멘트 (선택사항):</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="레시피에 대한 의견을 남겨주세요..."
                  rows="4"
                ></textarea>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={onClose}
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? '제출 중...' : '평가 제출'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// 레시피 메시지 컴포넌트 (대체 재료 기능 추가)
function RecipeMessage({ message, onNewRecipe }) {
  const [showNutrition, setShowNutrition] = useState(false);
  const [showAssistance, setShowAssistance] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showSubstitute, setShowSubstitute] = useState(false); // 대체 재료 모달 상태 추가
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [satisfactionSubmitted, setSatisfactionSubmitted] = useState(false);
  
  // 영양 정보 가져오기
  const fetchNutrition = async () => {
    if (!message.recipeId) return;
    
    setLoading(true);
    try {
      // 영양 정보 API 호출
      const response = await recipeAPI.getNutrition(message.recipeId);
      setNutritionData(response.data);
      setShowNutrition(true);
    } catch (err) {
      setError('영양 정보를 가져오는데 실패했습니다.');
      console.error('영양 정보 가져오기 오류:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 만족도 제출 성공 처리
  const handleSatisfactionSuccess = () => {
    setSatisfactionSubmitted(true);
  };
  
  // 대체 레시피 생성 성공 처리
  const handleSubstituteSuccess = (newRecipe) => {
    // 부모 컴포넌트에 새 레시피 전달
    if (onNewRecipe) {
      onNewRecipe(newRecipe);
    }
  };
  
  // 메시지 구조 디버깅 로그
  console.log('RecipeMessage - 메시지:', message);
  console.log('RecipeMessage - 레시피:', message.recipe);

  if (message.recipe && message.recipe.ingredients) {
    console.log('재료 목록:', message.recipe.ingredients);
  }

  if (message.recipe && message.recipe.instructions) {
    console.log('조리 단계:', message.recipe.instructions);
  }

  
  // 일반 메시지 또는 레시피가 없는 경우
  if (!message.recipe || typeof message.recipe !== 'object') {
    console.warn('유효하지 않은 레시피 데이터:', message.recipe);
    return <div className="message-text">{message.message || '내용 없음'}</div>;
  }
  
  return (
    <div className="recipe-message">
      <div className="message-text">{message.message}</div>
      
      <div className="recipe-card">
        <h3>{message.recipe.name || '이름 없는 레시피'}</h3>
        <p>{message.recipe.description || '설명이 없습니다.'}</p>

        {/* 재료 목록 직접 표시 */}
        <div className="recipe-ingredients">
          <h4>재료</h4>
          <ul>
            {Array.isArray(message.recipe.ingredients) && message.recipe.ingredients.map((ingredient, idx) => (
              <li key={idx}>{ingredient.name} {ingredient.amount}</li>
            ))}
          </ul>
        </div>
        
        {/* 조리 단계 직접 표시 */}
        <div className="recipe-steps">
          <h4>조리 방법</h4>
          <ol>
            {Array.isArray(message.recipe.instructions) && message.recipe.instructions.map((step, idx) => (
              <li key={idx}>{step.text}</li>
            ))}
          </ol>
        </div>
              
        <div className="recipe-meta">
          <span>소요시간: {message.recipe.totalTime || '30'}분</span>
          <span>난이도: {message.recipe.difficulty || '중간'}</span>
          <span>인분: {message.recipe.servings || '2인분'}</span>
        </div>
        
        <div className="recipe-actions">
          <button 
            onClick={fetchNutrition}
            disabled={loading}
            className="recipe-button nutrition-button"
          >
            {loading ? '로딩중...' : '영양 정보'}
          </button>
          
          <button 
            onClick={() => setShowAssistance(true)}
            className="recipe-button assistance-button"
          >
            요리 어시스턴스
          </button>
          
          <button 
            onClick={() => setShowSatisfaction(true)}
            className={`recipe-button satisfaction-button ${satisfactionSubmitted ? 'submitted' : ''}`}
            disabled={satisfactionSubmitted}
          >
            {satisfactionSubmitted ? '평가 완료' : '레시피 평가'}
          </button>
          
          {/* 대체 재료 버튼 추가 */}
          <button 
            onClick={() => setShowSubstitute(true)}
            className="recipe-button substitute-button"
          >
            대체 재료
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {/* 영양 정보 모달 */}
        {showNutrition && nutritionData && (
          <NutritionModal 
            nutrition={nutritionData} 
            recipeName={message.recipe.name}
            onClose={() => setShowNutrition(false)} 
          />
        )}
        
        {/* 요리 어시스턴스 모달 */}
        {showAssistance && message.recipe.instructions && message.recipe.instructions.length > 0 && (
          <CookingAssistant 
            recipe={message.recipe}
            onClose={() => setShowAssistance(false)} 
          />
        )}
        
        {/* 만족도 평가 모달 */}
        {showSatisfaction && (
          <SatisfactionModal
            recipeId={message.recipeId}
            recipeName={message.recipe.name}
            onClose={() => setShowSatisfaction(false)}
            onSubmitSuccess={handleSatisfactionSuccess}
          />
        )}
        
        {/* 대체 재료 모달 추가 */}
        {showSubstitute && (
          <SubstituteIngredientModal
            recipeId={message.recipeId}
            recipeName={message.recipe.name}
            onClose={() => setShowSubstitute(false)}
            onSuccess={handleSubstituteSuccess}
          />
        )}
      </div>
    </div>
  );
}

// 메인 RecipeChat 컴포넌트
const RecipeChat = ({ user, isAuthenticated }) => {
  const location = useLocation(); // useLocation 추가
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [recipeProcessed, setRecipeProcessed] = useState(false); // 레시피 처리 상태 추가
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // 레시피 총 소요시간 계산 함수 - 더 견고하게 수정
  const calculateTotalTime = (instructions) => {
    if (!instructions || !Array.isArray(instructions)) {
      console.warn('유효하지 않은 instructions 데이터:', instructions);
      return 30; // 기본값
    }
    
    // 모든 단계의 조리 시간 합산
    try {
      const totalMinutes = instructions.reduce((total, instruction) => {
        // cookingTime을 안전하게 추출
        const cookingTime = instruction && typeof instruction === 'object' 
          ? (instruction.cookingTime || 0) 
          : 0;
        return total + cookingTime;
      }, 0);
      
      return totalMinutes || 30; // 합계가 0이면 기본값 30분
    } catch (error) {
      console.error('조리 시간 계산 오류:', error);
      return 30; // 오류 발생 시 기본값
    }
  };

  // 레시피 처리 함수 - 재사용 가능하게 분리
  const processRecipeData = (recipe) => {
    if (!recipe) return null;
    
    console.log("레시피 처리 함수 호출:", recipe);
    
    // 레시피 데이터 구조 자세히 확인
    console.log("Recipe name:", recipe.name);
    console.log("Recipe description:", recipe.description);
    console.log("Recipe ingredients:", recipe.ingredients);
    console.log("Recipe instructions:", recipe.instructions);
    
    // instructions 필드 상세 확인
    if (recipe.instructions && recipe.instructions.length > 0) {
      console.log("First instruction:", recipe.instructions[0]);
      console.log("instruction 필드 존재?", 'instruction' in recipe.instructions[0]);
      console.log("stepNumber 필드 존재?", 'stepNumber' in recipe.instructions[0]);
      console.log("text 필드 존재?", 'text' in recipe.instructions[0]);
      console.log("step 필드 존재?", 'step' in recipe.instructions[0]);
    } else {
      console.warn("Recipe instructions is null, undefined or empty!");
    }

    // 레시피 지시사항 매핑 - 더 견고한 방식
    // Flask/Spring에서 오는 instruction, stepNumber를 
    // 리액트가 기대하는 text, step으로 변환
    const mappedInstructions = Array.isArray(recipe.instructions) 
      ? recipe.instructions.map((inst, index) => ({
          step: inst.stepNumber || inst.step || index + 1, // stepNumber, step 필드 확인 또는 인덱스+1 사용
          text: inst.instruction || inst.text || "조리 단계", // instruction, text 필드 확인 또는 기본값 사용
          cookingTime: inst.cookingTime || 5 // cookingTime 필드 확인 또는 기본값 사용
        }))
      : [];  // instructions가 배열이 아니면 빈 배열로 설정
    
    console.log("변환된 instructions:", mappedInstructions);
    
    // 메시지 배열에 추가할 레시피 메시지
    const recipeMessages = [
      {
        username: 'system',
        message: '새로운 레시피가 생성되었습니다!'
      },
      {
        username: 'AI 요리사',
        message: `요청하신 레시피를 생성했습니다: ${recipe.name || '새 레시피'}`,
        recipe: {
          name: recipe.name || '이름 없는 레시피',
          description: recipe.description || '설명 없음',
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          instructions: mappedInstructions,
          totalTime: calculateTotalTime(recipe.instructions) || 30,
          difficulty: '중간',
          servings: '2인분'
        },
        recipeId: recipe.id
      }
    ];
    
    return recipeMessages;
  };

  // 레시피 처리 및 추가 함수
  const processAndAddRecipe = (recipe) => {
    console.log("processAndAddRecipe 함수 호출:", recipe);
    
    // 이미 처리된 경우 중복 처리 방지
    if (recipeProcessed) {
      console.log("이미 레시피가 처리됨, 중복 처리 방지");
      return;
    }
    
    const recipeMessages = processRecipeData(recipe);
    if (!recipeMessages) {
      console.warn("유효한 레시피 메시지를 생성할 수 없음");
      return;
    }
    
    // 메시지 추가
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, ...recipeMessages];
      console.log("레시피 추가 후 최종 메시지 목록:", newMessages);
      return newMessages;
    });
    
    // 레시피 처리 완료 표시
    setRecipeProcessed(true);
    console.log("레시피 처리 완료 설정");
  };

  // 채팅 WebSocket 연결 설정
  const setupChatConnection = () => {
    // 연결 성공 콜백
    const onConnected = () => {
      setConnecting(false);
      setConnectionError(false);
      
      // 시스템 메시지 추가
      setMessages(prevMessages => [
        ...prevMessages,
        {
          username: 'system',
          message: '채팅 서버에 연결되었습니다. 레시피에 대해 질문해보세요!'
        }
      ]);
      
      // 인증 상태에 따른 메시지
      if (!chatService.isAuthenticated()) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            username: 'system',
            message: '로그인하시면 개인화된 답변을 받을 수 있습니다.'
          }
        ]);
      }
    };

    // 연결 오류 콜백
    const onError = (error) => {
      console.error('WebSocket 연결 오류:', error);
      setConnecting(false);
      setConnectionError(true);
      
      // 시스템 오류 메시지 추가
      setMessages(prevMessages => [
        ...prevMessages,
        {
          username: 'system',
          message: '채팅 서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
        }
      ]);
    };

    // 메시지 수신 콜백 함수
    const messageCallback = (message) => {
      console.log('채팅 메시지 수신:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    };

    // 메시지 수신 콜백 등록
    chatService.registerMessageCallback(messageCallback);
    
    // WebSocket 연결
    chatService.connect(onConnected, onError);

    // 컴포넌트 언마운트 시 연결 해제를 위한 cleanup 함수 반환
    return () => {
      console.log('채팅 컴포넌트 정리 - 콜백 해제 및 연결 종료');
      chatService.unregisterMessageCallback(messageCallback);
      chatService.disconnect();
    };
  };

  // 컴포넌트 마운트 시 한 번만 실행 - 초기 설정 및 레시피 데이터 처리
  useEffect(() => {
    console.log("컴포넌트 마운트 시 최초 1회 실행");
    console.log("초기 location.state:", location.state);
    
    // 시스템 메시지를 초기화
    setMessages([
      {
        username: 'system',
        message: '채팅 서버에 연결 중...'
      }
    ]);

    // WebSocket 연결 및 이벤트 핸들러 설정
    const cleanup = setupChatConnection();
    
    return () => {
      cleanup();
    };
  }, []); // 빈 의존성 배열 - 컴포넌트 마운트 시 한 번만 실행

  // location.state가 변경될 때마다 실행 - React Router 이동 시
  useEffect(() => {
    console.log("location.state 변경 감지:", location.state);
    
    if (location.state?.generatedRecipe && location.state?.fromRecipeUpload && !recipeProcessed) {
      console.log("location.state 변경으로 레시피 처리 시작");
      processAndAddRecipe(location.state.generatedRecipe);
      
      // 브라우저 히스토리에서 상태 제거 (새로고침 시 중복 표시 방지)
      window.history.replaceState({}, document.title);
    }
  }, [location, location.state, recipeProcessed]); // location과 location.state에 의존

  // 메시지 목록이 업데이트될 때 스크롤 아래로 이동
  useEffect(() => {
    // 메시지 상태 디버깅
    console.log('현재 메시지 목록:', messages);
    
    // 레시피 메시지 필터링
    const recipeMessages = messages.filter(msg => msg.recipe);
    console.log('레시피 포함 메시지:', recipeMessages);
    
    scrollToBottom();
  }, [messages]);

  // 이미지 선택 핸들러
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImagePreview(loadEvent.target.result);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  // 이미지 선택 버튼 클릭 핸들러
  const handleImageButtonClick = () => {
    fileInputRef.current.click();
  };

  // 이미지 취소 핸들러
  const handleImageCancel = () => {
    setImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 메시지 입력 핸들러
  const handleMessageChange = (e) => {
    setCurrentMessage(e.target.value);
  };

  // 메시지 전송 핸들러
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim() && !image) {
      return;
    }
    
    if (!chatService.isConnected()) {
      alert('채팅 서버에 연결되어 있지 않습니다. 페이지를 새로고침해주세요.');
      return;
    }
    
    // 인증되지 않은 사용자가 메시지 전송 시 로그인 페이지로 이동
    if (!chatService.isAuthenticated()) {
      const confirmLogin = window.confirm('로그인이 필요한 기능입니다. 로그인 페이지로 이동하시겠습니까?');
      if (confirmLogin) {
        navigate('/login');
      }
      return;
    }
    
    // 사용자 메시지 추가
    const userMessage = {
      username: user?.username || 'me',
      message: currentMessage,
      imageUrl: imagePreview || null,
      sentByMe: true
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // WebSocket으로 메시지 전송
    const sent = chatService.sendMessage(currentMessage, image);
    
    if (sent) {
      // 입력 필드 초기화
      setCurrentMessage('');
      setImage(null);
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // 메시지 전송 실패 시 알림
      setMessages(prevMessages => [
        ...prevMessages,
        {
          username: 'system',
          message: '메시지 전송에 실패했습니다. 연결 상태를 확인해주세요.'
        }
      ]);
    }
  };

  // 다시 연결 시도 핸들러
  const handleReconnect = () => {
    setConnecting(true);
    setConnectionError(false);
    setMessages([
      {
        username: 'system',
        message: '채팅 서버에 다시 연결 중...'
      }
    ]);
    
    chatService.connect(
      () => {
        setConnecting(false);
        setConnectionError(false);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            username: 'system',
            message: '채팅 서버에 다시 연결되었습니다.'
          }
        ]);
      },
      (error) => {
        console.error('WebSocket 재연결 오류:', error);
        setConnecting(false);
        setConnectionError(true);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            username: 'system',
            message: '채팅 서버 재연결에 실패했습니다. 잠시 후 다시 시도해주세요.'
          }
        ]);
      }
    );
  };

  // 로그인 페이지로 이동
  const handleGoToLogin = () => {
    navigate('/login');
  };

  // 스크롤을 채팅 하단으로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 새 레시피 처리 핸들러
  const handleNewRecipe = (newRecipe) => {
    if (newRecipe) {
      // 새 레시피 데이터 로깅
      console.log('새 레시피 데이터:', newRecipe);
      
      // 새 레시피의 instructions 필드 확인 및 변환
      const mappedInstructions = Array.isArray(newRecipe.instructions) 
        ? newRecipe.instructions.map((inst, index) => ({
            step: inst.stepNumber || inst.step || index + 1,
            text: inst.instruction || inst.text || "조리 단계",
            cookingTime: inst.cookingTime || 5
          }))
        : [];
      
      // 새 레시피 메시지 추가
      setMessages(prevMessages => [
        ...prevMessages,
        {
          username: 'AI 요리사',
          message: `새로운 대체 레시피가 생성되었습니다: ${newRecipe.name || '새 레시피'}`,
          recipe: {
            name: newRecipe.name || '이름 없는 레시피',
            description: newRecipe.description || '설명 없음',
            ingredients: Array.isArray(newRecipe.ingredients) ? newRecipe.ingredients : [],
            instructions: mappedInstructions,
            totalTime: calculateTotalTime(newRecipe.instructions) || 30,
            difficulty: '중간',
            servings: '2인분'
          },
          recipeId: newRecipe.id
        }
      ]);
    }
  };

  // 메시지 렌더링 함수
  const renderMessage = (message, index) => {
    // 메시지 디버깅
    console.log(`메시지 ${index} 구조:`, message);
    
    const isSystem = message.username === 'system';
    const isSentByMe = message.sentByMe || (user && message.username === user.username);
    
    return (
      <div 
        key={index} 
        className={`message-container ${isSystem ? 'system-message' : isSentByMe ? 'sent-message' : 'received-message'}`}
      >
        {!isSystem && (
          <div className="message-username">{isSentByMe ? '나' : message.username}</div>
        )}
        
        <div className="message-content">
          {/* 레시피 정보가 있으면 RecipeMessage 컴포넌트 사용 - 더 견고한 검사 */}
          {typeof message.recipe === 'object' && message.recipe !== null ? (
            <RecipeMessage 
              message={message} 
              onNewRecipe={handleNewRecipe}
            />
          ) : (
            message.message && <div className="message-text">{message.message}</div>
          )}
          
          {message.imageUrl && (
            <div className="message-image-container">
              <img 
                src={message.imageUrl} 
                alt="채팅 이미지" 
                className="message-image" 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>레시피 AI 어시스턴트</h2>
        {!isAuthenticated && (
          <button 
            className="login-button"
            onClick={handleGoToLogin}
          >
            로그인
          </button>
        )}
      </div>
      
      <div className="chat-messages">
        {connecting ? (
          <div className="chat-connecting">
            <p>채팅 서버에 연결 중...</p>
          </div>
        ) : connectionError ? (
          <div className="chat-error">
            <p>채팅 서버에 연결할 수 없습니다.</p>
            <button onClick={handleReconnect}>다시 연결</button>
          </div>
        ) : (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        {imagePreview && (
          <div className="image-preview-container">
            <img 
              src={imagePreview} 
              alt="미리보기" 
              className="image-preview" 
            />
            <button 
              type="button" 
              className="image-cancel-button"
              onClick={handleImageCancel}
            >
              &times;
            </button>
          </div>
        )}
        
        <div className="chat-input-container">
          <input
            type="text"
            value={currentMessage}
            onChange={handleMessageChange}
            placeholder={isAuthenticated ? "레시피에 대해 물어보세요..." : "로그인 후 메시지를 입력할 수 있습니다"}
            disabled={connecting || connectionError || !isAuthenticated}
          />
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
            disabled={!isAuthenticated}
          />
          
          <button
            type="button"
            onClick={handleImageButtonClick}
            className="image-button"
            disabled={connecting || connectionError || !isAuthenticated}
          >
            📷
          </button>
          
          <button
            type="submit"
            disabled={(!currentMessage.trim() && !image) || connecting || connectionError || !isAuthenticated}
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipeChat;