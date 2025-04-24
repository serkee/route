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
          </li>
          <li :class="{ active: activeTab === 2 }">
            <button @click="changeTab(2)">중고마켓</button>
          </li>
        </ul>
      </div>
      <div class="list">
        <ul>
          <li
            v-for="post in posts"
            :key="post.id"
            :class="{ notice: post.isNotice }"
          >
            <a
              href="javascript:void(0)"
              @click.prevent="goToPostDetail(post.id)"
            >
              <div class="txt">
                <p>
                  {{ post.title }}
                </p>
                <ul>
                  <li>{{ post.authorName || post.authorId }}</li>
                  <li>
                    조회 <span>{{ post.views || 0 }}</span>
                  </li>
                  <li>
                    <i class="rep"></i>
                    <span>{{ post.commentCount || 0 }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="post.imageUrl" class="img">
                <img :src="post.imageUrl" :alt="post.title + ' 이미지'" />
              </div>
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
import { ref, onMounted, onUnmounted } from "vue";
// useRoute 추가 import
import { useRouter, useRoute } from "vue-router";
{
  /* <--- useRoute import */
}
import AppHeader from "@/components/AppHeader.vue";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";

const activeTab = ref(0);

const router = useRouter();
const route = useRoute();
{
  /* <--- route 인스턴스 가져오기 */
}

const posts = ref([]);

let unsubscribe = null;

const categoryMap = {
  0: "free",
  1: "route",
  2: "market",
};

// *** 추가: 카테고리 필드 값으로 탭 인덱스를 찾는 역방향 매핑 또는 함수 ***
const getTabIndexFromCategory = (categoryValue) => {
  const index = Object.keys(categoryMap).find(
    (key) => categoryMap[key] === categoryValue
  );
  // 유효한 카테고리 값이면 해당 인덱스 반환, 없으면 기본값 0 (자유게시판) 반환
  return index !== undefined ? Number(index) : 0;
};

// 탭 변경 함수
const changeTab = (index) => {
  // 현재 활성 탭과 클릭된 탭이 같으면 데이터 다시 로드하지 않음 (불필요한 리스너 재설정 방지)
  if (activeTab.value === index) {
    return;
  }

  activeTab.value = index;
  console.log("탭이 변경되었습니다. 인덱스:", index);

  if (unsubscribe) {
    unsubscribe();
    console.log("기존 Firestore 리스너 해제됨.");
  }

  const selectedCategory = categoryMap[index];
  if (selectedCategory !== undefined) {
    // 탭 변경 시에도 URL 쿼리 파라미터를 업데이트하여 상태 유지 (선택 사항)
    // router.push({ query: { category: selectedCategory } }); // 이렇게 하면 URL에 ?category=... 추가

    listenForPosts("posts", selectedCategory);
  } else {
    console.error(`알 수 없는 탭 인덱스: ${index}`);
  }
};

// Firestore에서 게시글 목록을 실시간으로 가져오는 함수 (카테고리 필터링 포함)
const listenForPosts = (collectionName, category) => {
  console.log(
    `Firestore에서 게시글 목록 리스닝 시작: ${collectionName}, 카테고리: ${category}`
  );

  const postsCollectionRef = collection(db, collectionName);

  const q = query(
    postsCollectionRef,
    where("category", "==", category),
    orderBy("createdAt", "desc")
  );

  unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const postsList = [];
      snapshot.forEach((doc) => {
        postsList.push({ id: doc.id, ...doc.data() });
      });
      posts.value = postsList;
      console.log(
        `카테고리 '${category}'의 Firestore 데이터 업데이트:`,
        posts.value
      );
    },
    (error) => {
      console.error("Firestore 리스닝 오류:", error);
      alert("게시글 목록을 불러오는데 오류가 발생했습니다.");
    }
  );
};

const goToWritePage = () => {
  router.push("/board/write");
};

const goToPostDetail = (postId) => {
  console.log("게시글 클릭. 상세 페이지로 이동 (ID:", postId, ")");
  router.push(`/board/${postId}`);
};

// *** onMounted 훅 수정: URL 쿼리 파라미터 읽어서 초기 카테고리 설정 ***
onMounted(() => {
  // 컴포넌트 마운트 시 URL 쿼리 파라미터에서 'category' 값을 읽습니다.
  const categoryFromQuery = route.query.category;
  let initialCategory;
  let initialTabIndex = 0; // 기본 탭 인덱스 (0: 자유게시판)

  if (categoryFromQuery) {
    // 쿼리 파라미터에서 카테고리 값을 가져온 경우
    // 해당 카테고리 값으로 탭 인덱스를 찾습니다.
    const foundIndex = getTabIndexFromCategory(categoryFromQuery);

    // 찾은 인덱스가 유효하면 (categoryMap에 있는 값이라면)
    if (categoryMap[foundIndex] === categoryFromQuery) {
      initialCategory = categoryFromQuery;
      initialTabIndex = foundIndex; // 해당 탭 인덱스 사용
      console.log(
        `초기 카테고리 (쿼리 파라미터): ${initialCategory}, 탭 인덱스: ${initialTabIndex}`
      );
    } else {
      // 쿼리 파라미터 값이 유효하지 않으면 기본 탭 사용
      initialCategory = categoryMap[activeTab.value]; // activeTab의 초기값 또는 이전에 설정된 값 사용
      initialTabIndex = activeTab.value;
      console.log(
        `초기 카테고리 (쿼리 파라미터 유효하지 않음, 기본값 사용): ${initialCategory}, 탭 인덱스: ${initialTabIndex}`
      );
    }
  } else {
    // 쿼리 파라미터가 없는 경우, 기본 탭 (activeTab.value의 초기값) 사용
    initialCategory = categoryMap[activeTab.value];
    initialTabIndex = activeTab.value;
    console.log(
      `초기 카테고리 (쿼리 파라미터 없음, 기본값 사용): ${initialCategory}, 탭 인덱스: ${initialTabIndex}`
    );
  }

  // determine된 초기 탭 인덱스로 activeTab 상태 업데이트
  activeTab.value = initialTabIndex;

  // 'posts'는 실제 Firestore 컬렉션 이름으로 변경하세요.
  listenForPosts("posts", initialCategory); // 결정된 초기 카테고리로 데이터 로드
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
    console.log("Firestore 리스너 해제됨.");
  }
});
</script>

<style scoped>
/* 기존 스타일 유지 */
.container {
  width: 100%;
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
  padding: 15px 0;
  gap: 10px;
  text-decoration: none;
  color: #222;
  min-height: 85px;
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
  margin-top: 13px;
  gap: 15px;
  padding: 0;
}
.list > ul > li > a .txt > ul > li {
  font-size: 13px;
  color: #999;
}
.list > ul > li > a .txt > ul > li:first-child{
  color: #222;
}
.list > ul > li > a .txt > ul > li > span {
  color: #222;
}
.list > ul > li > a .txt > ul > li .rep {
  display: inline-block;
  vertical-align: middle;
  width: 15px;
  height: 15px;
  margin: -3px 4px 0 0;
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
  box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.2);
}
.list > ul > li > a img {
  width: 100%;
  height: 100%;
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
.no-posts-message {
  padding: 30px 0 !important;
  color: #b9b9b9;
}
</style>