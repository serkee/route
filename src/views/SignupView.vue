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
// userStore는 현재 예제에서 직접 사용하지 않지만, 필요에 따라 남겨둘 수 있습니다.
// import { useUserStore } from '@/store/user'; // 스토어 경로에 맞춰 수정

// 2단계에서 만든 회원가입 서비스 함수 import
import { registerUserWithFirebase } from "@/services/userService";

const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const router = useRouter();
// const userStore = useUserStore(); // 필요에 따라 주석 처리 또는 제거

// 이미지 파일 선택 기능을 위한 ref와 변수
const fileInput = ref(null);
const avatarPreview = ref("");
const selectedFile = ref(null); // 업로드할 실제 파일 객체를 저장

// 이메일 중복 확인 관련 상태 (Firebase Auth 방식과 맞지 않아 제거)
// const emailChecked = ref(false);
// const isEmailUnique = ref(false);

// 컴포넌트가 마운트될 때 (화면에 표시될 때) 실행됩니다.
onMounted(() => {
  // 폼 필드 초기화
  username.value = "";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
  avatarPreview.value = "";
  selectedFile.value = null;
  // 중복 확인 상태 초기화 로직 제거
  // emailChecked.value = false;
  // isEmailUnique.value = false;
});

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1);
};

// 카메라 아이콘 클릭 시 숨겨진 파일 입력 필드를 클릭하는 함수
const triggerFileInput = () => {
  fileInput.value.click();
};

// 파일 선택 완료 시 실행되는 함수
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedFile.value = file; // 선택된 파일 객체 저장

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target.result; // 미리보기용 Data URL 저장
    };
    reader.readAsDataURL(file);
  } else {
    selectedFile.value = null; // 파일 선택 취소 시 초기화
    avatarPreview.value = "";
  }
};

// 이메일 입력 시 중복 확인 상태 초기화 로직 제거
// const resetEmailCheck = () => {
// emailChecked.value = false;
// isEmailUnique.value = false;
// };

// 이메일 중복 확인 함수 (Firebase Auth 방식과 맞지 않아 제거)
// const checkEmailDuplicate = async () => { ... };

// 회원가입 버튼 활성화 조건
const isFormValid = computed(() => {
    console.log('--- isFormValid 계산 시작 ---'); // 디버깅용
    console.log('email:', !!email.value); // 디버깅용
    console.log('username:', !!username.value); // 디버깅용
    console.log('password:', !!password.value); // 디버깅용
    console.log('confirmPassword:', !!confirmPassword.value); // 디버깅용
    console.log('password === confirmPassword:', password.value === confirmPassword.value); // 디버깅용
    console.log('password length >= 6:', password.value.length >= 6); // 디버깅용
    const isValid = (
        email.value &&
        username.value &&
        password.value &&
        confirmPassword.value &&
        password.value === confirmPassword.value &&
        password.value.length >= 6
    );
    console.log('isFormValid 결과:', isValid); // 디버깅용
    console.log('--- isFormValid 계산 종료 ---'); // 디버깅용
    return isValid;
});

// 회원가입 함수 (Firebase 연동)
const signup = async () => {
    console.log('--- signup 함수 호출됨 ---'); // 함수 진입 확인
    console.log('현재 isFormValid 값:', isFormValid.value); // isFormValid 값 확인

    if (!isFormValid.value) {
        console.log('폼 유효성 검사 실패. 알림 메시지 표시.');
        // 기본적인 폼 유효성 검사 메시지들
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
        // 이 메시지는 위 조건에서 걸러지지 않은 경우에만 나타납니다.
        alert('폼 입력값을 다시 확인해주세요.');
        return;
    }

    console.log('폼 유효성 검사 통과. Firebase 회원가입 시도.'); // Firebase 호출 전 확인

    try {
      const user = await registerUserWithFirebase(
        email.value,
        password.value,
        username.value,
        selectedFile.value
      );

      console.log("회원가입 최종 성공:", user);
      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      router.push("/login");

    } catch (error) {
      console.error("회원가입 처리 중 에러 발생 (signup catch):", error);
      // registerUserWithFirebase 함수에서 에러를 이미 처리하고 alert를 띄웠을 것입니다.
      // 필요하다면 여기서도 사용자에게 추가적인 에러 메시지 표시 가능.
      // alert("회원가입 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
        console.log('--- signup 함수 종료 ---'); // 함수 종료 확인 (성공/실패 무관)
    }
};
</script>

<style scoped>
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
}

.profile-avatar {
  width: 80px;
  height: 80px;
  margin-bottom: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
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
</style>