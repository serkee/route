<template>
    <div class="container">
      <div class="header">
        <div class="header__left">
            <button class="home-button" @click="router.push('/')">←</button>
        </div>
        <h1>비밀번호 찾기</h1>
        <div class="header__right"></div>
      </div>
  
      <div class="middle">
        <form @submit.prevent="sendResetEmail">
          <p class="instructions">
            비밀번호를 재설정할 이메일 주소를 입력해주세요.<br>
            입력하신 이메일로 재설정 링크가 전송됩니다.
          </p>
          <div class="form-group">
            <label for="email">이메일</label>
            <input type="email" id="email" v-model="email" required autocomplete="off"/>
          </div>
  
          <button type="submit" :disabled="loading">
            {{ loading ? '전송 중...' : '재설정 이메일 전송' }}
          </button>
        </form>
  
        <p v-if="message" :class="{'message': true, 'error-message': isError}">{{ message }}</p>
  
        <p class="login-link">
          <router-link to="/login">로그인 페이지로 돌아가기</router-link>
        </p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'; // computed 임포트
  import { useRouter } from 'vue-router';
  // userService에서 비밀번호 재설정 함수 임포트
  import { sendPasswordResetEmail } from '@/services/userService'; // <--- 이 함수를 import 해야 합니다.
  
  
  const email = ref(''); // 이메일 입력 필드와 바인딩
  const message = ref(''); // 사용자에게 보여줄 메시지 (성공/실패)
  const loading = ref(false); // 전송 중 로딩 상태
  
  // 메시지가 에러 메시지인지 판단하는 computed 속성
  const isError = computed(() => message.value.includes('오류가 발생했습니다')); // 오류 메시지에 특정 문자열 포함 여부로 판단
  
  
  const router = useRouter();
  
  
  // 비밀번호 재설정 이메일 전송 함수
  const sendResetEmail = async () => {
    message.value = ''; // 이전 메시지 초기화
  
    // 이메일 입력값 검사
    if (!email.value) {
      message.value = '이메일 주소를 입력해주세요.';
      return;
    }
  
    loading.value = true; // 로딩 시작
  
    try {
      // userService의 sendPasswordResetEmail 함수 호출
      await sendPasswordResetEmail(email.value); // <--- userService의 함수 호출
  
      // 성공 메시지 설정
      message.value = '비밀번호 재설정 이메일이 발송되었습니다. 이메일함을 확인해주세요.';
      console.log(`비밀번호 재설정 이메일 전송 완료: ${email.value}`);
      // 이메일 입력 필드 초기화 (선택 사항)
      // email.value = '';
  
    } catch (error) {
      // 오류 처리
      console.error('비밀번호 재설정 이메일 전송 오류:', error);
      // userService에서 이미 alert를 띄우므로 여기서는 메시지만 설정합니다.
      message.value = `비밀번호 재설정 중 오류가 발생했습니다: ${error.message}`;
      // TODO: 특정 오류 코드에 대한 더 구체적인 메시지 처리 (userService에서 이미 일부 처리됨)
    } finally {
      loading.value = false; // 로딩 종료
    }
  };
  
  </script>
  
  <style scoped>
  /* LoginView.vue 스타일과 유사하게 설정 */
  
  
  
  .middle {
    width: 100%;
  }
  
  form {
    width: 100%;
    padding: 40px 20px 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    margin: 0 auto; /* 중앙 정렬 */
  }
  
  .instructions {
      font-size: 14px;
      color: #555;
      margin-bottom: 30px;
      text-align: center;
      line-height: 1.4;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    font-size: 14px;
    color: #555;
  }
  
  .form-group input[type="email"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  }
  
  button[type="submit"] {
    padding: 12px 20px;
    font-size: 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: 20px;
    transition: background-color 0.2s ease;
    width: 100%;
  }
  
  button[type="submit"]:hover:not(:disabled) { /* 로딩 중 아닐 때만 호버 효과 */
    background-color: #0056b3;
  }
  
  button[type="submit"]:disabled { /* 로딩 중 스타일 */
      background-color: #a0c4ff; /* 흐린 파란색 */
      cursor: not-allowed;
  }
  
  
  .message {
      margin-top: 20px;
      font-size: 14px;
      color: green; /* 성공 메시지는 녹색 */
      text-align: center;
  }
  /* 오류 메시지 스타일 */
  .error-message {
      color: red; /* 오류 메시지는 빨간색 */
  }
  
  
  .login-link {
    margin-top: 20px;
    font-size: 14px;
    color: #555;
    text-align: center;
  }
  
  .login-link a {
    color: #007bff;
    text-decoration: none;
    font-weight: bold;
  }
  
  .login-link a:hover {
    text-decoration: underline;
  }
  
  </style>