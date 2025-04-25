// src/services/userService.js

// defineStore 임포트 제거됨 (이 파일은 서비스 파일이지 스토어가 아닙니다)

// 'auth'는 signInWithEmailAndPassword 등에, 'db'는 firestore 함수에 사용됩니다.
import { auth, db } from '@/firebase'; // ✅ auth와 db가 여기서 임포트되는지 확인하세요.

// 필요한 Firebase Auth 함수를 import 합니다.
import {
  // getAuth 임포트 제거됨
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail as sendPasswordResetEmailSDK, // sendPasswordResetEmail SDK 함수에 별칭 사용
  updateProfile,
  // signOut 임포트 제거됨
} from "firebase/auth";

// 필요한 Firestore 함수를 import 합니다.
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore"; // doc, setDoc, getDoc, updateDoc 사용

// 필요한 Firebase Storage 함수를 import 합니다. (프로필 이미지 업로드 등에 사용)
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // getStorage, ref, uploadBytes, getDownloadURL, deleteObject 사용


// Firebase Auth 인스턴스는 @/firebase에서 임포트된 'auth'를 사용합니다.
// Firestore 인스턴스는 @/firebase에서 임포트된 'db'를 사용합니다.


// --- FIX: 이 authReadyPromise 헬퍼 함수와 그 안에 있던 onAuthStateChanged 리스너를 제거합니다. ---
// 이 로직은 userStore.js 파일에 포함되어야 합니다.
/*
// Helper to create a promise that resolves when auth state is ready (userStore에서 사용)
const authReadyPromise = new Promise((resolve) => {
  console.log("[userService] 인증 상태 변경 리스너 설정.");
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("[userService] 인증 리스너: 사용자 로그인 상태 확인 및 스토어 설정.");
    resolve(user);
    unsubscribe();
    console.log("[userService] authReadyPromise resolved.");
  });
   console.log("[userService] onAuthStateChanged 리스너 등록 완료.");
});
*/
// -----------------------------------------------------------------------------------------------


// 회원가입 함수 정의
const signupUser = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth, // 임포트된 auth 인스턴스 사용
      email,
      password
    );
    const user = userCredential.user;

    console.log("Firebase Auth 사용자 생성 성공:", user);

    try {
        await updateProfile(user, {
             displayName: username,
        });
        console.log("Firebase Auth 사용자 프로필 displayName 업데이트 성공:", username);
    } catch (profileUpdateError) {
         console.error("Firebase Auth 사용자 프로필 업데이트 오류:", profileUpdateError);
    }

    try {
      const userDocRef = doc(db, "users", user.uid); // 임포트된 db 인스턴스 사용
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        username: username,
        createdAt: new Date(),
        isAdmin: false,
        photoURL: null,
      });
      console.log("Firestore에 사용자 문서 저장 성공:", userDocRef.path);
    } catch (firestoreError) {
      console.error("Firestore 사용자 문서 저장 오류:", firestoreError);
      alert("회원가입은 성공했으나 사용자 정보 저장에 실패했습니다. 마이페이지에서 정보를 업데이트해주세요.");
    }

    return user;
  } catch (error) {
    console.error("회원가입 오류:", error.code, error.message);
    let errorMessage = "회원가입 중 오류가 발생했습니다.";
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "이미 사용 중인 이메일 주소입니다.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "비밀번호가 너무 짧습니다 (최소 6자 이상).";
    } else if (error.code === "auth/invalid-email") {
        errorMessage = "유효하지 않은 이메일 주소 형식입니다.";
    }

    alert(errorMessage);
    throw error;
  }
};


// 로그인 함수 정의
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth, // 임포트된 auth 인스턴스 사용
      email,
      password
    );
    const user = userCredential.user;

    console.log("Firebase Auth 로그인 성공:", user);
    return user;
  } catch (error) {
    console.error("로그인 오류:", error.code, error.message);
    let errorMessage = "로그인 중 오류가 발생했습니다.";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      errorMessage = "잘못된 이메일 또는 비밀번호입니다.";
    } else if (error.code === "auth/invalid-email") {
       errorMessage = "유효하지 않은 이메일 주소 형식입니다.";
    }

    alert(errorMessage);
    throw error;
  }
};

