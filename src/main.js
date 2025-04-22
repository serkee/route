import { createApp } from 'vue';
import './assets/css/reset.css';
import App from './App.vue';
import router from './router';
import pinia from './store';

// Firebase v9+ 모듈 API 사용
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore'; // getFirestore 함수 import


// Firebase 프로젝트 설정 정보
const firebaseConfig = {
    apiKey: "AIzaSyCsmoAvhD3IHD0ZD_-VKvRuDtACF4SD0B4",
    authDomain: "route-39ef2.firebaseapp.com",
    projectId: "route-39ef2",
    storageBucket: "route-39ef2.firebasestorage.com",
    messagingSenderId: "1069984410299",
    appId: "1:1069984410299:web:c7c480f00df44b0a90979e",
    measurementId: "G-XFSMVS2B6B"
};

const apps = getApps();
if (!apps.length) {
  initializeApp(firebaseConfig);
//   console.log("Firebase 앱 초기화 완료 (v9+)");
} else {
  getApp();
//   console.log("Firebase 앱 이미 초기화됨 (v9+)");
}

// Firestore 인스턴스 가져오기 (초기화 이후에만 호출)
const db = getFirestore(); // <-- 주석 해제하여 함수 호출 및 인스턴스 할당
// console.log("Firestore 인스턴스 가져옴 (v9+)", db);

// 다른 파일에서 Firestore 인스턴스를 사용하려면 export 합니다.
export { db }; // <-- db 인스턴스를 외부에서 import 할 수 있도록 export


const app = createApp(App);

app.use(router);
app.use(pinia);

app.mount('#app');