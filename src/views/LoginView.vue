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
          <label for="email">이메일</label> <input type="email" id="email" v-model="email" required autocomplete="off"/> </div>
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

<script setup> // <script> 대신 <script setup> 사용
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user";

// Firebase Auth SDK에서 필요한 함수들을 import 합니다.
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
// Firebase 앱은 main.js 등 다른 곳에서 이미 초기화되었다고 가정합니다.

// 상태 변수 (이메일과 비밀번호)
// Firebase 이메일/비밀번호 인증에는 '이메일'이 필요하므로 변수 이름을 email로 변경하는 것이 좋습니다.
const email = ref("");
const password = ref("");

const router = useRouter();
const userStore = useUserStore();

// Firebase Auth 서비스 인스턴스를 가져옵니다.
// Firebase 앱 초기화 이후에 호출 가능합니다.
const auth = getAuth();

// 컴포넌트가 마운트될 때 실행됩니다.
onMounted(() => {
  email.value = ""; // username 대신 email 초기화
  password.value = "";
});

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1); // 뒤로 한 단계 이동
};

// 로그인 함수 (Firebase Authentication 사용)
const login = async () => {
  try {
    // Firebase Auth의 signInWithEmailAndPassword 함수를 사용하여 로그인 시도
    // 첫 번째 인자는 Auth 인스턴스, 두 번째는 이메일, 세 번째는 비밀번호입니다.
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);

    // 로그인 성공 시 userCredential 객체에서 사용자 정보를 얻습니다.
    const user = userCredential.user;

    // 로그인 성공 처리
    console.log("Firebase 로그인 성공:", user);

    // Pinia 스토어에 사용자 정보 업데이트
    // 필요한 사용자 정보를 user 객체에서 가져와 저장합니다.
    userStore.setUser({
      uid: user.uid, // Firebase에서 제공하는 고유 사용자 ID
      email: user.email, // 사용자의 이메일
      displayName: user.displayName, // 사용자의 표시 이름 (있는 경우)
      photoURL: user.photoURL, // 사용자 프로필 사진 URL (있는 경우)
      // 필요한 다른 Firebase User 속성을 여기에 추가할 수 있습니다.
      isLoggedIn: true // 로그인 상태를 true로 설정
    });
    console.log("LoginView - userStore.isLoggedIn:", userStore.isLoggedIn);

    // 로그인 성공 후 홈 페이지 또는 목표 페이지로 이동
    router.push("/home");

  } catch (error) {
    // Firebase Authentication 오류 처리
    //console.error('Firebase 로그인 오류:', error.code, error.message);

    let errorMessage = '로그인 실패: 알 수 없는 오류가 발생했습니다.';

    // Firebase Auth 오류 코드에 따라 사용자에게 더 구체적인 메시지 표시
    switch (error.code) {
      case 'auth/user-not-found': // 해당 이메일로 등록된 사용자가 없을 때
      case 'auth/wrong-password': // 비밀번호가 틀렸을 때
        errorMessage = '로그인 실패: 이메일 또는 비밀번호를 확인해주세요.';
        break;
      case 'auth/invalid-email': // 이메일 형식이 올바르지 않을 때
        errorMessage = '로그인 실패: 유효하지 않은 이메일 주소 형식입니다.';
        break;
      case 'auth/user-disabled': // 사용자 계정이 비활성화되었을 때
        errorMessage = '로그인 실패: 이 사용자 계정이 비활성화되었습니다. 관리자에게 문의하세요.';
        break;
      case 'auth/too-many-requests': // 로그인 시도 과다로 계정이 잠겼을 때
        errorMessage = '로그인 실패: 로그인 시도 횟수가 너무 많습니다. 나중에 다시 시도해주세요.';
        break;
      default: // 그 외 다른 오류
        errorMessage = `로그인 실패: 로그인 정보 확인해주세요.`;
    }

    // 사용자에게 오류 메시지 알림
    alert(errorMessage);
  }
};

// <script setup>을 사용하므로 setup 함수의 return은 필요 없습니다.
/*
return {
  username, // email로 변경했다면 여기서도 email로 변경
  password,
  login,
  goBack,
};
*/
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