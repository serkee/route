<template>
    <div class="header">
      <div class="header__info">
        <div class="header__info-photo">
          <img
            v-if="userStore.profileImageUrl"
            :src="userStore.profileImageUrl"
            alt="Profile Photo"
            class="profile-photo"
          />
          <div v-else class="profile-photo-placeholder">👤</div>
        </div>
        <span>{{ userStore.name }}</span> </div>
      <div class="header__right">
        <button class="btn-logout" @click="logout">로그아웃</button> </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router';
  import { useUserStore } from '@/store/user'; // 스토어 경로에 맞춰 수정
  
  const router = useRouter();
  const userStore = useUserStore();
  
  // 로그아웃 함수
  const logout = () => {
    userStore.clearUser(); // Pinia 스토어의 clearUser 액션 호출 (로그인 상태 및 사용자 정보 초기화)
    router.push('/'); // 스플래시 화면으로 이동
  };
  </script>
  