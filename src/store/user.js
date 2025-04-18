// src/store/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: '',
    isLoggedIn: false,
    profileImageUrl: '', // 프로필 이미지 URL 상태 추가
  }),
  getters: {
    fullName: (state) => state.name,
  },
  actions: {
    setUser(userData) {
      this.name = userData.name;
      this.email = userData.email;
      this.isLoggedIn = true;
      this.profileImageUrl = userData.profileImageUrl || ''; // 프로필 이미지 URL 저장
      localStorage.setItem('authToken', 'example-token'); // 토큰 저장 (예시)
      // 실제 앱에서는 사용자 정보 전체 또는 일부를 로컬 스토리지에 저장할 수 있습니다.
      // 예: localStorage.setItem('userInfo', JSON.stringify({ name: userData.name, email: userData.email, profileImageUrl: userData.profileImageUrl }));
    },
    clearUser() {
      this.name = '';
      this.email = '';
      this.isLoggedIn = false;
      this.profileImageUrl = ''; // 로그아웃 시 프로필 이미지 URL 초기화
      localStorage.removeItem('authToken');
      // 예: localStorage.removeItem('userInfo');
    },
    checkAuthOnLoad() {
      const token = localStorage.getItem('authToken');
      this.isLoggedIn = !!token;
      // 실제 앱에서는 토큰이 있다면 백엔드에서 사용자 정보를 가져와야 합니다.
      // 예:
      // if (token) {
      //   fetch('/api/user/profile', {
      //     headers: { 'Authorization': `Bearer ${token}` }
      //   })
      //   .then(res => res.json())
      //   .then(data => {
      //     if (data.success) {
      //       this.setUser(data.user); // 백엔드에서 받은 사용자 정보로 상태 업데이트
      //     } else {
      //       this.clearUser(); // 토큰이 유효하지 않으면 로그아웃 처리
      //     }
      //   })
      //   .catch(error => {
      //     console.error('Failed to fetch user profile:', error);
      //     this.clearUser(); // 오류 발생 시 로그아웃 처리
      //   });
      // }

      // 임시 처리: 토큰이 있다면 로컬 스토리지에 저장된 임시 정보를 로드 (실제 앱에서는 백엔드 연동 필요)
      // const userInfo = localStorage.getItem('userInfo');
      // if (this.isLoggedIn && userInfo) {
      //   const parsedUserInfo = JSON.parse(userInfo);
      //   this.name = parsedUserInfo.name || '';
      //   this.email = parsedUserInfo.email || '';
      //   this.profileImageUrl = parsedUserInfo.profileImageUrl || '';
      // }
    },
  },
});