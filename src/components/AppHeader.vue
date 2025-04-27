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
  // ✅ FIX: userService에서 logoutUser 함수를 임포트합니다.
  import { logoutUser } from "@/services/userService";
  
  
  const router = useRouter();
  const userStore = useUserStore();
  
  // 로그아웃 함수 - ✅ async로 만들고 userService의 logoutUser를 호출합니다.
  const logout = async () => { // ✅ async 키워드 추가
    try {
      console.log("[AppHeader] 로그아웃 버튼 클릭. userService.logoutUser 호출 시도.");
      await logoutUser(); // ✅ userService의 logoutUser 함수 호출 (Firebase signOut)
      console.log("[AppHeader] userService.logoutUser 호출 완료. 스토어 상태는 onAuthStateChanged가 업데이트 예정.");
  
      // Firebase signOut이 완료되면 onAuthStateChanged 리스너가 user=null로 실행되고
      // userStore.setUser(null) -> userStore.clearUser()가 자동으로 호출되어 스토어 상태가 초기화됩니다.
      // 따라서 여기서 userStore.clearUser()를 직접 호출할 필요는 없습니다.
  
      // 로그아웃 처리 후 스플래시 화면 또는 로그인 페이지로 이동
      // 일반적으로 로그아웃 후 로그인 페이지나 스플래시 페이지로 이동합니다.
      router.push("/"); // 또는 router.push('/login');
      console.log("[AppHeader] 로그아웃 후 /로 이동");
  
    } catch (error) {
      console.error("[AppHeader] 로그아웃 중 오류 발생:", error);
      alert("로그아웃 중 오류가 발생했습니다."); // 사용자에게 알림
    }
  };
  
  const goToProfile = () => {
   // Vue Router의 push 메소드를 사용하여 지정된 경로('/profile')로 이동합니다.
   // 이 경로는 src/router/index.js에 정의되어 있어야 합니다.
   router.push("/profile"); // <-- '/profile' 경로로 이동
   console.log("프로필 페이지로 이동 요청"); // 디버깅용 로그 (선택 사항)
  };
  </script>
  