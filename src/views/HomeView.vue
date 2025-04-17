<template>
    <div class="home-view">
      <h1>홈</h1>
      <p>로그인 후 보여지는 첫 화면입니다.</p>
      <div class="content">
        <p>환영합니다!</p>
        </div>
    </div>
  </template>
  
  <script>
  // import { ref, onMounted } from 'vue';
  
  export default {
    name: 'HomeView',
    setup() {
      // 예시: 로그인한 사용자 정보 (실제 앱에서는 스토어 또는 API에서 가져올 수 있습니다.)
      // const user = ref({ name: '홍길동' });
      // 예시: API에서 데이터를 불러오는 로직
      // const data = ref(null);
      // const loadData = () => {
      //   fetch('/api/home')
      //     .then(response => response.json())
      //     .then(result => {
      //       data.value = result;
      //     });
      // };
      // onMounted(() => {
      //   // 컴포넌트가 마운트될 때 데이터 로딩 (선택 사항)
      //   // loadData();
      // });
  
      return {
        // user,
        // data,
        // loadData,
      };
    },
  };
  </script>
  
  <style scoped>
  .home-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  
  h1 {
    margin-bottom: 10px;
  }
  
  p {
    color: #777;
    margin-bottom: 20px;
  }
  
  .content {
    width: 80%;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    text-align: center;
  }
  </style>