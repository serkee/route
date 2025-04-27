// src/store/user.js - 수정된 코드

import { ref, computed } from 'vue'; // Pinia setup store에서는 ref, computed 사용
import { defineStore } from 'pinia';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// 초기 인증 상태 파악 완료를 추적하기 위한 변수와 Promise
let initialAuthStateResolved = false;
let authReadyPromiseResolve;
const authReadyPromise = new Promise(resolve => {
  authReadyPromiseResolve = resolve;
});

export const useUserStore = defineStore('user', () => {
  // State: ref()를 사용하여 상태 변수 선언
  const uid = ref(null);
  const email = ref(null);
  const name = ref(null);
  const isAuthenticated = ref(false);
  const isAdmin = ref(false);
  const profileImageUrl = ref(null);

  // Getters: computed()를 사용하여 게터 정의
  const isCurrentUserAdmin = computed(() => isAuthenticated.value && isAdmin.value);

  // Actions (또는 Setup Store의 함수) 정의
  const setUser = async (user) => {
    console.log("[userStore] setUser 시작 UID:", user ? user.uid : "null");

    if (user) {
      // 사용자가 로그인됨
      uid.value = user.uid;
      isAuthenticated.value = true; // 로그인 상태 설정

      // Auth 객체에서 기본 정보 가져오기
      email.value = user.email;
      console.log("[userStore] DEBUG - Auth userData (setUser 시작):", { uid: user.uid, email: user.email, name: user.displayName, profileImageUrl: user.photoURL });


      // Firestore에서 추가 사용자 데이터 가져오기 (비동기)
      const userDocRef = doc(db, 'users', user.uid);
      try {
        console.log("[userStore] Firestore에서 사용자 문서 조회 시도:", userDocRef.path);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const firestoreUserData = userDocSnap.data();
          console.log("[userStore] Firestore 사용자 문서 가져옴:", firestoreUserData);

          // 스토어 상태 업데이트 (Firestore 데이터 우선, 없으면 Auth 데이터 사용)
          email.value = firestoreUserData.email || user.email || null; // Firestore 이메일 또는 Auth 이메일
          console.log("[userStore] 이메일 결정:", email.value);

          name.value = firestoreUserData.username || user.displayName || email.value || user.uid || '사용자'; // Firestore 닉네임 또는 Auth displayName 등
          console.log("[userStore] 이름 결정:", name.value);

          isAdmin.value = firestoreUserData.isAdmin || false; // Firestore isAdmin 또는 false
          console.log(`[userStore] 사용자 ${user.uid} 관리자 여부:`, isAdmin.value);

          profileImageUrl.value = firestoreUserData.photoURL || user.photoURL || null; // Firestore photoURL 또는 Auth photoURL
          console.log("[userStore] 이미지 결정:", profileImageUrl.value ? "Firestore/Auth photoURL 사용" : "이미지 없음");
          if(profileImageUrl.value) console.log("  URL:", profileImageUrl.value);

        } else {
          console.warn(`[userStore] 사용자 문서 (ID: ${user.uid})가 Firestore에 없습니다. 기본 정보 사용.`);
          // Firestore 문서가 없을 경우 Auth 정보나 기본값 사용
          name.value = user.displayName || user.email || user.uid || '새 사용자';
          isAdmin.value = false;
          profileImageUrl.value = user.photoURL || null;
          // email.value는 이미 설정됨
          console.log("[userStore] 이름 결정 (문서 없음):", name.value);
          console.log(`[userStore] 사용자 ${user.uid} 관리자 여부 (문서 없음):`, isAdmin.value);
          console.log("[userStore] 이미지 결정 (문서 없음):", profileImageUrl.value ? "Auth photoURL 사용" : "이미지 없음");
        }
      } catch (firestoreError) {
        console.error("[userStore] Firestore 사용자 문서 가져오기 오류:", firestoreError);
        // Firestore 조회 실패 시 Auth 정보나 기본값 사용
        name.value = user.displayName || user.email || user.uid || '오류 사용자';
        isAdmin.value = false;
        profileImageUrl.value = user.photoURL || null;
        email.value = email.value || user.email || null; // 이메일도 fallback
        console.log("[userStore] 이름 결정 (Firestore 오류):", name.value);
        console.log(`[userStore] 사용자 ${user.uid} 관리자 여부 (Firestore 오류):`, isAdmin.value);
        console.log("[userStore] 이미지 결정 (Firestore 오류):", profileImageUrl.value ? "Auth photoURL 사용" : "이미지 없음");
      }

    } else {
      // 사용자가 로그아웃됨
      clearUser(); // clearUser 함수 사용하여 상태 초기화
      console.log("[userStore] setUser 완료: 사용자 로그아웃 상태.");
    }

    // 최종 스토어 상태 로깅 (검증용)
    console.log("[userStore] setUser 완료. 현재 스토어 상태:", {
      uid: uid.value,
      name: name.value,
      isAuthenticated: isAuthenticated.value,
      isAdmin: isAdmin.value,
      profileImageUrl: profileImageUrl.value,
      email: email.value
    });
  };

  // 로그아웃 또는 비인증 상태 시 사용자 상태 초기화 함수
  const clearUser = () => {
    uid.value = null;
    email.value = null;
    name.value = null;
    isAuthenticated.value = false; // 비인증 상태 설정
    isAdmin.value = false;
    profileImageUrl.value = null;
    console.log("[userStore] clearUser 완료. 스토어 상태 초기화.");
  };

  // Firebase Auth 상태 변경 리스너 설정 (스토어 초기화 시 실행)
  // 이 리스너는 Firebase 인증 상태가 변경될 때마다(앱 시작, 로그인, 로그아웃 등) 실행됨
  onAuthStateChanged(auth, async (user) => {
    console.log("[userStore] onAuthStateChanged 리스너 실행. User:", user ? user.uid : "null");
    await setUser(user); // Firebase에서 받은 user 객체로 스토어 상태 업데이트

    // onAuthStateChanged 리스너가 처음 실행되어 초기 인증 상태를 파악했을 때 promise 해결
    if (!initialAuthStateResolved) {
        initialAuthStateResolved = true;
        console.log("[userStore] initialAuthStateResolved = true. authReadyPromise 해결.");
        authReadyPromiseResolve(user); // Promise 해결
    }
     console.log("[userStore] onAuthStateChanged 리스너 완료.");
  });


  // authReadyPromise를 반환하는 함수 (라우터 가드 등에서 await 가능)
  const getAuthReadyPromise = () => authReadyPromise;


  // Pinia 스토어에서 외부로 노출할 상태, 게터, 함수들을 반환합니다.
  return {
    // state
    uid,
    email,
    name,
    isAuthenticated, // 라우터 가드에서 이 값을 확인하게 됩니다.
    isAdmin,
    profileImageUrl,

    // getters
    isCurrentUserAdmin,

    // actions (setup store에서는 일반 함수)
    setUser, // 필요한 경우 외부에서도 호출 가능
    clearUser, // 필요한 경우 외부에서도 호출 가능
    getAuthReadyPromise // 초기 인증 상태 대기용 함수
  };
});