<template>
  <div class="container">
    <AppHeader />
    <div class="content">
      <div class="tab">
        <ul>
          <li :class="{ active: activeTab === 0 }">
            <button @click="changeTab(0)">자유게시판</button>
          </li>
          <li :class="{ active: activeTab === 1 }">
            <button @click="changeTab(1)">루트</button>
            <span class="new">N</span>
          </li>
          <li :class="{ active: activeTab === 2 }">
            <button @click="changeTab(2)">중고마켓</button>
          </li>
        </ul>
      </div>
      <div class="list">
        <ul>
          <li v-for="post in posts" :key="post.id" :class="{ notice: post.isNotice }">
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(post.id)">
              <div class="txt">
                <p>
                  {{ post.title }}
                </p>
                <ul>
                  <li>조회 <span>{{ post.views || 0 }}</span></li> <li><i class="rep"></i> <span>{{ post.commentCount || 0 }}</span></li> </ul>
              </div>
              <div v-if="post.imageUrl" class="img">
                 <img :src="post.imageUrl" :alt="post.title + ' 이미지'" /> </div>
            </a>
          </li>
           <li v-if="posts.length === 0" class="no-posts-message">
               <p>게시글이 없습니다.</p>
           </li>
        </ul>
      </div>
      <button class="btn-feed" @click="goToWritePage">+ 피드쓰기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"; // onMounted, onUnmounted import
import { useRouter } from "vue-router";
import AppHeader from "@/components/AppHeader.vue"; // AppHeader 컴포넌트 import (경로 확인)

// Firebase Firestore SDK에서 필요한 함수들을 import 합니다.
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
// main.js 등에서 초기화하고 export 한 Firestore 인스턴스를 import 합니다.
// @/main.js 경로는 프로젝트 설정에 따라 다를 수 있습니다.
import { db } from '@/main.js';

// 현재 활성화된 탭의 인덱스를 저장하는 반응형 변수
const activeTab = ref(0);

const router = useRouter();

// Firestore에서 불러온 게시글 목록을 저장할 반응형 변수
const posts = ref([]);

// Firestore 실시간 리스너 해제 함수를 저장할 변수
let unsubscribe = null;

// 탭 변경 함수
const changeTab = (index) => {
  activeTab.value = index;
  console.log("탭이 변경되었습니다. 인덱스:", index);
  // TODO: 실제 애플리케이션에서는 여기에 선택된 탭에 해당하는 Firestore 컬렉션 경로를 변경하거나 쿼리를 조정하여 데이터를 다시 불러와야 합니다.
  // 예:
  // if (unsubscribe) {
  //   unsubscribe(); // 기존 리스너 해제
  // }
  // const collectionName = index === 0 ? '자유게시판_컬렉션명' : index === 1 ? '루트_컬렉션명' : '중고마켓_컬렉션명';
  // listenForPosts(collectionName); // 새로운 리스너 설정
};

// Firestore에서 게시글 목록을 실시간으로 가져오는 함수
const listenForPosts = (collectionName) => {
  console.log(`Firestore에서 게시글 목록 리스닝 시작: ${collectionName}`);
  const postsCollectionRef = collection(db, collectionName); // Firestore 인스턴스(db)와 컬렉션 이름으로 참조 생성

  // 쿼리 생성 (예: 'createdAt' 필드 기준 내림차순 정렬, 실제 필드 이름 확인 필요)
  // 'createdAt' 필드는 게시글 생성 시 서버 타임스탬프 등으로 저장하는 것이 좋습니다.
  const q = query(postsCollectionRef, orderBy('createdAt', 'desc')); // 'createdAt' 필드가 있다고 가정

  // 실시간 리스너 설정
  // onSnapshot 함수는 쿼리 결과의 변경 사항을 실시간으로 감지합니다.
  unsubscribe = onSnapshot(q, (snapshot) => {
    const postsList = [];
    snapshot.forEach((doc) => {
      // 각 문서의 데이터를 가져와 객체로 만들고 postsList 배열에 추가
      // doc.id는 Firestore 문서의 고유 ID이며, 게시글의 ID로 사용합니다.
      postsList.push({ id: doc.id, ...doc.data() }); // doc.data()는 문서 필드 데이터 객체
    });
    posts.value = postsList; // 반응형 변수 업데이트 -> 화면 자동 갱신
    console.log("Firestore 데이터 업데이트:", posts.value);
  }, (error) => {
    // 오류 처리
    console.error("Firestore 리스닝 오류:", error);
    // 사용자에게 알림 또는 대체 콘텐츠 표시 로직 추가
    alert("게시글 목록을 불러오는데 오류가 발생했습니다.");
  });
};


// "피드쓰기" 버튼 클릭 시 쓰기 페이지로 이동하는 함수
const goToWritePage = () => {
  router.push("/board/write"); // 쓰기 페이지 라우트 경로로 이동
};

