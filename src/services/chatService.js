import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class ChatService {
  constructor() {
    this.stompClient = null;
    this.subscription = null;
    this.connected = false;
    this.messageCallbacks = [];
    this.connectionInProgress = false;
  }

  // WebSocket 연결
  connect(onConnected, onError) {
    // 이미 연결된 상태면 바로 성공 콜백 호출
    if (this.isConnected()) {
      console.log('이미 연결되어 있습니다.');
      if (onConnected) setTimeout(onConnected, 0);
      return;
    }

    // 연결 중이면 중복 요청 무시
    if (this.connectionInProgress) {
      console.log('연결이 이미 진행 중입니다.');
      return;
    }

    this.connectionInProgress = true;
    
    // 토큰 가져오기
    const token = localStorage.getItem('accessToken');
    
    // 토큰이 없는 경우 처리
    if (!token) {
      console.error('인증 토큰이 없습니다. 로그인이 필요합니다.');
      this.connectionInProgress = false;
      if (onError) {
        setTimeout(() => onError(new Error('인증 토큰이 없습니다.')), 0);
      }
      return;
    }

    console.log('WebSocket 연결 시도 - 토큰 확인:', token ? '토큰 있음' : '토큰 없음');

    try {
      // 기존 연결 정리 (비동기적으로 진행)
      this.cleanupExistingConnection();
      
      // 새 STOMP 클라이언트 생성
      const client = new Client({
        // WebSocket 연결 생성 함수 설정
        webSocketFactory: () => {
          // SockJS 인스턴스 생성 및 반환
          const socket = new SockJS('http://localhost:8080/ws');
          
          // 디버깅을 위한 이벤트 리스너 추가
          socket.onopen = () => {
            console.log('SockJS 연결이 열렸습니다.');
          };
          
          socket.onclose = (event) => {
            console.log('SockJS 연결이 닫혔습니다.', event);
          };
          
          socket.onerror = (error) => {
            console.error('SockJS 오류:', error);
          };
          
          return socket;
        },
        
        // 연결 헤더에 명시적으로 Authorization 헤더 추가
        connectHeaders: {
          'Authorization': `Bearer ${token}`
        },
        
        // 디버그 모드 켜기
        debug: function(str) {
          console.log(`STOMP: ${str}`);
        },
        
        // 연결 성공 시 콜백
        onConnect: (frame) => {
          console.log('STOMP 연결 성공:', frame);
          
          // 로컬 변수에 client 할당
          this.stompClient = client;
          this.connected = true;
          this.connectionInProgress = false;
          
          // 안전하게 구독 생성
          try {
            // 사용자 개인 큐 구독
            this.subscription = this.stompClient.subscribe(
              '/user/queue/messages',
              this.onMessageReceived.bind(this)
            );
            console.log('메시지 큐 구독 성공');
          } catch (subsError) {
            console.error('구독 생성 중 오류:', subsError);
          }
          
          if (onConnected) {
            onConnected();
          }
        },
        
        // 연결 오류 시 콜백
        onStompError: (frame) => {
          console.error('STOMP 오류:', frame);
          this.connected = false;
          this.connectionInProgress = false;
          
          if (onError) {
            onError(frame);
          }
        },
        
        // 연결 종료 시 콜백
        onWebSocketClose: (event) => {
          console.log('WebSocket 연결이 종료되었습니다.', event);
          this.connected = false;
          this.connectionInProgress = false;
        }
      });

      // 재연결 설정
      client.reconnectDelay = 5000; // 5초 후 재연결 시도
      
      // 연결 시작
      client.activate();
    } catch (error) {
      console.error('STOMP 클라이언트 활성화 오류:', error);
      this.connectionInProgress = false;
      if (onError) {
        onError(error);
      }
    }
  }

  // 기존 연결 정리 (비동기적으로 진행)
  cleanupExistingConnection() {
    console.log('기존 연결 정리 시작');
    
    const cleanup = async () => {
      // 기존 구독 해제
      if (this.subscription) {
        try {
          console.log('기존 구독 해제');
          this.subscription.unsubscribe();
        } catch (e) {
          console.warn('구독 해제 중 오류 (무시됨):', e);
        }
        this.subscription = null;
      }
      
      // 기존 STOMP 클라이언트 비활성화
      if (this.stompClient && this.stompClient.connected) {
        try {
          console.log('STOMP 클라이언트 비활성화');
          this.stompClient.deactivate();
          
          // 비활성화가 완료될 시간을 주기 위해 짧게 대기
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
          console.warn('STOMP 클라이언트 비활성화 중 오류 (무시됨):', e);
        }
      }
      
      this.stompClient = null;
      this.connected = false;
      console.log('기존 연결 정리 완료');
    };
    
    // 비동기적으로 정리 실행 (여기서 await를 사용하지 않음)
    cleanup();
  }

  // 메시지 수신 콜백
  onMessageReceived(message) {
    try {
      console.log('메시지 수신:', message);
      
      let messageData;
      
      // 메시지가 JSON 형식인지 확인 후 파싱 시도
      if (message.body && typeof message.body === 'string') {
        try {
          // JSON 형식인지 확인 (중괄호나 대괄호로 시작하는지)
          if (message.body.trim().startsWith('{') || message.body.trim().startsWith('[')) {
            messageData = JSON.parse(message.body);
          } else {
            // 일반 텍스트 메시지를 객체로 변환
            messageData = {
              username: 'AI 요리사',
              message: message.body,
              imageUrl: null
            };
          }
        } catch (parseError) {
          console.warn('JSON 파싱 실패, 텍스트 메시지로 처리:', parseError);
          messageData = {
            username: 'AI 요리사',
            message: message.body,
            imageUrl: null
          };
        }
        
        // 콜백이 있을 때만 처리
        if (this.messageCallbacks.length > 0) {
          // 등록된 모든 콜백 함수 호출
          this.messageCallbacks.forEach(callback => {
            callback(messageData);
          });
        } else {
          console.warn('등록된 메시지 콜백이 없습니다');
        }
      } else {
        console.warn('유효하지 않은 메시지 형식:', message);
      }
    } catch (error) {
      console.error('메시지 처리 오류:', error);
    }
  }

  // 메시지 수신 콜백 등록
  registerMessageCallback(callback) {
    if (typeof callback === 'function') {
      // 중복 등록 방지
      if (!this.messageCallbacks.includes(callback)) {
        this.messageCallbacks.push(callback);
        console.log('메시지 콜백 등록됨, 현재 콜백 수:', this.messageCallbacks.length);
      } else {
        console.warn('이미 등록된 콜백 함수입니다.');
      }
    }
  }

  // 메시지 수신 콜백 제거
  unregisterMessageCallback(callback) {
    const initialLength = this.messageCallbacks.length;
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    console.log(`콜백 제거됨: ${initialLength} -> ${this.messageCallbacks.length}`);
  }

  // 모든 콜백 제거
  clearAllCallbacks() {
    console.log(`모든 콜백 제거: 총 ${this.messageCallbacks.length}개`);
    this.messageCallbacks = [];
  }

  // 메시지 전송
  sendMessage(message, image = null) {
    if (!this.isConnected()) {
      console.error('WebSocket이 연결되어 있지 않습니다.');
      return false;
    }

    try {
      // 메시지 객체 생성
      const messagePayload = {
        message: message
        // 이미지는 별도 처리 필요
      };

      console.log('메시지 전송:', messagePayload);

      // 메시지 전송
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(messagePayload),
        headers: { 
          'content-type': 'application/json',
          // 메시지 헤더에도 인증 토큰 포함
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      return true;
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      return false;
    }
  }

  // 연결 종료
  disconnect() {
    console.log('WebSocket 연결 종료 시도');
    this.cleanupExistingConnection();
  }

  // 연결 상태 확인
  isConnected() {
    return this.connected && this.stompClient && this.stompClient.connected;
  }

  // 인증 상태 확인
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
}

// 싱글턴 인스턴스 생성 및 내보내기
const chatService = new ChatService();
export default chatService;