<template>
  <nav class="gnb-nav">
    <ul>
      <li>
        <router-link to="/admin/map">지도 관리</router-link>
      </li>
      <li>
        <router-link to="/admin/users">회원 관리</router-link>
      </li>
      <li>
        <router-link to="/admin/boards">게시판 관리</router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
// 필요한 경우 여기에 로직 추가
</script>

<style scoped>
.gnb-nav h2 {
    margin-top: 0;
    color: #333;
    font-size: 1.2em;
    margin-bottom: 20px;
}

.gnb-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.gnb-nav li {
  margin-bottom: 10px;
}

.gnb-nav a {
  text-decoration: none;
  color: #99a5e6;
  font-size: 1.1em;
  padding: 5px 0 5px 20px;
  display: block; /* 링크 전체 영역 클릭 가능하게 */
  transition: color 0.2s ease;
  text-align: left;
}

.gnb-nav a:hover,
.gnb-nav a.router-link-active {
  color: #ffffff; /* 활성 링크 색상 */
  font-weight: bold;
  text-decoration: underline;
}
</style>