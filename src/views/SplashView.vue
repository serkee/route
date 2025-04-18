<template>
  <div class="splash-screen">
    <video autoplay loop muted class="background-video">
      <source src="@/assets/movie/bg_splash.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <div class="content">
      <h1>Route Finding</h1>
      <p>지금 위대한 기록을 시작하세요</p>
      <div class="bottom-container">
        <button @click="goToLogin">로그인</button>
        <button @click="goToSignup" class="green-button">회원가입</button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();

    const goToLogin = () => {
      router.push('/login');
    };

    const goToSignup = () => {
      router.push('/signup');
    };

    return {
      goToLogin,
      goToSignup,
    };
  },
};
</script>

<style scoped>
.splash-screen {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-bottom: 54px;
}

.background-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1; /* Place the video behind the content */
}

.content {
  position: relative; /* Ensure content is above the video */
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

h1 {
  margin-bottom: 1em;
  color: white; /* Adjust text color for better visibility */
  font-weight: bold;
  font-size: 2.5em;
  letter-spacing: -.05em;
  text-shadow: 0 0 20px rgba(0, 0, 0, .5);
}

p {
  color: white; /* Adjust text color for better visibility */
  opacity: .7;
}




</style>