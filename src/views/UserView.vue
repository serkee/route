<template>
  <div class="container">
    <AppHeader />

    <div class="content">
      <div class="tab">
        <ul>
          <li :class="{ active: activeTab === 0 }">
            <button @click="changeTab(0)">전체</button> </li>
          <li :class="{ active: activeTab === 1 }">
            <button @click="changeTab(1)">자유게시판</button> </li>
          <li :class="{ active: activeTab === 2 }">
            <button @click="changeTab(2)">루트</button> </li>
          <li :class="{ active: activeTab === 3 }">
            <button @click="changeTab(3)">중고마켓</button> </li>
        </ul>
      </div>

      <div class="list">
        <p v-if="isLoadingPosts">게시글 불러오는 중...</p>

        <p v-else-if="userPosts.length === 0">작성한 게시글이 없습니다.</p>

        <ul v-else>
          <li v-for="post in userPosts" :key="post.id">
            <router-link :to="`/board/${post.id}`">
              <img v-if="post.imageUrl" :src="post.imageUrl" :alt="post.title">
              <img v-else src="@/assets/images/contents/noimg.png" alt="이미지 없음"> </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/store/user"; // Pinia 스토어 import
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import

// Firestore SDK에서 필요한 함수들을 import 합니다.
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
// @/firebase 에서 db 인스턴스를 import 합니다.
import { db } from '@/firebase';

// 상태 변수
const userStore = useUserStore(); // Pinia 스토어 인스턴스
const router = useRouter(); // 라우터 인스턴스

// 현재 활성화된 탭의 인덱스 (0: 전체, 1: 자유, 2: 루트, 3: 마켓)
const activeTab = ref(0); // 초기값으로 첫 번째 탭(인덱스 0)을 활성화합니다.

// 불러온 사용자의 게시글 목록을 저장할 반응형 변수
const userPosts = ref([]); // 사용자 게시글 목록 상태 변수
// 게시글 로딩 중 상태를 나타내는 반응형 변수
const isLoadingPosts = ref(false); // 로딩 상태 변수

// 게시글 불러오기 함수
const fetchUserPosts = async (userId, categoryIndex) => {
    // 사용자 ID가 없으면 데이터를 불러올 수 없습니다. (라우터 가드에서 대부분 처리되지만 방어 코드)
    if (!userId) {
        console.log("User ID not available for fetching posts.");
        userPosts.value = []; // 게시글 목록 초기화
        return;
    }

    isLoadingPosts.value = true; // 로딩 시작
    userPosts.value = []; // 이전 게시글 목록 초기화

    try {
        // 'posts' 컬렉션 참조
        const postsCollectionRef = collection(db, 'posts');
        let q;

        // 기본 쿼리: 현재 로그인한 사용자가 작성한 글만 필터링
        q = query(postsCollectionRef, where('authorId', '==', userId));

        // 탭 인덱스에 따라 카테고리 필터 추가
        if (categoryIndex === 1) { // 자유게시판 탭
            q = query(q, where('category', '==', 'free'));
        } else if (categoryIndex === 2) { // 루트 탭
            q = query(q, where('category', '==', 'route')); // Firestore에 저장된 카테고리 값 확인
        } else if (categoryIndex === 3) { // 중고마켓 탭
            q = query(q, where('category', '==', 'market')); // Firestore에 저장된 카테고리 값 확인
        }

        // 게시글 정렬 기준 (예: 작성일시 내림차순)
        q = query(q, orderBy('createdAt', 'desc'));

        console.log(`Workspaceing posts for user ${userId}, category index ${categoryIndex}`);

        // 쿼리 실행하여 스냅샷 가져오기
        const querySnapshot = await getDocs(q);

        const posts = [];
        // 스냅샷에서 각 문서(게시글) 데이터를 추출
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() }); // 문서 ID와 데이터 함께 저장
        });

        userPosts.value = posts; // 불러온 게시글 목록 상태 업데이트
        console.log(`Workspaceed ${posts.length} posts.`);

    } catch (error) {
        console.error("Error fetching user posts:", error);
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
        userPosts.value = []; // 오류 발생 시 게시글 목록 초기화
    } finally {
        isLoadingPosts.value = false; // 로딩 종료
    }
};


// 탭 변경 함수
const changeTab = (index) => {
  activeTab.value = index; // 활성 탭 인덱스 업데이트
  console.log("탭이 변경되었습니다. 인덱스:", index);

  // 탭 변경 시 해당 카테고리의 게시글 다시 불러오기
  // userStore.uid는 라우터 가드에 의해 로그인 상태가 확인된 후에는 항상 존재합니다.
  fetchUserPosts(userStore.uid, activeTab.value);
};


