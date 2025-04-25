<template>
  <div class="container">
    <AppHeader />
    <div class="content">
      <div class="titWrap">
        <h2>자유게시판</h2>
        <button @click="goToCategoryList('free')">전체보기+</button>
      </div>
      <div class="list">
        <ul>
          <li v-for="post in freePosts" :key="post.id">
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(post.id)">
              <div class="list-image-container">
                 <img v-if="post.imageUrl" :src="post.imageUrl" :alt="post.title + ' 이미지'">
                 <img v-else src="@/assets/images/contents/@thumb.png" alt="기본 썸네일">
              </div>
            </a>
          </li>
           <li v-if="freePosts.length === 0" class="no-posts-message">
             <p>게시글이 없습니다.</p>
           </li>
        </ul>
      </div>

      <div class="titWrap">
        <h2>루트게시판</h2>
        <button @click="goToCategoryList('route')">전체보기+</button>
      </div>
      <div class="list">
        <ul>
           <li v-for="post in routePosts" :key="post.id">
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(post.id)">
               <div class="list-image-container">
                 <img v-if="post.imageUrl" :src="post.imageUrl" :alt="post.title + ' 이미지'">
                 <img v-else src="@/assets/images/contents/@thumb.png" alt="기본 썸네일">
               </div>
            </a>
          </li>
           <li v-if="routePosts.length === 0" class="no-posts-message">
             <p>게시글이 없습니다.</p>
           </li>
        </ul>
      </div>

      <div class="titWrap">
        <h2>중고마켓</h2>
        <button @click="goToCategoryList('market')">전체보기+</button>
      </div>
      <div class="list">
        <ul>
           <li v-for="post in marketPosts" :key="post.id">
            <a href="javascript:void(0)" @click.prevent="goToPostDetail(post.id)">
               <div class="list-image-container">
                 <img v-if="post.imageUrl" :src="post.imageUrl" :alt="post.title + ' 이미지'">
                 <img v-else src="@/assets/images/contents/@thumb.png" alt="기본 썸네일">
               </div>
            </a>
          </li>
           <li v-if="marketPosts.length === 0" class="no-posts-message">
             <p>게시글이 없습니다.</p>
           </li>
        </ul>
      </div>

      <button class="btn-feed" @click="() => router.push('/board/write')">+ 피드쓰기</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from 'vue-router';
import { useUserStore } from "@/store/user";
import AppHeader from "@/components/AppHeader.vue";

import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';


const userStore = useUserStore();
const router = useRouter();

const freePosts = ref([]);
const routePosts = ref([]);
const marketPosts = ref([]);

const fetchCategoryPosts = async (categoryName, limitCount = 4) => {
  console.log(`Firestore에서 최신 게시글 조회: 카테고리 "${categoryName}", 최대 ${limitCount}개`);

  const postsCollectionRef = collection(db, 'posts');

  const q = query(
    postsCollectionRef,
    where('category', '==', categoryName),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  try {
    const querySnapshot = await getDocs(q);
    const postsList = [];
    querySnapshot.forEach((doc) => {
      postsList.push({ id: doc.id, ...doc.data() });
    });
    console.log(`카테고리 "${categoryName}"의 데이터 ${postsList.length}개 가져옴.`);
    return postsList;
  } catch (error) {
    console.error(`카테고리 "${categoryName}"의 게시글 가져오기 오류:`, error);
    return [];
  }
};

const goToPostDetail = (postId) => {
  console.log("게시글 클릭. 상세 페이지로 이동 (ID:", postId, ")");
  router.push(`/board/${postId}`);
};

const goToCategoryList = (categoryName) => {
    console.log(`"${categoryName}" 카테고리 전체보기 클릭. 게시판 목록 페이지로 이동.`);
    router.push({ path: '/board', query: { category: categoryName } });
};


onMounted(async () => {
  console.log(
    "HomeView mounted. User:",
    userStore.name,
    userStore.email,
    userStore.profileImageUrl
  );

  freePosts.value = await fetchCategoryPosts('free');
  routePosts.value = await fetchCategoryPosts('route');
  marketPosts.value = await fetchCategoryPosts('market');

  console.log("홈 화면 초기 데이터 가져오기 완료.");
});

</script>

<style scoped>
.container {
    /* padding: 0 20px; */
    box-sizing: border-box;
}

.content{
    width: 100%;
}

.titWrap{
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    margin-bottom: 5px;
}

.titWrap > h2{
    font-size: 20px;
    font-weight: bold;
    margin: 0;
}

.titWrap > button{
    border:1px solid #e1e1e1;
    background: transparent;
    height: 25px;
    line-height: 23px;
    border-radius: 13px;
    color: #999;
    padding: 0 10px;
    cursor: pointer;
}

.list + .titWrap{
    margin-top: 30px;
}

.list{
    overflow-x: auto;
    overflow-y: hidden;
    margin: 0 -20px;
    padding: 0 20px;
}

.list > ul{
    display: flex;
    text-align: left;
    word-break: keep-all;
    white-space: nowrap;
    padding: 0;
    margin: 0;
    list-style: none;
}

.list > ul > li{
    flex-shrink: 0;
    display: inline-block;
    vertical-align: top;
    width: 130px;
    height: 130px;
    margin-right: 10px;
    border: 1px solid #eee;
    /* border-radius: 8px; */
    overflow: hidden;
    background-color: #fff;
    /* box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1); */
    white-space: normal;
    padding: 0;
}

.list > ul > li:last-child {
    margin-right: 0;
}

.list > ul > li > a {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
    color: #222;
    padding: 0;
}

.list-image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
}

.list-image-container img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.no-image-thumb {
     display: flex;
     justify-content: center;
     align-items: center;
     font-size: 14px;
     color: #888;
     width: 100%;
     height: 100%;
}

.no-image-thumb span {
     display: block;
}

.no-posts-message {
   display: block !important;
   flex-shrink: 0;
   width: 100% !important;
   text-align: center;
   color: #b9b9b9;
   font-style: italic;
   padding: 20px 0;
   border-bottom: none;
   margin-right: 0 !important;
   box-shadow: none !important;
   border: none !important;
   background-color: transparent !important;
   min-height: auto !important;

   display: flex !important;
   justify-content: center !important;
   align-items: center !important;
}
.no-posts-message p {
    margin: 0;
}

</style>