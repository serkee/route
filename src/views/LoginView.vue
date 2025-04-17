<template>
    <div class="login-view">
      <h1>로그인</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">아이디 또는 이메일</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <button type="submit">로그인</button>
      </form>
      <p class="signup-link">
        아직 계정이 없으신가요? <router-link to="/signup">회원가입</router-link>
      </p>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'LoginView',
    setup() {
      const username = ref('');
      const password = ref('');
      const router = useRouter();
  
      const login = async () => {
        // 실제 로그인 API 호출 로직을 여기에 구현합니다.
        // 예시:
        // try {
        //   const response = await fetch('/api/login', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ username: username.value, password: password.value }),
        //   });
        //   const data = await response.json();
        //   if (data.success) {
        //     // 로그인 성공 처리 (예: 토큰 저장, 상태 업데이트, 홈 화면으로 이동)
        //     localStorage.setItem('authToken', data.token);
        //     router.push('/home');
        //   } else {
        //     // 로그인 실패 처리 (예: 오류 메시지 표시)
        //     alert('로그인 실패: 아이디 또는 비밀번호를 확인해주세요.');
        //   }
        // } catch (error) {
        //   console.error('로그인 오류:', error);
        //   alert('로그인 중 오류가 발생했습니다.');
        // }
  
        // 임시 로그인 성공 처리 (API 연동 없이)
        console.log('로그인 시도:', username.value, password.value);
        localStorage.setItem('authToken', 'example-token');
        router.push('/home');
      };
  
      return {
        username,
        password,
        login,
      };
    },
  };
  </script>
  
  <style scoped>
  .login-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px;
  }
  
  h1 {
    margin-bottom: 30px;
  }
  
  form {
    width: 300px;
    padding: 30px;
    border: 1px solid #ddd;
    border-radius: 5px;
    display: flex;
    flex-direction: column;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  input[type="text"],
  input[type="password"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 3px;
    box-sizing: border-box;
  }
  
  button[type="submit"] {
    padding: 10px 20px;
    font-size: 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  button[type="submit"]:hover {
    background-color: #0056b3;
  }
  
  .signup-link {
    margin-top: 20px;
  }
  
  .signup-link a {
    color: #007bff;
    text-decoration: none;
  }
  
  .signup-link a:hover {
    text-decoration: underline;
  }
  </style>