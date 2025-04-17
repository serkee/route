<template>
    <div class="board-view">
      <h1>게시판</h1>
      <div class="board-list">
        <p>아직 게시글이 없습니다.</p>
        </div>
      <button @click="goToWrite">글쓰기</button>
    </div>
  </template>
  
  <script>
  import { useRouter } from 'vue-router';
  
  export default {
    name: 'BoardView',
    setup() {
      const router = useRouter();
  
      const goToWrite = () => {
        // 글쓰기 페이지로 이동하는 로직 (아직 경로가 정의되지 않았을 수 있습니다.)
        router.push('/board/write');
      };
  
      // 실제 앱에서는 API를 통해 게시글 목록을 가져와야 합니다.
      // const posts = ref([]);
      // onMounted(() => {
      //   // API 호출 예시
      //   // fetch('/api/posts')
      //   //   .then(response => response.json())
      //   //   .then(data => posts.value = data);
      // });
  
      return {
        goToWrite,
        // posts,
      };
    },
  };
  </script>
  
  <style scoped>
  .board-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
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