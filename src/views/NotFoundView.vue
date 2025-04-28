<template>
  <div class="not-found-container">
    <h1>404 - 페이지를 찾을 수 없습니다</h1>
    <p>요청하신 페이지가 존재하지 않거나 주소가 변경되었습니다.</p>

    <router-link to="/">홈으로 돌아가기</router-link>
  </div>
</template>

<script setup>
// 이 뷰 컴포넌트는 특별한 로직이 필요하지 않으므로 script setup 블록을 비워둡니다.
// 필요하다면 여기에 로직을 추가할 수 있습니다.
</script>

<style scoped>
/* 페이지 내용을 가운데 정렬하고 기본적인 스타일을 적용합니다. */
.not-found-container {
  text-align: center; /* 텍스트 가운데 정렬 */
  padding: 50px 20px; /* 상하좌우 패딩 */
  margin-top: 50px; /* 상단 마진 */
  background-color: #f8f9fa; /* 배경색 */
  border-radius: 8px; /* 모서리 둥글게 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 그림자 효과 */
  max-width: 600px; /* 최대 너비 설정 */
  margin-left: auto; /* 가운데 정렬 */
  margin-right: auto; /* 가운데 정렬 */
}

h1 {
  color: #dc3545; /* 오류를 나타내는 빨간색 계열 색상 */
  margin-bottom: 20px; /* 제목 아래 여백 */
  font-size: 2.5em; /* 글자 크기 */
}

p {
  color: #6c757d; /* 회색 계열 텍스트 색상 */
  margin-bottom: 30px; /* 문단 아래 여백 */
  font-size: 1.1em; /* 글자 크기 */
}

/* router-link 스타일링 (실제 렌더링되는 <a> 태그에 적용) */
.not-found-container a {
    color: #007bff; /* 링크 색상 */
    text-decoration: none; /* 밑줄 제거 */
    font-weight: bold; /* 글자 두껍게 */
    font-size: 1.1em; /* 글자 크기 */
    transition: color 0.3s ease; /* 색상 변화에 애니메이션 효과 */
}

.not-found-container a:hover {
    text-decoration: underline; /* 호버 시 밑줄 표시 */
    color: #0056b3; /* 호버 시 색상 변경 */
}
</style>