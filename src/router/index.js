// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
// 뷰 컴포넌트 임포트 - 이 부분은 그대로 유지합니다.
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
import UserProfileView from '@/views/UserProfileView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'

// Pinia 스토어 사용을 위해 import
// useUserStore는 라우트 가드에서 userStore 인스턴스를 얻기 위해 필요합니다.
import { useUserStore } from '@/store/user'; // ✅ useUserStore는 여기서 필요합니다.

// userService에서 인증 상태 준비 Promise import - FIX: 이 임포트는 잘못되었습니다. 삭제합니다.
// import { authReadyPromise } from '@/services/userService'; // <-- ❌ 이 줄을 삭제합니다.

// Firebase Auth 임포트 - 라우터 가드에서 currentUser를 확인하기 위해 필요할 수 있습니다.
import { getAuth } from 'firebase/auth'; // getAuth 임포트 (가드에서 필요시 사용)


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
  },{
    path: '/profile', // 이동할 경로
    name: 'user-profile', // 라우트 이름 설정
    component: UserProfileView, // 임포트한 UserProfileView 컴포넌트 연결
    meta: { requiresAuth: true } // 이 페이지는 로그인 상태에서만 접근 가능하도록 설정
  },{
    path: '/forgot-password', // 비밀번호 찾기 페이지
    name: 'forgot-password', // 라우트 이름
    component: ForgotPasswordView, // 임포트한 ForgotPasswordView 컴포넌트 연결
    // meta 필드를 생략하거나 requiresAuth: false로 설정합니다. (로그인 필요 없음)
    // meta: { requiresAuth: false }
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 전역 네비게이션 가드
router.beforeEach(async (to, from, next) => { // 가드 함수를 async로 만듭니다.
  console.log("[Router Guard - START] 가드 실행 시작.");
  // useUserStore를 사용하여 userStore 인스턴스를 가져옵니다.
  const userStore = useUserStore();
  // getAuth()를 사용하여 현재 사용자를 확인합니다.
  const currentUser = getAuth().currentUser;

  console.log("[Router Guard - START] userStore.isAuthenticated (초기):", userStore.isAuthenticated); // 초기 상태 로그
  console.log("[Router Guard - START] currentUser (초기):", currentUser ? currentUser.uid : "None"); // 현재 사용자 UID 로그

  // Firebase 인증 상태가 파악될 때까지 기다립니다.
  // userStore.js에서 onAuthStateChanged 리스너가 첫 상태를 파악하고 userStore.authReadyPromise를 resolve합니다.
  try {
      console.log("[Router Guard] 인증 상태 파악 대기 중..."); // 대기 시작 로그
      // --- FIX: userStore의 authReadyPromise를 기다립니다. ---
      // 이전 코드: await authReadyPromise; // ❌ userService에서 임포트한 것을 기다림
      await userStore.authReadyPromise; // ✅ userStore에서 가져온 Promise를 기다립니다.
      // ---------------------------------------------------
      console.log("[Router Guard] 인증 상태 파악 완료."); // 대기 완료 로그
      // 대기 완료 후 userStore.isAuthenticated 값은 Firebase의 실제 인증 상태로 업데이트되어 있습니다.
  } catch (error) {
       console.error("[Router Guard] authReadyPromise 대기 중 오류:", error);
       // 오류 발생 시 (예: Firebase 초기화 실패 등) 로그인 페이지로 강제 이동 또는 다른 오류 처리
       // 사용자에게 오류 알림 후 next('/login') 등으로 처리할 수 있습니다.
       next('/login'); // 오류 시 로그인 페이지로 리디렉션하는 예시
       return; // 가드 실행 중단
  }


  // 대기 후 업데이트된 userStore 상태를 다시 확인합니다.
  // useUserStore()를 다시 호출할 필요 없이, 이미 가져온 userStore 인스턴스의 상태가 최신입니다.
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = userStore.isAuthenticated; // ✅ 이 값은 이제 신뢰할 수 있습니다.

  console.log(`[Router Guard] 대기 후 확인 - From: ${from.path}, To: ${to.path}, requiresAuth: ${requiresAuth}, isLoggedIn: ${isLoggedIn}`);

  // 네비게이션 로직
  if (requiresAuth && !isLoggedIn) {
    console.log("[Router Guard] 인증 필요, 로그인 안됨 -> /login 리디렉션");
    next('/login');
  } else if (!requiresAuth && isLoggedIn && (to.path === '/' || to.path === '/login' || to.path === '/signup' || to.name === 'forgot-password')) {
     // 로그인된 상태에서 인증 불필요 페이지 (스플래시, 로그인, 회원가입, 비밀번호 찾기) 접근 시
     console.log("[Router Guard] 인증 불필요 페이지 접근, 로그인 됨 -> /board 리디렉션"); // /board로 리디렉션
     next('/board');
  } else {
    console.log("[Router Guard] 이동 허용");
    next(); // 원래 가려던 경로로 이동
  }
});


export default router;