<template>
  <div class="container">
    <AppHeader />
    <!-- <p>로그인 후 보여지는 첫 화면입니다.</p>
    <div class="content">
      <p>환영합니다, {{ userStore.name }}님!</p>
    </div> -->
    <div class="content">
      <div class="tab">
        <ul>
          <li class="active"><button>전체</button></li>
          <li><button>자유게시판</button></li>
          <li><button>루트</button></li>
          <li><button>중고마켓</button></li>
        </ul>
      </div>
      <div class="list">
        <ul>
          <li>
            <a href="javascript:void(0)">
              <img src="@/assets/images/contents/@thumb.png" alt="">
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <img src="@/assets/images/contents/@thumb.png" alt="">
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <img src="@/assets/images/contents/@thumb.png" alt="">
            </a>
          </li>
          <li>
            <a href="javascript:void(0)">
              <img src="@/assets/images/contents/@thumb.png" alt="">
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
// import { useRouter } from 'vue-router'; // 사용하지 않으므로 제거
import { useUserStore } from "@/store/user"; // 스토어 경로에 맞춰 수정
import { onMounted } from "vue";
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import (경로 확인)

// const router = useRouter(); // 사용하지 않으므로 제거
const userStore = useUserStore();

// 컴포넌트 마운트 시 실행될 로직 (필요하다면)
onMounted(() => {
  console.log(
    "HomeView mounted. User:",
    userStore.name,
    userStore.email,
    userStore.profileImageUrl
  );
  // 예: 로그인 후 특정 데이터를 로딩해야 하는 경우
  // loadHomeData();
});

// 로그아웃 함수는 이제 AppHeader.vue에 있습니다.

// 예시: 홈 화면 데이터 로딩 함수 (필요하다면 구현)
// const loadHomeData = async () => { ... };
</script>
  
<style scoped>
.content{width: 100%; position: relative; padding-top: 70px;}
  .tab{position: fixed; left:0; right:0; top: 50px; z-index: 2;}
  .tab > ul{display: flex; background: #fff; padding-top: 30px;}
  .tab > ul > li{flex: 1;}
  .tab > ul > li > button{height: 40px; font-size: 18px; border:0; border-bottom: 1px solid rgb(223, 223, 223); background: transparent; width: 100%; padding: 0; cursor: pointer;}
  .tab > ul > li.active > button{border-bottom: 2px solid rgb(19, 177, 56); font-weight: bold; color: rgb(19, 177, 56);}
  .list{}
  .list > ul{display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;}
  .list > ul > li{}
  .list > ul > li > a{}
  .list > ul > li > a > img{width: 100%;}
</style>