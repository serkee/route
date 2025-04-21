<template>
  <div id="app">
    <router-view />
    <nav v-if="userStore.isLoggedIn">
      <router-link to="/home">홈</router-link> |
      <router-link to="/map">지도</router-link> |
      <router-link to="/user">사용자</router-link> |
      <router-link to="/board">게시판</router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
// useRouter는 이제 App.vue에서 직접 리디렉션하지 않으므로 필요 없을 수 있습니다.
// import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user'; // 스토어 경로에 맞춰 수정
// AppHeader는 HomeView 등 각 페이지에서 직접 사용하므로 App.vue에서는 import 하지 않음


const userStore = useUserStore();
// const router = useRouter(); // 사용하지 않는다면 제거

onMounted(() => {
  // 앱 로딩 시 인증 상태 확인 (로컬 스토리지 등)
  userStore.checkAuthOnLoad();
  console.log('App.vue - onMounted - userStore.isLoggedIn:', userStore.isLoggedIn);
  // onMounted에서의 리디렉션 로직은 네비게이션 가드로 대체됩니다.
});

// App.vue에서는 더 이상 리디렉션 함수가 필요 없습니다.
</script>

<style scoped>
#app {
  /* font-family: Avenir, Helvetica, Arial, sans-serif; */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 네비게이션 가드가 레이아웃을 제어하므로 authenticated-layout은 필요 없을 수 있습니다. */
/* 만약 로그인/로그아웃 상태에 따라 전체 레이아웃이 달라진다면 유지 */
/* .authenticated-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
} */

/* 라우트 뷰가 표시될 주 영역 스타일 (필요하다면) */
/* .main-content {
  flex-grow: 1;
  overflow-y: auto;
   패딩 조정 (헤더와 네비게이션 바 높이 고려)
  padding-bottom: 70px;
} */


nav {
  border-top: 1px solid #e1e1e1;
  left: 0;
  right: 0;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  /* 하단 고정을 원하면 주석 해제 */
  /* position: fixed; */
  /* bottom: 0; */
  /* width: 100%; */
}

nav a {
  color: #999;
  text-decoration: none;
  flex: 1;
  text-align: center;
  font-size: 13px;
}
nav a:before{
  content: '';
  display: block;
  width: 20px;
  height: 18px;
  background-color:#999;
  -webkit-mask-image: url(~@/assets/images/common/ico_menu_home.svg);
  -webkit-mask-size: cover;
  margin: 0 auto 4px;
}
nav a:nth-child(2):before{
  -webkit-mask-image: url(~@/assets/images/common/ico_menu_map.svg);
}
nav a:nth-child(3):before{
  -webkit-mask-image: url(~@/assets/images/common/ico_menu_user.svg);
}
nav a:nth-child(4):before{
  -webkit-mask-image: url(~@/assets/images/common/ico_menu_board.svg);
}

nav a.router-link-exact-active {
  color: #005fec;
  font-weight: bold;
}
nav a.router-link-exact-active:before{
  background-color:#005fec;
}
</style>