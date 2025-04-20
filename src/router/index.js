import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
// import AboutView from '../views/AboutView.vue'; // 예시: 다른 뷰 파일
import LoginView from '../views/LoginView.vue';
import SignupView from '../views/SignupView.vue';
import SplashView from '../views/SplashView.vue';
import MapView from '../views/MapView.vue'; // MapView import
import UserView from '../views/UserView.vue'; // UserView import
import BoardView from '../views/BoardView.vue'; // BoardView import

// Pinia 스토어 사용을 위해 import
import { useUserStore } from '@/store/user';

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
  // 다른 라우트들...
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 전역 네비게이션 가드
router.beforeEach((to, from, next) => {
  const userStore = useUserStore(); // 스토어 인스턴스 가져오기

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isLoggedIn = userStore.isLoggedIn;

  // 인증이 필요한 라우트에 접근하려 할 때
  if (requiresAuth) {
    // 로그인 되어 있지 않다면 로그인 페이지로 리디렉션
    if (!isLoggedIn) {
      next('/login');
    } else {
      next(); // 로그인 되어 있다면 이동 허용
    }
  } else {
    // 인증이 필요 없는 라우트에 접근하려 할 때 (스플래시, 로그인, 회원가입)
    // 만약 이미 로그인 되어 있다면 홈 화면으로 리디렉션 (선택 사항)
    if (isLoggedIn && (to.path === '/' || to.path === '/login' || to.path === '/signup')) {
        next('/home');
    } else {
        next(); // 로그인 되어 있지 않거나 다른 인증 불필요 페이지는 이동 허용
    }
  }
});


export default router;