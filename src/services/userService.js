// src/services/userService.js

// 필요한 Firebase SDK 함수들을 import 합니다.
import { createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'; // Auth 관련 함수
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // Storage 관련 함수
// doc, setDoc, serverTimestamp는 Firestore 저장 로직 주석 처리로 필요 없음


// Firebase 서비스 인스턴스 (auth, storage)는 @/firebase에서 import
// db는 Firestore 저장 로직 주석 처리로 필요 없음
import { auth, storage } from '@/firebase';

// Pinia 스토어 import
import { useUserStore } from '@/store/user';


// --- 인증 상태 준비를 기다리기 위한 Promise 및 관련 변수 ---
let _resolveAuthReady;
// 이 Promise는 onAuthStateChanged 리스너가 첫 번째 인증 상태를 파악했을 때 resolve됩니다.
const authReadyPromise = new Promise(resolve => {
  _resolveAuthReady = resolve;
});

// onAuthStateChanged 리스너가 이미 설정되었는지 추적하는 플래그
let isAuthListenerSet = false; // 플래그를 함수 외부 모듈 스코프에 정의


// 아바타 이미지를 Firebase Storage에 업로드하는 함수
const uploadAvatar = async (userId, file) => {
    console.log("[userService] uploadAvatar 시작. userId:", userId, "파일:", file);
    if (!file) {
        console.log("[userService] uploadAvatar: 파일이 없음.");
        return null;
    }

    const storagePath = `avatars/${userId}/${Date.now()}_${file.name}`;
    const imageRef = storageRef(storage, storagePath);

    try {
        console.log(`[userService] 파일 Storage 업로드 시도: ${storagePath}`);
        const uploadResult = await uploadBytes(imageRef, file);
        console.log("[userService] 파일 Storage 업로드 성공.");
        const downloadURL = await getDownloadURL(uploadResult.ref);
        console.log("[userService] 아바타 업로드 완료, URL:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("[userService] 아바타 업로드 에러:", error);
        throw error;
    }
};


// Firebase Authentication을 이용한 회원가입 함수
const registerUserWithFirebase = async (email, password, username, avatarFile) => {
    console.log("[userService] registerUserWithFirebase 시작");
    console.log("인자 - 이메일:", email, "닉네임:", username, "아바타 파일:", avatarFile);

    try {
        console.log("[userService] createUserWithEmailAndPassword 시도");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("[userService] 사용자 계정 생성 성공. UID:", user.uid);

        let photoURL = null;

        if (avatarFile) {
            console.log("[userService] 아바타 파일 업로드 로직 실행.");
            try {
               photoURL = await uploadAvatar(user.uid, avatarFile);
            } catch (uploadError) {
                console.error("[userService] registerUserWithFirebase 내에서 아바타 업로드 오류:", uploadError);
                photoURL = null;
            }
        } else {
             console.log("[userService] 아바타 파일 없음. 업로드 건너뜀.");
        }

        console.log("[userService] Firebase Auth 사용자 프로필 업데이트 시도 (displayName, photoURL)");
        const profileUpdates = {
            displayName: username
        };
        if (photoURL) {
             profileUpdates.photoURL = photoURL;
        }

        await updateProfile(user, profileUpdates);
        console.log("[userService] Firebase Auth 사용자 프로필 업데이트 성공. displayName:", user.displayName, "photoURL:", user.photoURL);

        // 4. (선택 사항) Firestore에 추가 사용자 정보 저장 (주석 처리)
        /*
        import { doc, setDoc, serverTimestamp, db } from 'firebase/firestore'; // 여기에 import
        console.log(`[userService] Firestore에 사용자 문서 저장 시도: users/${user.uid}`);
        const userDocRef = doc(db, 'users', user.uid); // db 인스턴스 사용
        const userData = {
            uid: user.uid, email: user.email, username: username, photoURL: photoURL, createdAt: serverTimestamp(),
        };
        try { await setDoc(userDocRef, userData); console.log(`[userService] Firestore에 사용자 문서 저장 성공: users/${user.uid}`); }
        catch (firestoreError) { console.error("[userService] Firestore 사용자 문서 저장 오류:", firestoreError); }
        */

        console.log("[userService] registerUserWithFirebase 전체 처리 완료. 사용자 객체 반환.");
        return user;

    } catch (error) {
        console.error("[userService] 회원가입 또는 프로필 처리 전체 오류 발생 (catch 블록):", error);
        let userFacingErrorMessage = "회원가입 중 오류가 발생했습니다.";
         switch (error.code) {
             case 'auth/email-already-in-use': userFacingErrorMessage = "이미 사용 중인 이메일 주소입니다."; break;
             case 'auth/weak-password': userFacingErrorMessage = "비밀번호가 너무 짧거나 취약합니다. 6자 이상이어야 합니다."; break;
             case 'auth/invalid-email': userFacingErrorMessage = "유효하지 않은 이메일 주소 형식입니다."; break;
             case 'auth/operation-not-allowed': userFacingErrorMessage = "현재 이메일/비밀번호 회원가입이 비활성화되어 있습니다. Firebase 콘솔에서 활성화해주세요."; break;
             default: console.error("알 수 없는 회원가입 오류 코드:", error.code, "오류 메시지:", error.message); userFacingErrorMessage = `회원가입 중 알 수 없는 오류가 발생했습니다: ${error.message}`;
         }
        alert(userFacingErrorMessage);
        throw error;
    }
};


// Firebase Authentication을 이용한 로그인 함수
const loginUser = async (email, password) => {
    console.log("[userService] loginUser 시작. 이메일:", email);
    const userStore = useUserStore();

    try {
        console.log("[userService] signInWithEmailAndPassword 시도");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log("[userService] DEBUG - Firebase user object:", user);
        console.log("[userService] DEBUG - user.displayName:", user.displayName);
        console.log("[userService] DEBUG - user.photoURL:", user.photoURL);

        console.log("[userService] 로그인 성공. UID:", user.uid, "DisplayName:", user.displayName, "PhotoURL:", user.photoURL);

        const userDataForStore = {
            uid: user.uid,
            name: user.displayName || user.email || '사용자',
            profileImageUrl: user.photoURL,
        };

        console.log("[userService] DEBUG - userDataForStore 객체:", userDataForStore);

        userStore.setUser(userDataForStore);

        console.log("[userService] loginUser 완료. 사용자 객체 반환.");
        return user;

    } catch (error) {
        console.error("[userService] 로그인 오류:", error);
        let userFacingErrorMessage = "로그인 중 오류가 발생했습니다.";
        switch (error.code) {
            case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': userFacingErrorMessage = "이메일 또는 비밀번호가 올바르지 않습니다."; break;
            case 'auth/invalid-email': userFacingErrorMessage = "유효하지 않은 이메일 주소 형식입니다."; break;
            case 'auth/user-disabled': userFacingErrorMessage = "이 사용자 계정은 비활성화되었습니다."; break;
            default: console.error("알 수 없는 로그인 오류 코드:", error.code, "오류 메시지:", error.message); userFacingErrorMessage = `로그인 중 알 수 없는 오류가 발생했습니다: ${error.message}`;
        }
        alert(userFacingErrorMessage);
        throw error;
    }
};


// Firebase Authentication에서 로그아웃 함수
const logoutUser = async () => {
     console.log("[userService] logoutUser 시작.");
     const userStore = useUserStore();
    try {
        await signOut(auth);
        console.log("[userService] Firebase Auth 로그아웃 성공.");
        userStore.clearUser();
        console.log("[userService] logoutUser 완료.");
    } catch (error) {
        console.error("[userService] 로그아웃 오류:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
        throw error;
    }
};

// Firebase 인증 상태 변경 관찰 리스너 설정
// 이 함수는 main.js에서 딱 한 번 호출되어 onAuthStateChanged 리스너를 등록합니다.
const subscribeToAuthStateChanges = () => {
    console.log("[userService] 인증 상태 변경 리스너 설정.");
    const userStore = useUserStore();

    // 리스너가 이미 설정되었다면 다시 설정하지 않음
    if (isAuthListenerSet) { // <--- 함수 외부 플래그 사용
        console.log("[userService] 인증 상태 리스너 이미 설정됨. 건너옴.");
        return;
    }
    isAuthListenerSet = true; // <--- 플래그를 true로 설정

    // onAuthStateChanged 리스너 등록
    onAuthStateChanged(auth, (user) => {
        console.log("[userService] 인증 상태 변경 감지됨.", user ? user.uid : "로그아웃");
        if (user) {
            // 사용자가 로그인 상태인 경우 (페이지 새로고침, 로그인 등)
            userStore.setUser({
                 uid: user.uid,
                 name: user.displayName || user.email || '사용자',
                 profileImageUrl: user.photoURL,
            });
            console.log("[userService] 인증 리스너: 사용자 로그인 상태 확인 및 스토어 설정.");
        } else {
            // 사용자가 로그아웃 상태인 경우
            userStore.clearUser();
            console.log("[userService] 인증 리스너: 사용자 로그아웃 상태 확인 및 스토어 초기화.");
        }

        // Firebase 인증 상태가 파악되었음을 알립니다 (Promise resolve)
        // onAuthStateChanged는 리스너 등록 즉시 현재 상태로 한 번 실행됩니다.
        console.log("[userService] authReadyPromise resolved.");
        _resolveAuthReady(); // <--- 여기서 Promise를 resolve합니다.

         // 참고: onAuthStateChanged는 이후 인증 상태 변화에 대해서도 계속 실행됩니다.
         // 초기 상태 파악 후 리스너를 해제하고 싶다면 여기서 unsubscribe()를 호출해야 하지만,
         // 로그인/로그아웃 상태 변화를 계속 감지하려면 해제하면 안 됩니다.
    });

     console.log("[userService] onAuthStateChanged 리스너 등록 완료."); // <--- 리스너 등록 완료 로그 추가
};


// 함수들을 내보냅니다.
export {
    registerUserWithFirebase, // 회원가입
    loginUser, // 로그인
    logoutUser, // 로그아웃
    subscribeToAuthStateChanges, // 인증 상태 리스너 설정 (main.js에서 호출)
    authReadyPromise // <-- 인증 상태 준비 Promise 내보내기
};

// subscribeToAuthStateChanges는 main.js에서 호출됩니다.