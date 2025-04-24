<template>
  <div id="app">
    <router-view />

    <nav v-if="userStore.isAuthenticated">
      <router-link to="/home">홈</router-link> |
      <router-link to="/map">지도</router-link> |
      <router-link to="/user">사용자</router-link> |

      <router-link to="/board" custom v-slot="{ href, navigate, isExactActive }">
        <a
          :href="href"
          @click="navigate"
          :class="{
            'router-link-exact-active': isExactActive && route.path === '/board', /* 정확히 /board 일 때 활성화 */
            'router-link-active': isBoardActive /* /board 또는 하위 경로일 때 활성화 (우선 적용) */
          }"
        >
          게시판
        </a>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user'; // 스토어 경로에 맞춰 수정
import { useRoute } from 'vue-router';

// userService에서 subscribeToAuthStateChanges 함수 import
import { subscribeToAuthStateChanges } from '@/services/userService'; // <--- 이 함수를 import 합니다.


const userStore = useUserStore();
const route = useRoute();

// '게시판' 항목이 활성화되어야 하는지 계산하는 Computed 속성
// 라우트 경로가 '/board'로 시작하는지 확인
const isBoardActive = computed(() => {
  return route.path.startsWith('/board');
});


// 컴포넌트 마운트 시 (앱 로드 시) 인증 상태 확인 리스너 설정
onMounted(() => {
  console.log("[App.vue] onMounted: subscribeToAuthStateChanges 호출");
  // userService에 정의된 인증 상태 변경 리스너 설정 함수 호출
  subscribeToAuthStateChanges(); // <--- userStore.checkAuthOnLoad() 대신 이 함수를 호출합니다.
});

// TODO: 앱 전반적으로 필요한 로직 추가 (예: 인증 상태에 따른 라우트 가드 등)

</script>

<style scoped>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  display: flex;
  flex-direction: column;
}


nav {
  border-top: 1px solid #e1e1e1;
  left: 0;
  right: 0;
  height: 70px;
  display: flex;
  /* 링크들을 균등하게 배치 */
  justify-content: space-around;
  align-items: center;
  background-color: white;
  /* 하단 고정을 원하면 주석 해제 */
  /* position: fixed; */
  /* bottom: 0; */
  /* width: 100%; */
}

/* nav 바로 아래의 router-link (기본)와 a 태그 (custom)에 flex 속성 적용 */
nav > a,
nav > .router-link-active, /* 기본 router-link가 렌더링하는 a 태그 */
nav > .router-link-exact-active /* 기본 router-link가 렌더링하는 a 태그 */
{
  flex: 1; /* 각 항목이 같은 너비 차지 */
  text-align: center; /* 텍스트 중앙 정렬 */
}

nav a {
  color: #999;
  text-decoration: none;
  font-size: 13px;
  display: flex; /* 아이콘과 텍스트를 세로로 배치하기 위해 flex 사용 */
  flex-direction: column; /* 세로 방향 정렬 */
  align-items: center; /* 가로 중앙 정렬 */
  justify-content: center; /* 세로 중앙 정렬 */
  padding: 0; /* 링크 자체의 패딩 제거 */
  height: 100%; /* 부모 li/nav 높이 채우기 */
}

nav a:before{
  content: '';
  display: block;
  width: 20px;
  height: 18px;
  background-color:#999; /* 기본 아이콘 색상 */
  -webkit-mask-image: url(~@/assets/images/common/ico_menu_home.svg);
  -webkit-mask-size: cover;
  mask-image: url(~@/assets/images/common/ico_menu_home.svg); /* 표준 mask-image 추가 */
  mask-size: cover;
  margin: 0 auto 4px; /* 중앙 정렬 및 하단 여백 */
}
/* nth-child 선택자는 custom prop 사용으로 인해 번호가 달라질 수 있습니다. */
/* 각 router-link에 직접 to 경로를 기반으로 선택하는 것이 더 안정적일 수 있습니다. */

/* 기본 router-link-exact-active 스타일 (정확히 일치할 때) */
/* 이 스타일은 다른 링크들에 계속 적용됩니다. */
nav a.router-link-exact-active {
  color: #005fec; /* 활성화 글자 색상 */
  font-weight: bold; /* 활성화 글자 굵기 */
}
nav a.router-link-exact-active:before{
  background-color:#005fec; /* 활성화 아이콘 색상 */
  -webkit-mask-image: url(~@/assets/images/common/ico_menu_home.svg); /* 홈 아이콘 기본값 */
  mask-image: url(~@/assets/images/common/ico_menu_home.svg);
}

/* router-link-active 스타일 (경로 포함 시) */
/* '게시판' 링크의 경우 isBoardActive가 true일 때 이 클래스를 강제로 적용합니다. */
nav a.router-link-active {
   color: #005fec;
   font-weight: bold;
}
nav a.router-link-active:before{
  background-color:#005fec;
   /* 각 메뉴별 아이콘 이미지를 여기서 다시 설정해야 할 수 있습니다. */
   /* 아니면 기본 아이콘 스타일은 nav a:before에 두고, 활성화 시 배경색만 바꾸는 방식 */
}

/* 각 메뉴별 아이콘 스타일 재정의 (custom prop 사용 시 nth-child가 불안정해질 수 있으므로) */
/* 예를 들어, to 속성 값으로 선택하는 방식 */
nav a[href="/map"]:before {
    -webkit-mask-image: url(~@/assets/images/common/ico_menu_map.svg);
    mask-image: url(~@/assets/images/common/ico_menu_map.svg);
}
nav a[href="/user"]:before {
    -webkit-mask-image: url(~@/assets/images/common/ico_menu_user.svg);
    mask-image: url(~@/assets/images/common/ico_menu_user.svg);
}
nav a[href="/board"]:before {
    -webkit-mask-image: url(~@/assets/images/common/ico_menu_board.svg);
    mask-image: url(~@/assets/images/common/ico_menu_board.svg);
}

/* 활성화된 아이콘 색상 변경 (배경색만 변경) */
nav a.router-link-active:before,
nav a.router-link-exact-active:before {
    background-color:#005fec;
}


</style>