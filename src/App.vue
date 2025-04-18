<template>
  <div id="app">
    <router-view v-if="!userStore.isLoggedIn" />
    <div v-else class="authenticated-layout">
        <router-view />
      <nav>
        <router-link to="/home">홈</router-link>
        <router-link to="/map">지도</router-link>
        <router-link to="/user">사용자</router-link>
        <router-link to="/board">게시판</router-link>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user'; // 스토어 경로에 맞춰 수정

const userStore = useUserStore();
const router = useRouter();

onMounted(() => {
  userStore.checkAuthOnLoad();
  console.log('App.vue - onMounted - userStore.isLoggedIn:', userStore.isLoggedIn);
  if (userStore.isLoggedIn && router.currentRoute.value.path === '/') {
    router.push('/home');
  } else if (!userStore.isLoggedIn && router.currentRoute.value.path !== '/') {
    router.push('/');
  }
});
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.authenticated-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.container {
  flex-grow: 1;
  overflow-y: auto;
}

nav {
  border-top: 1px solid #e1e1e1;
  left: 0;
  right: 0;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white; /* 추가: 배경색 설정 */
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