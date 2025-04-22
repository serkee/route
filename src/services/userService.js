// src/services/userService.js
import { auth, storage, storageRef, uploadBytes, getDownloadURL } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
// Firestore에 추가 정보 저장 시 import { db, doc, setDoc } from "@/firebase"; 필요

// 아바타 이미지를 Firebase Storage에 업로드하는 함수
const uploadAvatar = async (userId, file) => {
  if (!file) return null; // 파일이 없으면 null 반환

  const storagePath = `avatars/${userId}/${file.name}`; // 저장될 경로 예시: avatars/사용자UID/파일이름
  const imageRef = storageRef(storage, storagePath);

  try {
    const uploadResult = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log("아바타 업로드 완료, URL:", downloadURL);
    return downloadURL; // 업로드된 이미지의 다운로드 URL 반환
  } catch (error) {
    console.error("아바타 업로드 에러:", error);
    throw error; // 에러를 다시 던져서 회원가입 함수에서 처리하게 함
  }
};


// Firebase Authentication을 이용한 회원가입 함수
const registerUserWithFirebase = async (email, password, username, avatarFile) => {
  try {
    // 1. Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let photoURL = null;
    // 2. 아바타 파일이 있으면 Storage에 업로드
    if (avatarFile) {
      photoURL = await uploadAvatar(user.uid, avatarFile);
    }

    // 3. Firebase Auth 사용자 프로필 업데이트 (닉네임, 아바타 URL)
    await updateProfile(user, {
      displayName: username,
      photoURL: photoURL, // 업로드된 이미지 URL 또는 null
    });

    // 4. (선택 사항) Firestore에 추가 사용자 정보 저장
    // 예시:
    // await setDoc(doc(db, "users", user.uid), {
    //   uid: user.uid,
    //   email: user.email,
    //   displayName: username,
    //   photoURL: photoURL,
    //   createdAt: new Date(), // 또는 serverTimestamp()
    // });

    console.log("Firebase 회원가입 및 프로필 업데이트 성공:", user);
    return user; // 성공적으로 생성된 사용자 객체 반환

  } catch (error) {
    console.error("회원가입 에러:", error);
    // Firebase Authentication 에러 코드에 따라 구체적인 에러 메시지 처리
    let errorMessage = "회원가입 중 오류가 발생했습니다.";
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = "이미 사용 중인 이메일 주소입니다.";
        break;
      case 'auth/weak-password':
        errorMessage = "비밀번호가 너무 짧거나 취약합니다. 6자 이상이어야 합니다.";
        break;
      case 'auth/invalid-email':
        errorMessage = "유효하지 않은 이메일 주소 형식입니다.";
        break;
      // 기타 Firebase Auth 에러 코드 처리
      default:
        errorMessage = error.message; // 다른 일반 에러 메시지 사용
    }
    alert(errorMessage); // 사용자에게 에러 메시지 표시
    throw error; // 에러를 호출한 쪽으로 다시 던져서 추가 처리 가능하게 함
  }
};

export { registerUserWithFirebase };