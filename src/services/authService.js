// 예를 들어, src/services/authService.js 파일에 작성
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase"; // 3단계에서 만든 firebase.js 파일 경로

const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Signed up
    const user = userCredential.user;
    console.log("회원가입 성공:", user);
    return user;
  } catch (error) {
    console.error("회원가입 에러:", error.message);
    // 에러 코드 확인 및 사용자에게 안내
    // 예: auth/email-already-in-use, auth/weak-password 등
    throw error; // 에러를 호출한 쪽으로 다시 던져서 처리하게 함
  }
};

// 나중에 로그인/로그아웃 기능도 여기에 추가할 수 있습니다.
// import { signInWithEmailAndPassword, signOut } from "firebase/auth";
// const loginUser = async (email, password) => { ... };
// const logoutUser = async () => { await signOut(auth); };

export { registerUser }; // 필요한 함수들을 내보냅니다.