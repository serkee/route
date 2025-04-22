<template>
  <div class="container">
    <div class="header">
      <div class="header__left">
        <button class="back-button" @click="goBack">←</button>
      </div>
      <h1>게시글 작성</h1>
      <div class="header__right"></div>
    </div>
    <div class="content">
      <form @submit.prevent="submitPost" class="write-form">
        <div class="form-group">
          <label for="category">카테고리</label>
          <select id="category" v-model="category" required>
            <option value="">선택</option>
            <option value="free">자유게시판</option>
            <option value="route">루트게시판</option>
            <option value="market">중고마켓</option>
          </select>
        </div>
        <div class="form-group">
          <label for="title">제목</label>
          <input
            type="text"
            id="title"
            v-model="title"
            placeholder="제목을 입력하세요"
            required
            autocomplete="off"
          />
        </div>
        <div class="form-group">
          <label for="content">내용</label>
          <textarea
            id="content"
            v-model="content"
            placeholder="내용을 입력하세요"
            required
          ></textarea>
        </div>
        <button type="submit" class="submit-button">작성 완료</button>
      </form>
    </div>
  </div>
</template>
  
  <script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

// Firebase Firestore SDK에서 필요한 함수들을 import 합니다.
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// main.js 등에서 초기화하고 export 한 Firestore 인스턴스를 import 합니다.
// @/main.js 경로는 프로젝트 설정에 따라 다를 수 있습니다.
import { db } from "@/main.js";

// Firebase Auth SDK에서 현재 사용자 정보를 가져오는 함수를 import 합니다.
import { getAuth } from "firebase/auth";

// 상태 변수
const category = ref(""); // 선택된 카테고리를 저장할 반응형 변수
const title = ref(""); // 게시글 제목을 저장할 반응형 변수
const content = ref(""); // 게시글 내용을 저장할 반응형 변수

const router = useRouter();

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1); // 이전 페이지로 돌아가기
};

// 게시글 작성 완료 및 Firestore에 저장 함수
const submitPost = async () => {
  // async 함수로 선언하여 비동기 작업(Firestore 쓰기) 수행
  // 기본적인 입력값 유효성 검사 (required 속성으로 일부 처리됨)
  if (!category.value) {
    alert("카테고리를 선택해주세요.");
    return;
  }
  if (!title.value.trim()) {
    alert("제목을 입력해주세요.");
    return;
  }
  if (!content.value.trim()) {
    alert("내용을 입력해주세요.");
    return;
  }

  const auth = getAuth(); // Firebase Auth 인스턴스 가져오기
  const user = auth.currentUser; // 현재 로그인한 사용자 정보 가져오기

  if (!user) {
    // 사용자가 로그인하지 않았다면 작성할 수 없습니다.
    alert("게시글을 작성하려면 로그인해야 합니다.");
    router.push("/login"); // 로그인 페이지로 리다이렉트
    return;
  }

  try {
    // getIdToken(true)는 토큰을 강제로 갱신하고 가져옵니다.
    const idToken = await user.getIdToken(true); // idToken 선언
    console.log("User ID Token (refreshed):", idToken); // idToken 사용 -> 경고 사라짐
    // 토큰을 성공적으로 가져왔다면 인증 상태는 유효할 가능성이 높습니다.
    // 이 시점의 console.log 결과를 확인하여 토큰 획득 성공 여부 확인
  } catch (tokenError) {
    // 토큰을 가져오는 데 실패했다면 인증에 문제가 있는 것입니다.
    console.error("인증 토큰 획득 오류:", tokenError);
    alert("인증 정보를 갱신하는 데 문제가 발생했습니다. 다시 로그인해주세요.");
    router.push("/login"); // 로그인 페이지로 리디렉션하여 다시 로그인 유도
    return; // 토큰 문제 시 Firestore 쓰기 중단
  }

  // Firestore에 저장할 게시글 데이터 객체 생성 (이 코드는 그대로 둡니다.)
  const newPostData = {
    category: category.value,
    title: title.value.trim(),
    content: content.value.trim(),
    authorId: user.uid,
    authorEmail: user.email,
    createdAt: serverTimestamp(),
    views: 0,
    commentCount: 0,
  };

  console.log(
    "Firestore 쓰기 시도 - 현재 사용자 (토큰 확인 후):",
    user ? user.uid : "로그인되지 않음"
  ); // 토큰 확인 후 다시 로그
  console.log("Firestore 쓰기 시도 - 보낼 데이터:", newPostData);

  try {
    // Firestore에 새 문서 추가 (이 코드는 그대로 둡니다.)
    const postsCollectionRef = collection(db, "posts");
    const docRef = await addDoc(postsCollectionRef, newPostData);

    console.log("게시글 작성 완료. 문서 ID:", docRef.id);

    // ... 성공 처리 ...
    alert("게시글이 성공적으로 작성되었습니다.");
    router.push("/board");
  } catch (error) {
    // Firestore 작업 중 오류 발생 시 처리
    console.error("게시글 작성 중 오류 발생:", error);
    alert(`게시글 작성 중 오류가 발생했습니다: ${error.message}`);
  }
};
</script>
  
  <style scoped>
.content {
  width: 100%;
  position: relative;
}

.write-form {
  flex-grow: 1; /* 폼이 남은 공간을 차지하도록 */
  overflow-y: auto; /* 내용이 넘치면 스크롤 */
}

.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 200px; /* 내용 입력 필드 최소 높이 */
  resize: vertical; /* 세로 방향으로만 크기 조절 가능 */
}

.submit-button {
  display: block; /* 버튼을 블록 요소로 만들어 전체 너비 차지 */
  width: 100%;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  background-color: #4caf50; /* 초록색 배경 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 30px;
}

.submit-button:hover {
  background-color: #45a049;
}

.form-group > select {
  width: 100%;
  border: 0;
  border-bottom: 1px solid #ccc;
  padding: 10px 10px 10px 0;
}
</style>