// 게시글 상세 페이지로 이동하는 함수 (Firestore 문서 ID 사용)
const goToPostDetail = (postId) => {
  console.log("게시글 클릭. 상세 페이지로 이동 (ID:", postId, ")");
  // 라우트 경로에 Firestore 문서 ID를 파라미터로 포함하여 이동합니다.
  // 예: /board/abc123xyz
  router.push(`/board/${postId}`);
  // 또는 router.push({ name: 'board-detail', params: { id: postId } }); // 라우트 이름 사용 시
};

// 컴포넌트가 마운트될 때 실행 (화면에 표시될 때)
onMounted(() => {
  // 컴포넌트 마운트 시 기본 탭(자유게시판)에 해당하는 게시글 목록 실시간 리스닝 시작
  // 'free_board_posts'는 실제 Firestore 컬렉션 이름으로 변경하세요.
  listenForPosts('free_board_posts'); // 예시 컬렉션 이름
});

// 컴포넌트가 언마운트될 때 실행 (페이지 이동 등으로 컴포넌트가 사라질 때)
onUnmounted(() => {
  // 메모리 누수 방지를 위해 onSnapshot 리스너를 해제합니다.
  if (unsubscribe) {
    unsubscribe(); // 실시간 리스너 해제 함수 호출
    console.log("Firestore 리스너 해제됨.");
  }
});

</script>

<style scoped>
/* 기존 스타일 유지 */
.container {
  width: 100%;
  max-width: 500px; /* Example max-width */
  margin: 0 auto;
  padding: 0 20px; /* Add padding */
  box-sizing: border-box;
}

.content {
  width: 100%;
  position: relative;
  padding-top: 120px; /* 헤더 + 탭 높이에 맞춰 조정 */
}
.tab {
  position: fixed;
  left: 0;
  right: 0px;
  top: var(
    --header-height,
    50px
  ); /* 실제 헤더 높이에 맞춰 top 조정. 필요하다면 CSS 변수 --header-height 값을 정의하세요. */
  z-index: 2;
  padding: 0 20px;
  background: #fff;
}
.tab > ul {
  display: flex;
  padding: 20px 0 10px;
  gap: 10px;
}
.tab > ul > li {
  flex: 1;
  position: relative;
}
.tab > ul > li .new {
  position: absolute;
  right: -3px;
  top: -3px;
  width: 20px;
  height: 20px;
  line-height: 20px;
  background: rgb(216, 0, 0);
  color: #fff;
  display: block;
  border-radius: 100%;
  font-size: 12px;
  font-weight: bold;
  text-align: center;
}
.tab > ul > li > button {
  height: 40px;
  line-height: 41px;
  font-size: 18px;
  border: 0;
  border: 1px solid rgb(223, 223, 223);
  background: transparent;
  width: 100%;
  padding: 0;
  cursor: pointer;
  border-radius: 20px;
  cursor: pointer;
}
.tab > ul > li.active > button {
  font-weight: bold;
  color: rgb(21, 115, 238);
  background: rgb(225, 241, 255);
}
.list {
  margin: 0 -20px;
}
.list > ul {
}
.list > ul > li {
  position: relative;
  border-bottom: 1px solid #f3f3f3;
  padding: 0 20px;
}
.list > ul > li > a {
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  gap: 10px;
  text-decoration: none;
  color: #222;
  min-height: 100px;
}
.list > ul > li > a .txt {
  flex: 1;
  overflow: hidden;
}
.list > ul > li > a .txt > p {
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.list > ul > li > a .txt > ul {
  display: flex;
  margin-top: 15px;
  gap: 30px;
  padding: 0;
}
.list > ul > li > a .txt > ul > li {
  font-size: 13px;
  color: #999;
}
.list > ul > li > a .txt > ul > li > span {
  color: #222;
}
.list > ul > li > a .txt > ul > li .rep {
  display: inline-block;
  vertical-align: middle;
  width: 15px;
  height: 15px;
  margin: -3px 0 0 0;
  background-color: #c7c7c7;
  -webkit-mask-image: url(@/assets/images/common/ico_comment.svg);
  mask-image: url(@/assets/images/common/ico_comment.svg);
  -webkit-mask-size: cover;
}
.list > ul > li > a .img {
  overflow: hidden;
  border-radius: 5px;
  font-size: 0;
  width: 80px;
  height: 80px;
  position: relative;
  flex-shrink: 0;
}
.list > ul > li > a img {
  width: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.list > ul > li.notice {
  background: #eff7ff;
}
.list > ul > li.notice > a .txt > p:before {
  content: "공지";
  color: #005fec;
  display: inline-block;
  margin-right: 5px;
}
.btn-feed {
  position: fixed;
  bottom: 75px; /* 하단 네비게이션 바 높이에 맞춰 조정 */
  right: 15px;
  height: 50px;
  background: rgb(19, 177, 56);
  border: 0;
  font-size: 20px;
  color: #fff;
  padding: 0 20px;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.2);
}
</style>