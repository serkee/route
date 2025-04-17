<template>
    <div class="splash-screen">
      <h1>스플래쉬 화면</h1>
      <p>지금 위대한 기록을 시작하세요</p>
      <div class="button-container">
        <button @click="goToLogin">로그인</button>
        <button @click="goToSignup" class="signup-button">회원가입</button>
      </div>
    </div>
  </template>
  
  <script>
  import { useRouter } from 'vue-router';
  
  export default {
    setup() {
      const router = useRouter();
  
      const goToLogin = () => {
        router.push('/login');
      };
  
      const goToSignup = () => {
        router.push('/signup');
      };
  
      return {
        goToLogin,
        goToSignup,
      };
    },
  };
  </script>
  
  <style scoped>
  .splash-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
  p {
    margin-bottom: 40px;
    color: #555;
  }
  
  .button-container {
    display: flex;
    gap: 20px;
  }
  
  button {
    padding: 10px 20px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .signup-button {
    background-color: #4CAF50;
    color: white;
    border: none;
  }
  </style>