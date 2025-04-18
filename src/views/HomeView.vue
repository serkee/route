<template>
  <div class="container">
    <AppHeader />
    <p>로그인 후 보여지는 첫 화면입니다.</p>
    <div class="content">
      <p>환영합니다, {{ userStore.name }}님!</p>
    </div>
  </div>
</template>

<script setup>
// import { useRouter } from 'vue-router'; // 사용하지 않으므로 제거
import { useUserStore } from "@/store/user"; // 스토어 경로에 맞춰 수정
import { onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import (경로 확인)

// const router = useRouter(); // 사용하지 않으므로 제거
const userStore = useUserStore();

// 컴포넌트 마운트 시 실행될 로직 (필요하다면)
onMounted(() => {
  console.log(
    "HomeView mounted. User:",
    userStore.name,
    userStore.email,
    userStore.profileImageUrl
  );
  // 예: 로그인 후 특정 데이터를 로딩해야 하는 경우
  // loadHomeData();
});

// 로그아웃 함수는 이제 AppHeader.vue에 있습니다.

// 예시: 홈 화면 데이터 로딩 함수 (필요하다면 구현)
// const loadHomeData = async () => { ... };
</script>
  
  <style scoped>
p {
  color: #777;
  margin-bottom: 20px;
}

.content {
  width: 80%;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: center;
}
</style>