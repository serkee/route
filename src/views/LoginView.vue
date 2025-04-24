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
          <label for="email">이메일</label>
          <input type="email" id="email" v-model="email" required autocomplete="off"/>
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

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
// Pinia 스토어 import (userStore 변수를 사용하지 않으므로 import도 제거합니다)
// import { useUserStore } from "@/store/user";

// Firebase Auth SDK 직접 import는 제거합니다.
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// userService에서 정의한 로그인 함수를 import 합니다.
import { loginUser } from "@/services/userService"; // <--- 이 함수를 import 합니다.


// 상태 변수 (이메일과 비밀번호)
const email = ref("");
const password = ref("");

const router = useRouter();
// userStore 변수 선언 제거합니다.
// const userStore = useUserStore(); // <--- 이 줄을 제거합니다.


// Firebase Auth 서비스 인스턴스를 직접 가져오는 코드는 제거합니다.
// const auth = getAuth();


// 컴포넌트가 마운트될 때 실행됩니다.
onMounted(() => {
  email.value = "";
  password.value = "";
  // TODO: 이미 로그인 상태라면 특정 페이지로 리디렉션하는 로직을 여기에 추가할 수 있습니다.
  // Pinia 스토어 상태 접근이 필요하다면 useUserStore()를 다시 호출해야 합니다.
  // const userStore = useUserStore();
  // if (userStore.isAuthenticated) { router.replace('/board'); }
});

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1);
};

// 로그인 함수 (userService의 loginUser 함수 사용)
const login = async () => {
  // 기본적인 입력값 유효성 검사
  if (!email.value || !password.value) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
  }

  try {
    // userService에 정의된 loginUser 함수를 호출합니다.
    // 이 함수 안에서 Firebase 인증, 스토어 업데이트(닉네임/사진URL 포함) 처리가 모두 일어납니다.
    const user = await loginUser(email.value, password.value); // <--- signInWithEmailAndPassword 대신 이 함수 호출

    // userService.loginUser 함수는 성공 시 user 객체를 반환하고 실패 시 에러를 throw합니다.
    // 에러가 throw되지 않았다면 로그인 성공입니다.

    console.log("LoginView: loginUser 함수 호출 완료. 반환된 사용자:", user);

    // 로그인 성공 후 이동할 페이지로 라우팅
    // alert("로그인 성공!"); // 성공 알림 (선택 사항)
    router.push("/home"); // 게시판 목록 페이지로 이동 (예시)

  } catch (error) {
    // userService.loginUser 함수에서 발생한 오류가 여기서 잡힙니다.
    // userService에서 이미 alert를 띄우므로 여기서 또 띄울 필요는 없을 수 있습니다.
    console.error("LoginView: 로그인 처리 중 오류 발생 (catch 블록):", error);
    // alert(`로그인 중 오류가 발생했습니다: ${error.message}`); // userService에서 alert를 띄우지 않는 경우 활성화
  }
  // finally 블록이 필요하다면 여기에 추가
};

</script>

<style scoped>
/* 기존 스타일 유지 */

.middle{
  display: flex;
  justify-content: center;
  align-items: center; /* 세로 중앙 정렬 */
  flex-direction: column;
  flex-grow: 1; /* 남은 공간을 middle이 차지 */
   padding: 20px; /* 패딩 추가 */
   box-sizing: border-box;
   width: 100%;
}

form {
  width: 100%; /* middle 너비에 맞춤 */
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  background-color: #fff; /* 배경색 */
  box-shadow: 0 2px 5px rgba(0,0,0,0.1); /* 그림자 효과 */
}

/* .form-group {
    margin-bottom: 20px;
}

.form-group:last-child {
    margin-bottom: 0;
} */

.form-group label {
  display: block; /* 라벨 위에 입력 필드 */
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 14px;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="email"], /* email 타입 추가 */
.form-group input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box; /* 패딩 포함 크기 계산 */
}


button[type="submit"] {
  padding: 12px 20px; /* 패딩 조정 */
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px; /* 위 간격 조정 */
  transition: background-color 0.2s ease; /* 호버 효과 부드럽게 */
}

button[type="submit"]:hover {
  background-color: #0056b3;
}

.signup-link {
  margin-top: 20px;
  font-size: 14px; /* 폰트 크기 조정 */
  color: #555;
}

.signup-link a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold; /* 링크 강조 */
}

.signup-link a:hover {
  text-decoration: underline;
}

/* 기존 .form-group + .form-group 스타일은 제거 */
</style>