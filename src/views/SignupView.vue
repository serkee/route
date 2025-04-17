<template>
    <div class="signup-view">
      <h1>회원가입</h1>
      <form @submit.prevent="signup">
        <div class="form-group">
          <label for="username">사용자 이름</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="form-group">
          <label for="email">이메일</label>
          <input type="email" id="email" v-model="email" required>
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">비밀번호 확인</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" required>
        </div>
        <button type="submit">회원가입</button>
      </form>
      <p class="login-link">
        이미 계정이 있으신가요? <router-link to="/login">로그인</router-link>
      </p>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'SignupView',
    setup() {
      const username = ref('');
      const email = ref('');
      const password = ref('');
      const confirmPassword = ref('');
      const router = useRouter();
  
      const signup = async () => {
        if (password.value !== confirmPassword.value) {
          alert('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
          return;
        }
  
        // 실제 회원가입 API 호출 로직을 여기에 구현합니다.
        // 예시:
        // try {
        //   const response = await fetch('/api/signup', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({ username: username.value, email: email.value, password: password.value }),
        //   });
        //   const data = await response.json();
        //   if (data.success) {
        //     // 회원가입 성공 처리 (예: 로그인 페이지로 이동)
        //     router.push('/login');
        //   } else {
        //     // 회원가입 실패 처리 (예: 오류 메시지 표시)
        //     alert('회원가입 실패: ' + data.message);
        //   }
        // } catch (error) {
        //   console.error('회원가입 오류:', error);
        //   alert('회원가입 중 오류가 발생했습니다.');
        // }
  
        // 임시 회원가입 성공 처리 (API 연동 없이)
        console.log('회원가입 시도:', username.value, email.value, password.value, confirmPassword.value);
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
      };
  
      return {
        username,
        email,
        password,
        confirmPassword,
        signup,
      };
    },
  };
  </script>
  
  <style scoped>
  .signup-view {
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
  input[type="email"],
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
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  button[type="submit"]:hover {
    background-color: #1e7e34;
  }
  
  .login-link {
    margin-top: 20px;
  }
  
  .login-link a {
    color: #007bff;
    text-decoration: none;
  }
  
  .login-link a:hover {
    text-decoration: underline;
  }
  </style>