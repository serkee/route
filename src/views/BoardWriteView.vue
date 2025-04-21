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
          <label for="title">제목</label>
          <input
            type="text"
            id="title"
            v-model="title"
            placeholder="제목을 입력하세요"
            required
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

const title = ref("");
const content = ref("");
const router = useRouter();

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1); // 이전 페이지로 돌아가기
};

// 게시글 작성 완료 함수 (Placeholder)
const submitPost = () => {
  // 여기에 게시글 데이터를 백엔드로 전송하는 로직을 구현합니다.
  console.log("게시글 작성 시도:", {
    title: title.value,
    content: content.value,
  });

  // 작성 완료 후 목록 페이지 등으로 이동
  alert("게시글이 작성되었습니다.");
  router.push("/board"); // 예: 게시판 목록 페이지로 이동
};
</script>
  
  <style scoped>
.content{
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
</style>