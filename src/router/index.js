import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
// import AboutView from '../views/AboutView.vue'; // 예시: 다른 뷰 파일
import LoginView from '../views/LoginView.vue';
import SignupView from '../views/SignupView.vue';
import SplashView from '../views/SplashView.vue';
import MapView from '../views/MapView.vue'; // MapView import
import UserView from '../views/UserView.vue'; // UserView import
import BoardView from '../views/BoardView.vue'; // BoardView import
import BoardWriteView from '../views/BoardWriteView.vue';
import BoardDetailView from '../views/BoardDetailView.vue';
import SimpleTestPage from '../views/SimpleTestPage.vue'

// Pinia 스토어 사용을 위해 import
import { useUserStore } from '@/store/user';
// userService에서 인증 상태 준비 Promise import
import { authReadyPromise } from '@/services/userService'; // <--- 이 Promise를 import 합니다.


const routes = [
  {
    path: '/',
    name: 'splash',
    component: SplashView,
    meta: { requiresAuth: false } // 인증 필요 없음
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false } // 인증 필요 없음
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupView,
    meta: { requiresAuth: false } // 인증 필요 없음
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true } // 인증 필요
  },
  {
    path: '/map', // MapView 라우트
    name: 'map',
    component: MapView,
    meta: { requiresAuth: true } // 인증 필요
  },
  {
    path: '/user', // UserView 라우트
    name: 'user',
    component: UserView,
    meta: { requiresAuth: true } // 인증 필요
  },
  {
    path: '/board', // BoardView 라우트
    name: 'board',
    component: BoardView,
    meta: { requiresAuth: true } // 인증 필요
  },
  {
    path: '/board/write', // 게시글 작성 페이지 라우트 정의
    name: 'board-write',
    component: BoardWriteView,
    meta: { requiresAuth: true } // 작성 페이지도 로그인이 필요하다고 가정
  },
  {
    path: '/board/:id', // 게시글 상세 페이지 라우트 정의, 동적 파라미터 ':id' 사용
    name: 'board-detail',
    component: BoardDetailView,
    meta: { requiresAuth: true } // 상세 페이지도 로그인이 필요하다고 가정
  },{
    path: '/test-firestore', // 접근할 URL 경로
    name: 'testFirestore',
    component: SimpleTestPage // 컴포넌트 연결
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 전역 네비게이션 가드
router.beforeEach(async (to, from, next) => { // <--- 가드 함수를 async로 만듭니다.
  console.log("[Router Guard - START] 가드 실행 시작.");
  const userStore = useUserStore();
  console.log("[Router Guard - START] userStore.isAuthenticated (초기):", userStore.isAuthenticated); // 초기 상태 로그

  // Firebase 인증 상태가 파악될 때까지 기다립니다.
  // authReadyPromise는 userService에서 export되며,
  // onAuthStateChanged 리스너가 첫 상태를 파악했을 때 resolve됩니다.
  try {
      console.log("[Router Guard] 인증 상태 파악 대기 중..."); // 대기 시작 로그
      await authReadyPromise; // <--- 여기서 Promise가 resolve될 때까지 기다립니다.
      console.log("[Router Guard] 인증 상태 파악 완료."); // 대기 완료 로그
      // 대기 완료 후 userStore.isAuthenticated 값은 이미 업데이트되어 있습니다.
  } catch (error) {
       console.error("[Router Guard] authReadyPromise 대기 중 오류:", error);
       // 오류 발생 시 로그인 페이지로 강제 이동 또는 다른 오류 처리
       // 예: 사용자에게 오류 알림 후 next('/login')
       next('/login'); // 오류 시 로그인 페이지로 리디렉션
       return; // 가드 실행 중단
  }


  // 대기 후 업데이트된 userStore 상태를 다시 확인합니다.
  // useUserStore()를 다시 호출할 필요 없이, 이미 가져온 userStore 인스턴스의 상태가 최신입니다.
  // const updatedUserStore = useUserStore(); // 필요 없음
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = userStore.isAuthenticated; // <--- 이제 이 값은 Firebase의 실제 인증 상태입니다.

  console.log(`[Router Guard] 대기 후 확인 - From: ${from.path}, To: ${to.path}, requiresAuth: ${requiresAuth}, isLoggedIn: ${isLoggedIn}`);

  // 기존 네비게이션 로직 유지
  if (requiresAuth && !isLoggedIn) {
    console.log("[Router Guard] 인증 필요, 로그인 안됨 -> /login 리디렉션");
    next('/login');
  } else if (!requiresAuth && isLoggedIn && (to.path === '/' || to.path === '/login' || to.path === '/signup')) {
    console.log("[Router Guard] 인증 불필요 페이지 접근, 로그인 됨 -> /home 리디렉션");
    next('/home');
  } else {
    console.log("[Router Guard] 이동 허용");
    next(); // 원래 가려던 경로로 이동
  }
});


export default router;