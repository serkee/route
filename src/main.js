// src/main.js
import '@/assets/css/reset.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
// userService에서 필요한 함수/객체를 subscribeToAuthStateChanges 대신 임포트합니다.
// import * as userService from './services/userService'; // <-- 이 임포트는 더 이상 필요하지 않습니다.
import { useUserStore } from './store/user'; // user 스토어 임포트

// Firebase Auth 상태를 직접 확인하는 경우에만 getAuth가 필요할 수 있습니다.
// 라우터 가드에서 getAuth를 사용하므로 여기서는 제거 가능합니다.
// import { getAuth } from 'firebase/auth';


console.log("[main.js] --- 앱 초기화 시작 ---");

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// user 스토어 사용
const userStore = useUserStore();

// Subscribe to auth state changes and sync with userStore - 이 로직은 userStore.js의 onAuthStateChanged 리스너가 처리합니다.
// 따라서 여기서 subscribeToAuthStateChanges() 함수를 호출할 필요가 없습니다.
// userService.subscribeToAuthStateChanges(); // <-- 이 줄을 삭제합니다.

// 초기 Firebase Auth 상태가 준비될 때까지 기다린 후 앱을 마운트합니다.
// userStore의 authReadyPromise를 기다립니다.
async function initializeApp() {
  console.log("[main.js] 라우터 및 인증 상태 준비 대기 시작.");

  try {
    // userStore가 초기 인증 상태를 파악할 때까지 기다립니다.
    // 이 promise는 userStore.js의 onAuthStateChanged 리스너에 의해 resolve됩니다.
    await userStore.authReadyPromise;

    console.log("[main.js] Promise.all 완료. 라우터와 Firebase Auth 상태가 모두 준비되었습니다.");

    // 모든 준비가 끝나면 앱을 마운트합니다.
    app.mount('#app');
    console.log("[main.js] 앱을 마운트합니다.");

  } catch (error) {
    console.error("[main.js] 앱 초기화 중 오류 발생:", error);
    // 초기화 오류 처리 (예: Firebase 연결 문제)
  }
}

// 비동기 초기화 함수 호출
initializeApp();


console.log("[main.js] --- 앱 초기화 코드 끝 ---");

// 참고:
// userStore.js의 onAuthStateChanged 리스너가 인증 상태를 감지하고 스토어 상태를 동기화합니다.
// 라우터 가드 (router.beforeEach)가 userStore.authReadyPromise를 사용하여 네비게이션이 상태를 기다리도록 합니다.
// 따라서 main.js에서는 별도의 구독 함수 호출이 필요 없습니다.