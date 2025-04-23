import { createApp } from 'vue';
import './assets/css/reset.css';
import App from './App.vue';
import router from './router';
import pinia from './store';

// Firebase 서비스 인스턴스를 firebase.js 파일에서 import 합니다.
// firebase.js에서 Firebase 초기화가 일어납니다.
import { auth, db, storage } from '@/firebase'; // <-- auth, db, storage import


const app = createApp(App);

// Firebase 서비스 인스턴스들을 Vue 애플리케이션에 provide 합니다.
// 이제 컴포넌트에서 inject를 통해 이 서비스 인스턴스들을 받아 사용할 수 있습니다.
app.provide('firebaseAuth', auth);
app.provide('firestoreDb', db);
app.provide('firebaseStorage', storage);


app.use(router);
app.use(pinia);

app.mount('#app');

// 필요하다면 여기서도 서비스 인스턴스를 사용할 수 있습니다.
// console.log("main.js - Firestore 인스턴스:", db);