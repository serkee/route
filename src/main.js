import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import pinia from './store'; // store/index.js에서 내보낸 pinia 인스턴스를 가져옵니다.

const app = createApp(App);

app.use(router);
app.use(pinia); // Pinia를 Vue 앱에 사용하도록 설정합니다.

app.mount('#app');