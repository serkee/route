<template>
  <div class="container">
    <div class="header">
      <div class="header__left">
        <button class="back-button" @click="goBack">←</button>
      </div>
      <h1>회원가입</h1>
      <div class="header__right"></div>
    </div>

    <div class="info-message">
      <p>
        가입 시 입력한 이메일 주소는 로그인 아이디 및 비밀번호 찾기 이용 시
        사용되므로 정확한 주소 입력이 필요합니다
      </p>
    </div>

    <div class="profile-avatar">
      <div class="avatar-placeholder">
        <img
          v-if="avatarPreview"
          :src="avatarPreview"
          alt="Profile Preview"
          class="avatar-image"
        />
      </div>
      <button type="button" class="camera-icon" @click="triggerFileInput">
        📷
      </button>
      <input
        type="file"
        ref="fileInput"
        @change="handleFileSelect"
        accept="image/*"
        style="display: none"
      />
    </div>

    <form @submit.prevent="signup" class="signup-form">
      <div class="form-group email-group">
        <label for="email">이메일</label>
        <div class="input-with-button">
          <input
            type="email"
            id="email"
            v-model="email"
            placeholder="이메일을 입력해주세요"
            required
            autocomplete="off"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="username">닉네임</label>
        <input
          type="text"
          id="username"
          v-model="username"
          placeholder="닉네임을 입력해주세요"
          required
          autocomplete="off"
        />
      </div>

      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          type="password"
          id="password"
          v-model="password"
          placeholder="비밀번호를 입력해주세요 (영문, 숫자, 특수문자 6자 이상)"
          required
          autocomplete="new-password"
        />
      </div>

      <div class="form-group">
        <label for="confirmPassword">비밀번호 재입력</label>
        <input
          type="password"
          id="confirmPassword"
          v-model="confirmPassword"
          placeholder="비밀번호를 다시 한번 입력해주세요"
          required
          autocomplete="new-password"
        />
      </div>
      <div class="bottom-container">

        <button type="submit" class="green-button" :disabled="!isFormValid">
          회원가입
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

// Import both registerUserWithFirebase and logoutUser from userService
import { registerUserWithFirebase, logoutUser } from "@/services/userService"; // <-- logoutUser 함수 import


const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const router = useRouter();

const fileInput = ref(null);
const avatarPreview = ref("");
const selectedFile = ref(null);


onMounted(() => {
  username.value = "";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
  avatarPreview.value = "";
  selectedFile.value = null;
});

const goBack = () => {
  router.go(-1);
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    selectedFile.value = null;
    avatarPreview.value = "";
  }
};

const isFormValid = computed(() => {
    const isValid = (
        email.value &&
        username.value &&
        password.value &&
        confirmPassword.value &&
        password.value === confirmPassword.value &&
        password.value.length >= 6
    );
    return isValid;
});

const signup = async () => {
    console.log('--- signup 함수 호출됨 ---');

    if (!isFormValid.value) {
        console.log('폼 유효성 검사 실패.');
        if (!email.value || !username.value || !password.value || !confirmPassword.value) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }
        if (password.value !== confirmPassword.value) {
            alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
            return;
        }
         if (password.value.length < 6) {
             alert("비밀번호는 6자 이상이어야 합니다.");
             return;
         }
        alert('폼 입력값을 다시 확인해주세요.');
        return;
    }

    console.log('폼 유효성 검사 통과. userService.registerUserWithFirebase 호출.');

    try {
      // registerUserWithFirebase 함수는 내부적으로 Firebase Authentication에 계정을 생성합니다.
      // 계정 생성 성공 시 Firebase Auth에 자동 로그인 상태가 됩니다.
      const user = await registerUserWithFirebase(
        email.value,
        password.value,
        username.value,
        selectedFile.value // selectedFile.value가 그대로 전달됨 (Storage 업로드 로직은 userService에 있을 것으로 가정)
      );

      if (user) {
         console.log("회원가입 최종 성공:", user);

         // 1. 회원가입 완료 알림 표시
         alert("회원가입이 완료되었습니다. 초기 화면으로 이동합니다."); // <-- 알림 메시지 변경

         // 2. 방금 생성된 사용자를 로그아웃 상태로 만듭니다.
         // registerUserWithFirebase 성공 후 Firebase Auth에는 로그인 상태이므로 명시적으로 로그아웃 호출
         console.log("회원가입 후 자동 로그인 상태 해제 시도...");
         await logoutUser(); // <-- userService에서 import한 logoutUser 함수 호출 및 완료 대기

         console.log("로그아웃 완료. 초기 화면(/)으로 이동.");

         // 3. SplashView (/)로 이동
         router.push("/"); // <-- / 경로로 라우팅

      } else {
         // registerUserWithFirebase 함수가 null을 반환하거나 오류를 던지지 않은 경우 처리
          console.warn("registerUserWithFirebase 함수가 사용자 객체를 반환하지 않았습니다.");
           alert("회원가입 처리에 문제가 발생했습니다."); // 일반 오류 메시지
      }

    } catch (error) {
      console.error("회원가입 처리 중 에러 발생 (signup catch):", error);
       // Firebase Auth 오류 등 구체적인 오류 메시지 처리는 userService에서 이미 할 수 있습니다.
       // 여기서는 발생한 에러를 로깅하고 일반적인 오류 메시지를 보여줍니다.
       let errorMessage = "회원가입 중 오류가 발생했습니다.";
        if (error && error.message) {
            // error 객체에 메시지가 있다면 추가 정보를 포함
            errorMessage += `: ${error.message}`;
        }
       alert(errorMessage); // 사용자에게 오류 알림

    } finally {
        console.log('--- signup 함수 종료 ---');
        // 비동기 작업 중 로딩 표시가 필요하다면 isSubmitting 상태를 관리하고 여기서 해제
    }
};
</script>

