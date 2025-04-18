<template>
  <div class="container">
    <div class="header">
      <div class="header__left">
        <button class="back-button" @click="goBack">←</button>
      </div>
      <h1>로그인</h1>
      <div class="header__right"></div>
    </div>

    <div class="middle">

      <form @submit.prevent="login">
        <div class="form-group">
          <label for="username">아이디 또는 이메일</label>
          <input type="text" id="username" v-model="username" required autocomplete="off"/>
        </div>
        <div class="form-group">
          <label for="password">비밀번호</label>
          <input type="password" id="password" v-model="password" required autocomplete="off"/>
        </div>
        <button type="submit">로그인</button>
      </form>
      <p class="signup-link">
        아직 계정이 없으신가요? <router-link to="/signup">회원가입</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue"; // onMounted를 import 합니다.
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

export default {
  name: "LoginView",
  setup() {
    const username = ref("");
    const password = ref("");
    const router = useRouter();
    const userStore = useUserStore();

    // 컴포넌트가 마운트될 때 (화면에 표시될 때) 실행됩니다.
    onMounted(() => {
      username.value = "";
      password.value = "";
    });

    // 뒤로 가기 함수
    const goBack = () => {
      router.go(-1); // 뒤로 한 단계 이동
    };

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
      userStore.setUser({ name: "임시 사용자", email: "temp@example.com" });
      console.log("LoginView - userStore.isLoggedIn:", userStore.isLoggedIn);
      router.push("/home");
    };

    return {
      username,
      password,
      login,
      goBack,
    };
  },
};
</script>
  
  <style scoped>

form {
  width: 300px;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
}



button[type="submit"] {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 30px;
}

button[type="submit"]:hover {
  background-color: #0056b3;
}

.signup-link {
  margin-top: 20px;
  font-size: 13px;
}

.signup-link a {
  color: #007bff;
  text-decoration: none;
}

.signup-link a:hover {
  text-decoration: underline;
}

.middle{
  display: flex;
  justify-content: center;
  height: 100%;
  flex-direction: column;
}
.form-group + .form-group{
  margin-top: 20px;
}
</style>