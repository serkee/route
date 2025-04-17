// src/store/user.js
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: '',
    isLoggedIn: false,
  }),
  getters: {
    fullName: (state) => state.name,
  },
  actions: {
    setUser(userData) {
      this.name = userData.name;
      this.email = userData.email;
      this.isLoggedIn = true;
    },
    clearUser() {
      this.name = '';
      this.email = '';
      this.isLoggedIn = false;
    },
  },
});