<style scoped>
/* 기존 스타일 유지 */
.signup-view {
  display: flex;
  flex-direction: column;
  align-items: center;

  background-color: #f8f8f8; /* 전체 배경색 */
  height: 100vh; /* 화면 높이 채우기 */
}

.info-message {
  padding: 10px 20px; /* 내부 패딩 */
  background-color: #f0f0f0;
  margin: -20px -20px 40px -20px; /* 헤더와의 간격 조정 */
  font-size: 0.8em;
  color: #555;
  text-align: left;
  line-height: 1.3;
  letter-spacing: -0.05em;
  box-sizing: border-box; /* 패딩 포함 너비 계산 */
  width: calc(100% + 40px);
}

.profile-avatar {
  width: 80px;
  height: 80px !important;
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.avatar-placeholder {
  width: 100%;
  height: 80px;
  border-radius: 50%;
  background: #ddd /*url(@/assets/images/common/ico_menu_user.svg)*/ no-repeat
    center center;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}
.avatar-placeholder:before {
  content: "";
  display: block;
  width: 80%;
  height: 80%;
  background: url(@/assets/images/common/ico_menu_user.svg) no-repeat;
  background-size: 100% auto;
  opacity: 0.2;
  margin-top: 19px;
}
.avatar-image {
  display: block; /* 이미지 하단의 여백 제거 */
  width: 100%;
  height: 100%;
  object-fit: cover; /* 이미지가 영역에 꽉 차도록 설정 */
  border-radius: 50%; /* 이미지를 원형으로 만듦 */
  position: relative;
}

.camera-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  background-color: #f1f1f1;
  border: 1px solid #e1e1e1;
  cursor: pointer; /* 클릭 가능한 요소임을 표시 */
}

.signup-form {
  width: 100%; /* 폼 너비 설정 */
  display: flex;
  flex-direction: column;
}

.input-with-button {
  display: flex;
}

.check-duplicate-button {
  background-color: #fdd835; /* 이미지에서 보이는 색상과 유사하게 변경 */
  color: #333;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-left: 10px;
  flex-shrink: 0; /* 버튼 너비 고정 */
}

.bottom-container {
  margin-top: 20px;
  width: 100%;
}

.error-message,
.success-message {
  text-align: left;
  font-size: 12px;
  position: absolute;
  bottom: -17px;
  color: #005fec;
}
.error-message {
  color: #dc3545;
}

.form-group label {
    display: block; /* Labels on their own line */
    margin-bottom: 8px; /* Space between label and input */
    font-weight: bold;
    color: #555;
    font-size: 14px;
}

.form-group input[type="email"],
.form-group input[type="text"],
.form-group input[type="password"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box; /* Include padding and border in element's total width and height */
    font-size: 14px;
}

/* Style for the main submit button */
.green-button {
  display: block; /* Make button full width */
  width: 100%;
  padding: 15px; /* Larger padding for a prominent button */
  font-size: 18px;
  font-weight: bold;
  color: white;
  background-color: #4caf50; /* Green background */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center; /* Center text inside button */
  transition: background-color 0.3s ease; /* Smooth hover effect */
}

.green-button:hover:not(:disabled) {
    background-color: #45a049; /* Darker green on hover */
}

.green-button:disabled {
    background-color: #ccc; /* Grey when disabled */
    cursor: not-allowed;
}
</style>