// 비밀번호 재설정 이메일 전송 함수 정의 (Wrapper)
const sendPasswordResetEmail = async (email) => {
    try {
        console.log(`비밀번호 재설정 이메일 전송 시도: ${email}`);
        await sendPasswordResetEmailSDK(auth, email); // 임포트된 sendPasswordResetEmailSDK와 auth 인스턴스 사용
        console.log("비밀번호 재설정 이메일 전송 함수 호출 성공.");

    } catch (error) {
        console.error("비밀번호 재설정 이메일 전송 서비스 오류:", error.code, error.message);
        let errorMessage = "비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = '해당 이메일로 등록된 사용자가 없습니다.';
        } else if (error.code === 'auth/invalid-email') {
             errorMessage = '유효하지 않은 이메일 주소 형식입니다.';
        }

        alert(errorMessage);
        throw error;
    }
};


// 사용자 문서 가져오기 함수 정의 (UserProfileView 등에서 사용)
const getUserDocument = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid); // 임포트된 db 인스턴스 사용
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.warn(`사용자 문서 (ID: ${uid})를 찾을 수 없습니다.`);
      return null;
    }
  } catch (error) {
    console.error("사용자 문서 가져오기 오류:", error);
    throw error;
  }
};

// 사용자 문서 업데이트 함수 정의 (UserProfileView 등에서 사용)
const updateUserDocument = async (uid, data) => {
    try {
        const userDocRef = doc(db, "users", uid); // 임포트된 db 인스턴스 사용
        await updateDoc(userDocRef, data);
        console.log(`사용자 문서 (ID: ${uid}) 업데이트 성공.`);
    } catch (error) {
         console.error(`사용자 문서 (ID: ${uid}) 업데이트 오류:`, error);
         throw error;
    }
};

// 프로필 이미지 업로드 함수 정의 (Storage 서비스로 분리하는 것이 더 좋을 수 있습니다)
const uploadProfileImage = async (uid, file) => {
    try {
        const storage = getStorage(); // 임포트된 getStorage 사용
        const storagePath = `avatars/${uid}/${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, storagePath); // 임포트된 storageRef 사용

        console.log("프로필 이미지 Storage 업로드 시작:", storagePath);
        const uploadResult = await uploadBytes(fileRef, file); // 임포트된 uploadBytes 사용

        const downloadURL = await getDownloadURL(uploadResult.ref); // 임포트된 getDownloadURL 사용
        console.log("프로필 이미지 업로드 성공. URL:", downloadURL);
        return downloadURL;

    } catch (error) {
         console.error("프로필 이미지 업로드 서비스 오류:", error);
         throw error;
    }
};

// Storage 이미지 삭제 함수 정의 (Storage 서비스로 분리하는 것이 더 좋을 수 있습니다)
const deleteStorageFile = async (fileUrl) => {
     if (!fileUrl || !fileUrl.startsWith('https://firebasestorage.googleapis.com/')) {
        console.warn("Storage URL이 아니거나 없습니다. 삭제를 건너뜹니다.");
        return;
     }
     try {
        const storage = getStorage(); // 임포트된 getStorage 사용
        const storagePath = getPathStorageFromUrl(fileUrl); // <-- 이 함수 구현 필요 (auth 인스턴스 필요)
        const fileRef = storageRef(storage, storagePath); // 임포트된 storageRef 사용

        console.log("Storage 파일 삭제 시도:", storagePath);
        await deleteObject(fileRef); // 임포트된 deleteObject 사용
        console.log("Storage 파일 삭제 성공:", storagePath);

     } catch (error) {
        console.error("Storage 파일 삭제 서비스 오류:", error);
        // throw error; // 오류가 치명적이지 않으면 throw 하지 않을 수도 있습니다.
     }
};

// 예시: Storage URL에서 경로를 추출하는 헬퍼 함수 (Firebase SDK 문서 참고)
// 실제 구현은 Storage URL 구조에 따라 달라질 수 있습니다.
function getPathStorageFromUrl(url){
    // auth 인스턴스가 필요합니다.
    const baseUrl = "https://firebasestorage.googleapis.com/v0/b/" + auth.app.options.storageBucket + "/o/"; // 임포트된 auth 인스턴스 사용
    let imagePath = url.replace(baseUrl, "");
    const indexOfEndPath = imagePath.indexOf("?");
    if (indexOfEndPath !== -1) {
        imagePath = imagePath.substring(0, indexOfEndPath);
    }
    imagePath = imagePath.replace(/%2F/g, "/");
    return imagePath;
}


// 필요한 함수들을 export 합니다.
export {
  signupUser,
  loginUser,
  sendPasswordResetEmail,
  getUserDocument,
  updateUserDocument,
  uploadProfileImage,
  deleteStorageFile,
  // authReadyPromise // userStore에서 관리하므로 여기서 export 하지 않습니다.
};