// src/store/user.js

import { defineStore } from 'pinia';
// 'auth'는 onAuthStateChanged에, 'db'는 firestore 함수에 사용됩니다.
import { auth, db } from '@/firebase';

// userStore 내에서 실제로 사용되는 Firebase Auth 함수만 임포트합니다.
import { onAuthStateChanged } from 'firebase/auth';

// userStore 내에서 실제로 사용되는 Firestore 함수만 임포트합니다.
import { doc, getDoc } from 'firebase/firestore';

// userStore 내에서 사용되지 않는 모든 Firebase Storage 함수와
// updateProfile, signOut, setDoc 함수 임포트는 제거합니다.
// import { updateProfile, signOut } from 'firebase/auth'; // <-- 이 줄은 제거합니다.
// import { setDoc } from 'firebase/firestore'; // <-- 이 줄은 제거합니다.
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // <-- 이 줄은 제거합니다.


// Helper to create a promise that resolves when auth state is ready
const authReadyPromise = new Promise((resolve) => {
  console.log("[userService] 인증 상태 변경 리스너 설정.");
  // onAuthStateChanged 함수와 auth 인스턴스 사용
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("[userService] 인증 리스너: 사용자 로그인 상태 확인 및 스토어 설정.");
    resolve(user);
    unsubscribe();
    console.log("[userService] authReadyPromise resolved.");
  });
   console.log("[userService] onAuthStateChanged 리스너 등록 완료.");
});


export const useUserStore = defineStore('user', {
  state: () => ({
    uid: null,
    email: null,
    name: null,
    isAuthenticated: false,
    isAdmin: false,
    profileImageUrl: null,
  }),

  getters: {
    isCurrentUserAdmin: (state) => state.isAuthenticated && state.isAdmin,
  },

  actions: {
    // 이 액션은 사용자가 로그인/회원가입하거나 인증 상태가 변경될 때 호출됩니다.
    // Firebase Auth User 객체를 인자로 받습니다.
    async setUser(user) {
      console.log("[userStore] setUser 시작 UID:", user ? user.uid : "null");

      if (user) {
        // 사용자가 로그인됨
        this.uid = user.uid;

        // Firebase Auth 사용자 객체에서 이메일 가져오기 시도
        this.email = user.email;
        console.log("[userStore] DEBUG - Auth userData (setUser 시작):", { uid: user.uid, email: user.email, name: user.displayName, profileImageUrl: user.photoURL });

        this.isAuthenticated = true;

        // Firestore에서 추가 사용자 데이터 가져오기
        // doc 함수와 db 인스턴스 사용
        const userDocRef = doc(db, 'users', user.uid);
        try {
          console.log("[userStore] Firestore에서 사용자 문서 조회 시도:", userDocRef.path);
          // getDoc 함수 사용
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const firestoreUserData = userDocSnap.data();
             console.log("[userStore] Firestore 사용자 문서 가져옴:", firestoreUserData);

            // 스토어 상태 업데이트 (Firestore 데이터와 fallback 사용)
            // Auth 이메일이 없거나 falsy 할 경우 Firestore 이메일 사용
            if (!this.email && firestoreUserData.email) {
                 this.email = firestoreUserData.email;
                 console.log("[userStore] 이메일 결정: Firestore email 사용", this.email);
            } else if (this.email) {
                 console.log("[userStore] 이메일 결정: Auth user.email 사용", this.email);
            } else {
                 console.warn("[userStore] 이메일 정보 없음 (Auth 및 Firestore 모두)");
            }

            this.name = firestoreUserData.username || user.displayName || this.email || user.uid || '사용자';
            console.log("[userStore] 이름 결정:", this.name);

            this.isAdmin = firestoreUserData.isAdmin || false;
             console.log(`[userStore] 사용자 ${user.uid} 관리자 여부:`, this.isAdmin);


            this.profileImageUrl = firestoreUserData.photoURL || user.photoURL || null;
             console.log("[userStore] 이미지 결정:", this.profileImageUrl ? "Firestore/Auth photoURL 사용" : "이미지 없음");
             if(this.profileImageUrl) console.log("  URL:", this.profileImageUrl);


          } else {
            console.warn(`[userStore] 사용자 문서 (ID: ${user.uid})가 Firestore에 없습니다.`);
             this.name = user.displayName || this.email || user.uid || '새 사용자'; // 문서 없으면 fallback 이름
             this.isAdmin = false; // 문서 없으면 관리자 아님
             this.profileImageUrl = user.photoURL || null; // 문서 없으면 Auth photoURL 사용
             // 이메일은 이미 설정 시도됨

             console.log("[userStore] 이름 결정 (문서 없음):", this.name);
             console.log(`[userStore] 사용자 ${user.uid} 관리자 여부 (문서 없음):`, this.isAdmin);
             console.log("[userStore] 이미지 결정 (문서 없음):", this.profileImageUrl ? "Auth photoURL 사용" : "이미지 없음");

          }
        } catch (firestoreError) {
          console.error("[userStore] Firestore 사용자 문서 가져오기/생성 오류:", firestoreError);
           // Firestore 조회 실패 시 fallback
           this.name = user.displayName || user.email || user.uid || '오류 사용자';
           this.isAdmin = false;
           this.profileImageUrl = user.photoURL || null;
           this.email = this.email || user.email || null; // 이메일도 fallback
           console.log("[userStore] 이름 결정 (Firestore 오류):", this.name);
           console.log(`[userStore] 사용자 ${user.uid} 관리자 여부 (Firestore 오류):`, this.isAdmin);
           console.log("[userStore] 이미지 결정 (Firestore 오류):", this.profileImageUrl ? "Auth photoURL 사용" : "이미지 없음");
        }

      } else {
        // 사용자가 로그아웃됨
        this.clearUser(); // clearUser 액션 사용하여 상태 초기화
         console.log("[userStore] setUser 완료: 사용자 로그아웃 상태.");
         return; // user가 null이면 함수 종료
      }

        // 최종 스토어 상태 로깅 (검증용)
        console.log("[userStore] setUser 완료. 현재 스토어 상태:", {
            uid: this.uid,
            name: this.name,
            isAuthenticated: this.isAuthenticated,
            isAdmin: this.isAdmin,
            profileImageUrl: this.profileImageUrl,
            email: this.email // 최종 이메일 값 포함
        });
    },

    // 로그아웃 또는 초기 비인증 상태 시 사용자 상태 초기화 액션
    clearUser() {
      this.uid = null;
      this.email = null;
      this.name = null;
      this.isAuthenticated = false;
      this.isAdmin = false;
      this.profileImageUrl = null;
       console.log("[userStore] clearUser 완료. 스토어 상태 초기화.");
    },

    // authReadyPromise 노출
    get authReadyPromise() {
      return authReadyPromise;
    }
  },
});