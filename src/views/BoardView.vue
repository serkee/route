<template>
  <div class="container">
    <AppHeader />
    <div class="board-list">
      <p>아직 게시글이 없습니다.</p>
    </div>
    <button @click="goToWrite">글쓰기</button>
  </div>
</template>
  
  <script setup>
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import (경로 확인)

const router = useRouter();

    const goToWrite = () => {
      // 글쓰기 페이지로 이동하는 로직 (아직 경로가 정의되지 않았을 수 있습니다.)
      router.push("/board/write");
    };
</script>
  
  <style scoped>

.board-list {
  width: 80%;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  text-align: left;
}

.board-list ul {
  list-style: none;
  padding: 0;
}

.board-list li {
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.board-list li:last-child {
  border-bottom: none;
}

.board-list a {
  text-decoration: none;
  color: #333;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  background-color: #f8f8f8;
}

button:hover {
  background-color: #eee;
}
</style>