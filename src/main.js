// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // 라우터 인스턴스 import
import { createPinia } from 'pinia'; // Pinia import
import '@/firebase'; // Firebase 초기화 (auth 인스턴스 등을 설정)
// userService에서 인증 상태 준비 Promise와 리스너 설정 함수 import
import { authReadyPromise, subscribeToAuthStateChanges } from '@/services/userService';


// 전역 스타일 import
import '@/assets/css/reset.css';


const app = createApp(App);
const pinia = createPinia(); // Pinia 인스턴스 생성

app.use(pinia); // Pinia 사용
app.use(router); // 라우터 사용

console.log("[main.js] --- 앱 초기화 시작 ---"); // <--- 이 로그를 추가합니다.

subscribeToAuthStateChanges(); // 인증 상태 리스너 설정 함수 호출

console.log("[main.js] 라우터 및 인증 상태 준비 대기 시작."); // <--- 이 로그를 추가합니다.

// 라우터가 준비될 때까지 기다리고,
// Firebase 인증 상태가 파악되어 Pinia 스토어에 반영될 때까지 기다린 후
// 애플리케이션을 마운트합니다.
Promise.all([router.isReady(), authReadyPromise])
  .then(() => {
    console.log("[main.js] Promise.all 완료. 라우터와 Firebase Auth 상태가 모두 준비되었습니다."); // <--- 이 로그를 추가합니다.
    console.log("[main.js] 앱을 마운트합니다."); // <--- 이 로그를 추가합니다.
    app.mount('#app'); // 모든 준비가 완료된 후 앱 마운트
  })
  .catch(error => {
    console.error("[main.js] 라우터 또는 인증 상태 대기 중 오류 발생:", error); // <--- 이 로그를 추가합니다.
    // 오류 발생 시 사용자에게 메시지를 보여주는 등의 오류 처리 로직 추가
    // 예: document.getElementById('app').innerHTML = '앱 로딩 중 오류 발생';
  });

console.log("[main.js] --- 앱 초기화 코드 끝 ---"); // <--- 이 로그를 추가합니다