<template>
  <div class="header">
    <div class="header__info">
      <a href="javascript:void(0)" @click="goToProfile">
        <div class="header__info-photo">
          <img
            v-if="userStore.profileImageUrl"
            :src="userStore.profileImageUrl"
            alt="Profile Photo"
            class="profile-photo"
          />
          <div v-else class="profile-photo-placeholder">👤</div>
        </div>

        <span>{{ userStore.name }}</span>
      </a>
    </div>
    <div class="header__right">
      <button class="btn-logout" @click="logout">로그아웃</button>
    </div>
  </div>
</template>
  
  <script setup>
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user"; // 스토어 경로에 맞춰 수정

const router = useRouter();
const userStore = useUserStore();

// 로그아웃 함수
const logout = () => {
  userStore.clearUser(); // Pinia 스토어의 clearUser 액션 호출 (로그인 상태 및 사용자 정보 초기화)
  router.push("/"); // 스플래시 화면으로 이동
};

const goToProfile = () => {
  // Vue Router의 push 메소드를 사용하여 지정된 경로('/profile')로 이동합니다.
  // 이 경로는 src/router/index.js에 정의되어 있어야 합니다.
  router.push("/profile"); // <-- '/profile' 경로로 이동
  console.log("프로필 페이지로 이동 요청"); // 디버깅용 로그 (선택 사항)
};
</script>
  