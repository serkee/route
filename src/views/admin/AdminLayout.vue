<template>
  <div class="admin-layout">
    <aside class="admin-gnb">
      <AdminGnb />
    </aside>

    <main class="admin-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
import AdminGnb from "@/components/admin/AdminGnb.vue";
// 필요한 경우 여기에 로직 추가 (예: 관리자 권한 체크)
</script>

<style scoped>
.admin-layout {
  display: flex; /* Flexbox를 사용하여 좌우 레이아웃 구성 */
  height: 100vh; /* 화면 전체 높이 사용 */
  overflow: hidden; /* 자식 요소가 넘치는 경우 스크롤바 숨김 */
}

.admin-gnb {
  width: 180px;
  background-color: #364286;
  padding: 20px 0 0 0;
  box-sizing: border-box;
  flex-shrink: 0; /* 내용 영역이 줄어들 때 GNB 너비 유지 */
  overflow-y: auto; /* GNB 내용이 많아지면 스크롤 */
}

.admin-content {
  flex-grow: 1; /* 남은 공간을 모두 사용 */
  padding: 30px;
  box-sizing: border-box;
  overflow-y: auto; /* 내용이 많아지면 스크롤 */
  background-color: #fff; /* 내용 영역 배경색 */
}

/* PC 버전 외의 화면에서는 레이아웃 조절 필요 */
/* @media (max-width: 768px) { ... } */
</style>