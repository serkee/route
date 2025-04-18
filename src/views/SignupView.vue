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
        <button class="camera-icon" @click="triggerFileInput">📷</button>
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
              @input="resetEmailCheck" />
            <button
              type="button"
              class="check-duplicate-button"
              @click="checkEmailDuplicate"
              :disabled="!email || emailChecked" >
              {{ emailChecked ? (isEmailUnique ? '확인됨' : '중복') : '중복확인' }}
            </button>
          </div>
          <p v-if="emailChecked" :class="{'success-message': isEmailUnique, 'error-message': !isEmailUnique}">
            {{ isEmailUnique ? '사용 가능한 이메일입니다.' : '이미 사용 중인 이메일입니다.' }}
          </p>
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
            placeholder="비밀번호를 입력해주세요 (영문, 숫자, 특수문자)"
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
          <button type="submit" class="green-button" :disabled="!isFormValid">회원가입</button> </div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'; // computed import
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/store/user'; // 스토어 경로에 맞춰 수정
  
  const username = ref('');
  const email = ref('');
  const password = ref('');
  const confirmPassword = ref('');
  const router = useRouter();
  const userStore = useUserStore();
  
  // 이미지 파일 선택 기능을 위한 ref와 변수
  const fileInput = ref(null);
  const avatarPreview = ref('');
  
  // 이메일 중복 확인 관련 상태
  const emailChecked = ref(false); // 이메일 중복 확인을 완료했는지 여부
  const isEmailUnique = ref(false); // 확인된 이메일이 중복되지 않았는지 여부
  
  // 컴포넌트가 마운트될 때 (화면에 표시될 때) 실행됩니다.
  onMounted(() => {
    username.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
    avatarPreview.value = '';
    // 중복 확인 상태 초기화
    emailChecked.value = false;
    isEmailUnique.value = false;
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
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 이메일 입력 시 중복 확인 상태 초기화
  const resetEmailCheck = () => {
    emailChecked.value = false;
    isEmailUnique.value = false;
  };
  
  // 이메일 중복 확인 함수
  const checkEmailDuplicate = async () => {
    if (!email.value) {
      alert('이메일을 입력해주세요.');
      return;
    }
  
    // 실제 백엔드 API 호출 로직 (필요)
    // 예시:
    // try {
    //   const response = await fetch('/api/check-email', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ email: email.value }),
    //   });
    //   const data = await response.json();
    //   emailChecked.value = true;
    //   isEmailUnique.value = data.isUnique; // 백엔드 응답에 따라 설정
    //   if (!data.isUnique) {
    //     alert('이미 사용 중인 이메일입니다.');
    //   }
    // } catch (error) {
    //   console.error('이메일 중복 확인 오류:', error);
    //   alert('이메일 중복 확인 중 오류가 발생했습니다.');
    //   emailChecked.value = false; // 오류 발생 시 상태 초기화
    //   isEmailUnique.value = false;
    // }
  
  
    // 임시 중복 확인 로직 (API 연동 없이)
    console.log('이메일 중복 확인 시도:', email.value);
    // 실제로는 백엔드에서 확인해야 합니다.
    // 여기서는 임의로 'test@example.com'만 중복된다고 가정합니다.
    await new Promise(resolve => setTimeout(resolve, 500)); // API 호출 지연 시뮬레이션
  
    emailChecked.value = true;
    if (email.value === 'test@example.com') { // 임시 중복 이메일
      isEmailUnique.value = false;
    } else {
      isEmailUnique.value = true;
    }
  
    if (!isEmailUnique.value) {
      alert('이미 사용 중인 이메일입니다.');
    }
  };
  
  // 회원가입 버튼 활성화 조건
  const isFormValid = computed(() => {
    return (
      email.value &&
      username.value &&
      password.value &&
      confirmPassword.value &&
      emailChecked.value && // 이메일 중복 확인을 완료해야 함
      isEmailUnique.value && // 이메일이 중복되지 않아야 함
      password.value === confirmPassword.value // 비밀번호 일치
      // 추가적인 유효성 검사 조건 (예: 비밀번호 길이, 형식 등)
    );
  });
  
  
  const signup = async () => {
    if (!isFormValid.value) {
      // isFormValid computed 속성에서 대부분의 유효성 검사를 처리하지만,
      // 최종 제출 전 다시 한번 확인하는 것이 좋습니다.
      if (!emailChecked.value || !isEmailUnique.value) {
          alert('이메일 중복 확인을 완료해주세요.');
          return;
      }
      if (password.value !== confirmPassword.value) {
          alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
          return;
      }
       // 기타 필요한 유효성 검사 메시지
      alert('필수 정보를 모두 입력하고 이메일 중복 확인을 완료해주세요.');
      return;
    }
  
    // 실제 회원가입 API 호출 (필요)
    // API 호출 시 회원 정보 및 이미지 파일 (selectedFile.value)을 백엔드에 전송하고 응답을 처리해야 합니다.
  
    // 임시 회원가입 성공 처리 및 자동 로그인
    console.log(
      "회원가입 시도:",
      username.value,
      email.value,
      password.value,
      confirmPassword.value
    );
    console.log("선택된 이미지 데이터 (Data URL):", avatarPreview.value); // 선택된 이미지 데이터 확인
  
    // 실제 백엔드 연동 시:
    // 1. 회원가입 정보와 이미지 파일 (selectedFile.value)을 백엔드 API로 전송
    // 2. 백엔드에서 회원 정보 및 이미지를 저장하고, 저장된 이미지의 URL을 응답으로 받음
    // 3. 받은 이미지 URL을 포함하여 userStore.setUser 호출
  
    // 임시 처리 (API 연동 없이):
    const temporaryProfileImageUrl = avatarPreview.value || '';
  
    alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
    userStore.setUser({
      name: username.value,
      email: email.value,
      profileImageUrl: temporaryProfileImageUrl,
    });
    router.push("/home");
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
.success-message{
    text-align: left;
    font-size: 12px;
    position: absolute;
    bottom: -17px;
    color: #005fec;
}
.error-message{
    color: #dc3545;
}

</style>