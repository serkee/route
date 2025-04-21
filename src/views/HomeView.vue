<template>
  <div class="container">
    <AppHeader />
    <!-- <p>로그인 후 보여지는 첫 화면입니다.</p>
    <div class="content">
      <p>환영합니다, {{ userStore.name }}님!</p>
    </div> -->
    <div class="content">
      <div class="titWrap">
        <h2>자유게시판</h2>
        <button>전체보기+</button>
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

      <div class="titWrap">
        <h2>루트게시판</h2>
        <button>전체보기+</button>
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

      <div class="titWrap">
        <h2>중고마켓</h2>
        <button>전체보기+</button>
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

      <button class="btn-feed">+ 피드쓰기</button>
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
.content{width: 100%;}
  .titWrap{display: flex; justify-content: space-between; align-items: center; height: 40px; margin-bottom: 5px;}
  .titWrap > h2{font-size: 20px; font-weight: bold; }
  .titWrap > button{border:1px solid #e1e1e1; background: transparent; height: 25px; line-height: 23px; border-radius: 13px; color: #999; padding: 0 10px;}
  .list + .titWrap{margin-top: 40px;}
  .list{overflow-x: auto; overflow-y: hidden;}
  .list > ul{text-align: left; word-break: keep-all; white-space: nowrap;}
  .list > ul > li{display: inline-block;}
  .list > ul > li + li{margin-left: 10px;}
  .list > ul > li > a{}
  .list > ul > li > a > img{width: 200px;}
</style>