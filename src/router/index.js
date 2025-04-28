// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';

// 뷰 컴포넌트 임포트 - 이 부분은 그대로 유지합니다.
import HomeView from '../views/HomeView.vue';
import LoginView from '../views/LoginView.vue';
import SignupView from '../views/SignupView.vue';
import SplashView from '../views/SplashView.vue';
import MapView from '../views/MapView.vue';
import UserView from '../views/UserView.vue';
import BoardView from '../views/BoardView.vue';
import BoardWriteView from '../views/BoardWriteView.vue';
import BoardDetailView from '../views/BoardDetailView.vue';
import SimpleTestPage from '../views/SimpleTestPage.vue'
import UserProfileView from '@/views/UserProfileView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'

// ✅ 관리자 관련 컴포넌트 임포트
import AdminView from '../views/admin/AdminView.vue'; // 관리자 페이지 레이아웃
import UserManagement from '../views/admin/UserManagement.vue'; // 회원 관리 페이지
import MapManagement from '../views/admin/MapManagement.vue'; // 지도 관리 페이지
import BoardManagement from '../views/admin/BoardManagement.vue'; // 게시판 관리 페이지

// Pinia 스토어 사용을 위해 import
import { useUserStore } from '@/store/user'; // useUserStore 임포트

// Firebase Auth 임포트 - 라우터 가드에서 currentUser를 직접 사용하지 않으므로 삭제합니다.
// import { getAuth } from 'firebase/auth'; // ❌ 이 줄은 더 이상 필요 없습니다. 삭제합니다.


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
  }, {
    path: '/test-firestore', // 접근할 URL 경로
    name: 'testFirestore',
    component: SimpleTestPage // 컴포넌트 연결
  }, {
    path: '/profile', // 이동할 경로
    name: 'user-profile', // 라우트 이름 설정
    component: UserProfileView, // 임포트한 UserProfileView 컴포넌트 연결
    meta: { requiresAuth: true } // 이 페이지는 로그인 상태에서만 접근 가능하도록 설정
  }, {
    path: '/forgot-password', // 비밀번호 찾기 페이지
    name: 'forgot-password', // 라우트 이름
    component: ForgotPasswordView, // 임포트한 ForgotPasswordView 컴포넌트 연결
    meta: { requiresAuth: false } // 비밀번호 찾기 페이지는 인증 불필요
  },
  {
    path: '/admin', // 관리자 페이지 기본 경로
    name: 'admin',
    component: AdminView, // AdminView 컴포넌트 사용
    meta: { requiresAdmin: true }, // ✅ 관리자 권한이 필요함을 표시하는 메타 필드
    children: [ // 관리자 페이지 내 하위 메뉴에 대한 라우트
      {
        path: 'users', // '/admin/users' 경로
        name: 'adminUsers',
        component: UserManagement // 회원 관리 컴포넌트
      },
      {
        path: 'maps', // '/admin/maps' 경로
        name: 'adminMaps',
        component: MapManagement // 지도 관리 컴포넌트
      },
      {
        path: 'boards', // '/admin/boards' 경로
        name: 'adminBoards',
        component: BoardManagement // 게시판 관리 컴포넌트
      },
      // '/admin' 경로로만 접속했을 때 기본으로 리다이렉트될 하위 경로 설정
      {
        path: '', // '/admin' 기본 하위 경로
        redirect: { name: 'adminUsers' } // 예: 회원 관리 페이지로 리다이렉트
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 전역 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  console.log(`[Router Guard - START] 가드 실행 시작. From: ${from.path}, To: ${to.path}`);

  const userStore = useUserStore();

  // ✅ STEP 1: userStore가 초기 인증 상태와 사용자 정보를 완전히 로드할 때까지 기다립니다.
  try {
    console.log("[Router Guard] userStore 초기 인증 상태 파악 대기 중...");
    await userStore.getAuthReadyPromise();
    console.log("[Router Guard] userStore 초기 인증 상태 파악 완료.");
  } catch (error) {
    console.error("[Router Guard] getAuthReadyPromise 대기 중 오류:", error);
    alert("인증 상태 확인 중 오류가 발생했습니다. 다시 로그인해주세요.");
    next('/login');
    return;
  }

  // ✅ STEP 2: 로딩이 완료된 신뢰할 수 있는 사용자 상태와 라우트 요구사항을 확인합니다.
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = userStore.isAuthenticated;
  const isAdmin = userStore.isCurrentUserAdmin;

  console.log(`[Router Guard] 최종 상태 확인 - To: ${to.fullPath}, requiresAdmin: ${requiresAdmin}, requiresAuth: ${requiresAuth}, isLoggedIn: ${isLoggedIn}, isAdmin: ${isAdmin}`);

  // ✅ STEP 3: 확인된 상태 및 요구사항에 따라 최종 네비게이션 결정을 합니다.

  // 시나리오 1: 라우트가 관리자 권한을 필요로 하는 경우
  if (requiresAdmin) {
    if (isLoggedIn && isAdmin) {
      console.log(`[Router Guard] 관리자 ${userStore.currentUser?.uid} 접근 허용 (관리자 페이지).`);
      next();
    } else {
      console.warn(`[Router Guard] 접근 거부: ${to.fullPath}. 관리자 권한 필요.`);
      next({ name: 'home' }); // 관리자 아니면 홈으로 리다이렉트
    }
  }
  // 시나리오 2: 라우트가 일반 인증만 필요하고 (관리자 페이지는 아님), 로그인되지 않은 경우
  else if (requiresAuth && !isLoggedIn) {
      console.warn(`[Router Guard] 접근 거부: ${to.fullPath}. 인증 필요, 로그인 안됨.`);
      next({ name: 'login' }); // 로그인 페이지로 리다이렉트
  }
  // ✅ 시나리오 3: 사용자는 로그인 상태인데, 특정 공개 페이지(로그인, 회원가입, 스플래시 등)로 접근하려는 경우
  else if (isLoggedIn && !requiresAdmin && !requiresAuth) {
    // ✅✅✅ 리다이렉트할 공개 라우트 목록에 'splash' (즉, '/' 경로)를 추가합니다. ✅✅✅
    const unauthenticatedRoutesToRedirect = ['login', 'signup', 'forgot-password', 'splash']; // <-- 'splash' 추가

    if (unauthenticatedRoutesToRedirect.includes(to.name)) {
       console.log(`[Router Guard] 로그인 상태에서 공개 페이지 ${to.fullPath} 접근 시도. /home으로 리디렉션.`);
       // ✅✅✅ 로그인 후 기본 페이지로 리다이렉트 대상을 '/home' (name: 'home')으로 변경합니다. ✅✅✅
       // '/home' 라우트의 name이 'home'으로 되어 있어야 합니다.
       next({ name: 'home' }); // <-- { name: 'board', params: { category: 'all' } } 에서 변경
    } else {
      // 로그인 상태이고, 관리자/인증 페이지도 아니며, 리다이렉트 목록에 없는 다른 공개 페이지인 경우 -> 허용
      console.log(`[Router Guard] 로그인 상태에서 공개 페이지 ${to.fullPath} 접근 허용.`);
      next();
    }
  }
  // 시나리오 4: 위의 어떤 경우에도 해당하지 않는 경우 -> 허용
  else {
    console.log(`[Router Guard] 라우트 ${to.fullPath} 접근 허용.`);
    next();
  }

});


export default router;