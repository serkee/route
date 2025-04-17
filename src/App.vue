<template>
  <router-view v-if="!isAuthenticated" />
  <div v-else>
    <nav>
      <router-link to="/home">홈</router-link> |
      <router-link to="/map">지도</router-link> |
      <router-link to="/user">사용자</router-link> |
      <router-link to="/board">게시판</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const isAuthenticated = ref(false); // 로그인 상태를 관리하는 ref
    const router = useRouter();

    // 앱이 마운트될 때 로컬 스토리지 또는 다른 방법으로 로그인 상태를 확인할 수 있습니다.
    onMounted(() => {
      // 예시: 로컬 스토리지에서 토큰을 확인하여 로그인 상태 설정
      const token = localStorage.getItem('authToken');
      if (token) {
        isAuthenticated.value = true;
        router.push('/home'); // 로그인되어 있다면 홈 화면으로 이동
      } else {
        router.push('/'); // 로그인되어 있지 않다면 스플래시 화면으로 이동 (경로 '/' 가정)
      }
    });

    // 실제 앱에서는 로그인/회원가입 컴포넌트에서 로그인 성공 시 isAuthenticated를 true로 변경해야 합니다.
    const loginSuccess = () => {
      isAuthenticated.value = true;
      localStorage.setItem('authToken', 'example-token'); // 예시: 토큰 저장
      router.push('/home');
    };

    const logout = () => {
      isAuthenticated.value = false;
      localStorage.removeItem('authToken'); // 예시: 토큰 제거
      router.push('/');
    };

    return {
      isAuthenticated,
      loginSuccess, // 예시로 제공하는 로그인 성공 함수 (실제 구현에 따라 다름)
      logout,       // 예시로 제공하는 로그아웃 함수 (실제 구현에 따라 다름)
    };
  },
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>