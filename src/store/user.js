// src/store/user.js

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    // user: null, // Firebase Auth user 객체 전체를 저장하고 싶다면 주석 해제
    uid: null, // 사용자의 고유 ID
    name: null, // 사용자의 닉네임 (displayName)
    profileImageUrl: null, // 사용자의 프로필 사진 URL (photoURL)
    isAuthenticated: false, // 사용자의 로그인 상태
  }),
  actions: {
    // 액션: 로그인 성공 또는 인증 상태 변경 시 사용자 정보를 스토어에 설정
    // userData 인자는 { uid, name, profileImageUrl, user(optional) } 형태
    setUser(userData) {
      // this.user = userData.user || null; // user 객체 저장 시
      this.uid = userData.uid;
      this.name = userData.name; // 닉네임 설정
      this.profileImageUrl = userData.profileImageUrl; // 프로필 사진 URL 설정
      this.isAuthenticated = true; // 로그인 상태 true

      console.log("[userStore] 사용자 정보 설정:", this.$state);
    },
    // 액션: 로그아웃 시 사용자 정보 초기화
    clearUser() {
      // this.user = null; // user 객체 저장 시 초기화
      this.uid = null;
      this.name = null; // 닉네임 초기화
      this.profileImageUrl = null; // 프로필 사진 URL 초기화
      this.isAuthenticated = false; // 로그인 상태 false

       console.log("[userStore] 사용자 정보 초기화");
    },
    // TODO: 필요하다면 다른 사용자 관련 액션/게터 추가 (예: 프로필 정보 업데이트 등)
  },
  getters: {
    // TODO: 필요하다면 사용자 정보 편리하게 가져오는 게터 추가
    // 예: getUserDisplayName: (state) => state.name || '익명',
    // 예: isUserLoggedIn: (state) => state.isAuthenticated,
  }
});