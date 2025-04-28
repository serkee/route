<template>
    <div class="admin-container">
  
      <aside class="admin-sidebar">
        <nav class="admin-nav">
          <ul>
            <li><router-link :to="{ name: 'adminUsers' }">회원 관리</router-link></li>
            <li><router-link :to="{ name: 'adminBoards' }">게시판 관리</router-link></li>
            <li><router-link :to="{ name: 'adminMaps' }">지도 관리</router-link></li>
          </ul>
        </nav>
        </aside>
  
      <main class="admin-content-area">
        <h1>{{ currentAdminMenuTitle }}</h1>
        <router-view></router-view>
      </main>
  
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  
  const route = useRoute();
  
  // 선택 사항: 현재 활성화된 하위 관리 메뉴에 따라 동적으로 제목을 표시
  const currentAdminMenuTitle = computed(() => {
    switch (route.name) {
      case 'adminUsers': return '회원 관리';
      case 'adminMaps': return '지도 관리';
      case 'adminBoards': return '게시판 관리';
      default: return '관리자 대시보드'; // /admin 경로 자체에 대한 기본 제목
    }
  });
  
  // 이 컴포넌트 자체에 필요한 스크립트 로직은 여기에 추가
  </script>
  
  <style scoped>
  /* ✅✅✅ 관리자 레이아웃 스타일 (Flexbox 사용) ✅✅✅ */
  .admin-container {
    display: flex; /* 자식 요소(sidebar, content-area)를 Flex Item으로 만듭니다. */
    height: 100vh; /* 뷰포트 전체 높이를 사용합니다. (필요에 따라 조정) */
    overflow: hidden; /* 컨테이너를 벗어나는 내용 숨김 (스크롤바 처리를 하위 요소에 위임) */
  }
  
  .admin-sidebar {
    width: 180px; /* 왼쪽 메뉴 영역의 너비를 고정합니다. (원하는 너비로 조정) */
    background-color: #0a2e4d; /* 사이드바 배경색 */
    padding: 20px;
    border-right: 1px solid #dee2e6; /* 내용 영역과의 구분선 */
    overflow-y: auto; /* 메뉴 내용이 길어지면 스크롤바 생성 */
    flex-shrink: 0; /* 내용 영역이 줄어들 때 사이드바 너비가 줄어들지 않도록 합니다. */
  }
  
  .admin-sidebar h2 {
    margin-top: 0;
    color: #333;
    font-size: 1.3em;
    margin-bottom: 30px;
  }
  
  .admin-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .admin-nav li {
    margin-bottom: 5px;
  }
  
  .admin-nav a {
    text-decoration: none;
    color: #fff; /* 기본 링크 색상 */
    font-size: 1.1em;
    display: block; /* 링크 영역을 넓게 */
    padding: 8px 10px 8px 20px;
    border-radius: 4px;
    transition: background-color 0.2s ease; /* 호버 효과 */
    text-align: left;
  }
  
  .admin-nav a:hover {
      background-color: #e9ecef; /* 호버 시 배경색 */
  }
  
  .admin-nav a.router-link-active {
    font-weight: bold;
    color: #7abaff; /* 활성 링크 색상 */
    background-color: #284762; /* 활성 링크 배경색 */
  }
  
  .admin-content-area {
    flex-grow: 1; /* 남은 공간을 모두 차지하도록 합니다. */
    padding: 20px 30px; /* 내용 영역 안쪽 여백 */
    overflow-y: auto; /* 내용이 길어지면 스크롤바 생성 */
    text-align: left;
  }
  
  .admin-content-area h1 {
      margin-top: 0;
      font-size: 1.8em;
      color: #333;
      margin-bottom: 25px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
  }
  
  /* 기본 HomeView 제목 스타일과 충돌하지 않도록 scoped 스타일 사용 */
  </style>