// 컴포넌트 마운트 시 실행될 로직
onMounted(() => {
  console.log("UserView mounted.");
  // 컴포넌트 마운트 시 (로그인 상태에서 접근 시) 현재 사용자의 게시글 불러오기
  // 라우터 가드에서 userStore.uid가 유효한 경우에만 이 페이지 접근을 허용하므로,
  // 여기서는 userStore.uid가 항상 유효하다고 가정해도 안전합니다.
   if (!userStore.uid) {
       console.log("User UID not available on mount, redirecting to login (fallback).");
       router.replace('/login'); // 혹시 모를 상황에 대비한 리다이렉션 (라우터 가드와 함께 작동)
   } else {
       console.log("User logged in, fetching initial posts for user:", userStore.uid);
       // 마운트 시 현재 활성 탭 (초기값 0: 전체)에 해당하는 게시글 불러오기
       fetchUserPosts(userStore.uid, activeTab.value);
   }
});

</script>

<style scoped>
.container {
    /* 헤더와 탭이 fixed일 경우 컨테이너 상단 패딩 필요 */
    padding-top: calc(50px + 60px); /* 헤더 높이(예시 50px) + 탭 높이(예시 60px) */
    padding-left: 0;
    padding-right: 0;
    position: relative;
    max-width: 800px; /* UserView 내용 최대 너비 설정 (선택 사항) */
    margin: 0 auto; /* 중앙 정렬 (선택 사항) */
}

/* AppHeader 스타일은 AppHeader.vue 파일 자체 또는 전역 스타일에서 관리 */

.content {
   width: 100%;
   position: relative;
   /* content 내부 패딩 필요 시 추가 */
   /* padding: 20px; */
   box-sizing: border-box;
}

/* 탭 메뉴 스타일 */
.tab{
  position: fixed; /* 상단 고정 */
  left:0;
  right:0;
  top: 50px; /* 헤더 높이(예시 50px) 아래에 위치 */
  z-index: 2;
  background: #fff;
  border-bottom: 1px solid rgb(223, 223, 223); /* 탭 하단 구분선 */
  height: 60px; /* 탭 높이 설정 */
  display: flex; /* ul을 flex container로 만듦 */
  align-items: flex-end; /* 하단 정렬 */
}
.tab > ul{
  display: flex;
  width: 100%;
  padding: 0; /* ul 기본 패딩 제거 */
  margin: 0; /* ul 기본 마진 제거 */
  list-style: none; /* ul 기본 마커 제거 */
}
.tab > ul > li{
  flex: 1; /* li 요소들이 같은 너비로 공간 분할 */
  text-align: center; /* 텍스트 중앙 정렬 */
}
.tab > ul > li > button{
  height: 40px; /* 버튼 높이 */
  font-size: 16px; /* 폰트 크기 */
  border:0;
  border-bottom: 2px solid transparent; /* 비활성 탭 하단 선 (투명) */
  background: transparent;
  width: 100%;
  padding: 0;
  cursor: pointer;
  color: #555; /* 비활성 탭 글자 색상 */
  transition: all 0.3s ease; /* 부드러운 전환 효과 */
}
.tab > ul > li.active > button{
  border-bottom-color: rgb(19, 177, 56); /* 활성 탭 하단 선 색상 */
  font-weight: bold;
  color: rgb(19, 177, 56); /* 활성 탭 글자 색상 */
}

/* 게시글 목록 스타일 */
.list{
  /* 탭 fixed로 인한 공간 확보 */
  /* padding-top: 60px; /* 탭 높이만큼 상단 패딩 (content에 이미 적용되었을 수도 있음) */
  /* list 자체의 상단 패딩 */
  padding: 10px; /* 게시글 목록 주변 패딩 */
}
.list > ul{
  display: grid; /* 그리드 레이아웃 */
  grid-template-columns: 1fr 1fr 1fr; /* 3열 */
  gap: 10px; /* 아이템 간 간격 */
  padding: 0;
  margin: 0;
  list-style: none;
}
.list > ul > li{
  /* 그리드 아이템 스타일 */
  overflow: hidden; /* 내용 넘칠 시 숨김 */
  border: 1px solid #eee; /* 각 게시글 아이템 테두리 */
  border-radius: 5px; /* 테두리 둥글게 */
}
.list > ul > li > a{
    display: block; /* a 태그를 블록 요소로 만들어 전체 영역 클릭 가능하게 */
    width: 100%;
    height: 100%; /* 부모 li 높이 채우기 */
    text-decoration: none; /* 밑줄 제거 */
    color: inherit; /* 글자 색상 상속 */
}
.list > ul > li > a > img{
  display: block; /* 이미지 하단 여백 제거 */
  width: 100%;
  height: auto; /* 높이 자동 조절 */
  object-fit: cover; /* 이미지를 잘리지 않게 채움 (필요 시 contain 사용) */
  aspect-ratio: 1 / 1; /* 1:1 비율 유지 (썸네일 형태에 적합) */
}

/* 로딩 메시지 및 게시글 없음 메시지 스타일 */
.list > p {
    text-align: center;
    font-size: 16px;
    color: #777;
    margin-top: 20px;
}
</style>