import { createRouter, createWebHistory } from 'vue-router';
import SplashView from '../views/SplashView.vue';
import LoginView from '../views/LoginView.vue';
import SignupView from '../views/SignupView.vue';
import HomeView from '../views/HomeView.vue';
import MapView from '../views/MapView.vue';
import UserView from '../views/UserView.vue';
import BoardView from '../views/BoardView.vue';

const routes = [
  {
    path: '/',
    name: 'Splash',
    component: SplashView,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
  },
  {
    path: '/signup',
    name: 'Signup',
    component: SignupView,
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
  },
  {
    path: '/map',
    name: 'Map',
    component: MapView,
  },
  {
    path: '/user',
    name: 'User',
    component: UserView,
  },
  {
    path: '/board',
    name: 'Board',
    component: BoardView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;