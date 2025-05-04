<template>
  <div>
    <div class="category-tabs">
      <button
        :class="{ active: selectedCategory === 'all' }"
        @click="selectCategory('all')">
        전체
      </button>
      <button
        :class="{ active: selectedCategory === 'free' }"
        @click="selectCategory('free')">
        자유게시판
      </button>
      <button
        :class="{ active: selectedCategory === 'route' }"
        @click="selectCategory('route')">
        루트게시판
      </button>
      <button
        :class="{ active: selectedCategory === 'market' }"
        @click="selectCategory('market')">
        중고마켓
      </button>
      </div>

    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="제목, 내용, 작성자, 카테고리로 검색..."
        class="search-input"
      />
    </div>

    <div v-if="loading">게시글 목록 로딩 중...</div>
    <div v-else-if="error">
      게시글 목록을 불러오는 데 오류가 발생했습니다: {{ error.message }}
    </div>
    <div v-else>
      <p>
        총 <strong class="txt-red">{{ filteredPosts.length }}</strong> 개의
        게시글이 있습니다.
        <span v-if="searchQuery"> (검색 결과)</span>
      </p>
      <table class="board-table">
        <colgroup>
          <col style="width:auto">
          <col style="width:80px">
          <col style="width:130px">
          <col style="width:150px">
          <col style="width:70px">
        </colgroup>
        <thead>
          <tr>
            <th>제목</th>
            <th>카테고리</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in filteredPosts" :key="post.id">
            <td>
              <a
                href="#"
                @click.prevent="goToPostDetail(post.id)"
                class="post-title-link"
              >
                {{ post.title }}
              </a>
            </td>
            <td>{{ displayCategoryName(post.category) }}</td>
            <td>{{ post.authorName || post.authorEmail || "알 수 없음" }}</td>
            <td>
              {{
                post.createdAt
                  ? formatDate(post.createdAt.toDate())
                  : "날짜 없음"
              }}
            </td>
            <td>
              <button @click="handleDeletePost(post.id)">삭제</button>
            </td>
          </tr>
          <tr v-if="filteredPosts.length === 0">
            <td colspan="5" class="no-posts-message">
              {{
                searchQuery
                  ? "검색 결과가 없습니다."
                  : "등록된 게시글이 없습니다."
              }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
// ✅✅✅ 필요한 import 구문 (vue, firestore, boardService) ✅✅✅
import { ref, onMounted, computed } from "vue";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
// ✅ 이전에 구현한 게시글 삭제 서비스 함수 import
import { deletePost } from '@/services/boardService';


const posts = ref([]); // Firestore에서 가져온 전체 게시글 목록 (필터링 전)
const loading = ref(true); // 데이터 로딩 상태
const error = ref(null); // 오류 상태
const searchQuery = ref(''); // 검색어 입력을 위한 반응형 변수
// ✅✅✅ 현재 선택된 카테고리를 저장하는 반응형 변수 (스크립트 부분) ✅✅✅
const selectedCategory = ref('all'); // 'all', 'free', 'route', 'market' 등

// Firestore에서 게시글 목록을 가져오는 비동기 함수
const fetchPosts = async () => {
  console.log("[BoardManagement] 게시글 목록 가져오기 시작");
  loading.value = true;
  error.value = null;
  try {
    const postsCollectionRef = collection(db, "posts");
    // ✅ 쿼리는 모든 게시글을 가져오고 작성일 내림차순으로 정렬합니다.
    // 카테고리 필터링은 클라이언트 측에서 filteredPosts computed 속성에서 수행됩니다.
    const q = query(postsCollectionRef, orderBy("createdAt", "desc")); // 기본 정렬 유지

    const querySnapshot = await getDocs(q);

    const postsList = [];
    for (const doc of querySnapshot.docs) { // Use for...of for potential async operations inside
       const postData = {
         id: doc.id,
         ...doc.data(),
       };
       postsList.push(postData);
    }

    posts.value = postsList; // 가져온 전체 목록을 posts에 저장
    console.log(`[BoardManagement] 게시글 목록 ${postsList.length}개 가져옴.`);
  } catch (e) {
    console.error("[BoardManagement] 게시글 목록 가져오기 오류:", e);
    error.value = e;
  } finally {
    loading.value = false;
  }
};

const displayCategoryName = (category) => {
  switch (category) {
    case 'free':
      return '자유'; // 'free'는 '자유'로 표시
    case 'route':
      return '루트'; // 'route'는 '루트'로 표시
    case 'market':
      return '장고마켓'; // 'market'은 '장고마켓'으로 표시 (이전에 '중고마켓' 버튼명이 있었지만 요청에 따라 '장고마켓'으로 표시)
    // 다른 카테고리가 있다면 여기에 추가
    default:
      // 매핑되지 않는 카테고리는 원래 값 또는 '기타'로 표시
      return category || '기타';
  }
};

// ✅✅✅ 카테고리 및 검색어에 따라 posts 배열을 필터링하는 computed 속성 (스크립트 부분) ✅✅✅
const filteredPosts = computed(() => {
    let result = posts.value; // 필터링 시작 시 전체 목록에서 시작

    // STEP 1: 카테고리 필터링
    if (selectedCategory.value !== 'all') {
        result = result.filter(post => post.category === selectedCategory.value);
        console.log(`[BoardManagement] 카테고리 "${selectedCategory.value}"로 필터링 후 ${result.length}개.`);
    }

    // STEP 2: 검색어 필터링 (카테고리 필터링 결과에 대해 적용)
    const query = searchQuery.value.toLowerCase();
    if (query) {
        result = result.filter(post => {
            const title = post.title || '';
            const category = post.category || ''; // 카테고리 필드가 이미 사용되지만, 검색에도 포함 가능
            const authorName = post.authorName || post.author || ''; // post 문서에 작성자 이름 관련 필드가 있다면 사용
            const authorEmail = post.authorEmail || ''; // post 문서에 작성자 이메일 관련 필드가 있다면 사용
            const content = post.content || ''; // 게시글 내용 필드 (있다면 검색 대상에 포함)

            return title.toLowerCase().includes(query) ||
                   category.toLowerCase().includes(query) ||
                   authorName.toLowerCase().includes(query) ||
                   authorEmail.toLowerCase().includes(query) ||
                   content.toLowerCase().includes(query);
        });
        console.log(`[BoardManagement] 검색어 "${searchQuery.value}"로 필터링 후 ${result.length}개.`);
    }

    // 최종 필터링 결과 반환 (Firestore에서 가져온 순서 (작성일 내림차순) 유지)
    return result;
});

// ✅✅✅ 카테고리 선택 함수 (스크립트 부분) ✅✅✅
const selectCategory = (category) => {
    console.log(`[BoardManagement] 카테고리 선택: ${category}`);
    selectedCategory.value = category; // 선택된 카테고리 업데이트 -> filteredPosts 자동 재계산
    searchQuery.value = ''; // 카테고리 변경 시 검색어 초기화 (선택 사항)
};


const formatDate = (date) => {
  if (!date) return "날짜 없음";

  const year = date.getFullYear();
  // 월은 0부터 시작하므로 1을 더하고, 두 자리로 맞춥니다.
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  // 일자를 두 자리로 맞춥니다.
  const day = date.getDate().toString().padStart(2, '0');
  // 시간을 두 자리로 맞춥니다.
  const hours = date.getHours().toString().padStart(2, '0');
  // 분을 두 자리로 맞춥니다.
  const minutes = date.getMinutes().toString().padStart(2, '0');

  // 'YYYY-MM-DD HH:mm' 형식으로 조합하여 반환합니다.
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};


const goToPostDetail = (postId) => { /* ... (same goToPostDetail function) ... */
  console.log(`[BoardManagement] 게시글 ${postId} 제목 클릭. 새 탭으로 상세 페이지 이동.`);
    // ✅ 게시글 상세 페이지의 루트 경로에 맞게 URL을 생성합니다.
    // 예: /post/:id 루트를 사용한다면 const url = `/post/${postId}`;
    // 예: /board/:id 루트를 사용한다면 const url = `/board/${postId}`;
  const url = `/board/${postId}`; // 여러분의 게시글 상세 루트 경로에 맞게 수정
  window.open(url, '_blank'); // '_blank'는 새 탭/창을 의미
};

const handleDeletePost = async (postId) => { /* ... (same handleDeletePost function) ... */
  console.log(`[BoardManagement] 게시글 ${postId} 삭제 버튼 클릭.`);
  if (confirm(`정말로 이 게시글(${postId})을 삭제하시겠습니까?`)) {
    try {
      await deletePost(postId);
      // alert(`게시글 ${postId}가 성공적으로 삭제되었습니다.`);
      console.log(`[BoardManagement] 게시글 ${postId} 삭제 완료.`);
      fetchPosts(); // 목록 새로고침
    } catch (e) {
      console.error(`[BoardManagement] 게시글 ${postId} 삭제 중 오류 발생:`, e);
      alert(`게시글 삭제 중 오류가 발생했습니다: ${e.message}`);
    }
  }
};

// 컴포넌트가 마운트될 때 게시글 목록을 가져옵니다.
onMounted(() => {
  fetchPosts(); // 컴포넌트 마운트 시 전체 게시글 목록 가져오기
});
</script>

<style scoped>
/* ✅✅✅ Board Management 전용 스타일 ✅✅✅ */

/* 검색 바 스타일 (UserManagement와 유사) */
.search-bar {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 5px;
}

.search-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1em;
}

/* 게시글 목록 테이블 스타일 */
.board-table {
  /* 클래스 이름 확인 */
  width: 100%; /* 테이블 너비 전체 사용 */
  border-collapse: collapse; /* 셀 간격 제거 */
  margin-top: 20px; /* 상단 여백 */
  font-size: 0.9em; /* 글꼴 크기 */
}

.board-table th,
.board-table td {
  border: 1px solid #ddd; /* 셀 테두리 */
  padding: 8px 10px; /* 셀 안쪽 여백 */
  text-align: left; /* 왼쪽 정렬 */
  word-break: break-word; /* 내용이 길면 단어 단위로 줄바꿈 */
  vertical-align: middle; /* 세로 중앙 정렬 */
  height: auto; /* 높이 자동 조절 */
}

.board-table th {
  background-color: #e9ecef; /* 헤더 배경색 */
  font-weight: bold;
  color: #333;
}

.board-table tbody tr:nth-child(even) {
  background-color: #f8f9fa; /* 짝수 행 배경색 */
}

.board-table tbody tr:hover {
  background-color: #e2e6ea; /* 호버 시 배경색 */
}

/* ✅ 게시글 제목 링크 스타일 */
.board-table .post-title-link {
  color: #007bff; /* 링크 색상 */
  text-decoration: none; /* 밑줄 제거 */
  font-weight: bold;
  cursor: pointer; /* 클릭 가능 표시 */
}

.board-table .post-title-link:hover {
  text-decoration: underline; /* 호버 시 밑줄 */
}

/* 삭제 버튼 스타일 */
.board-table td button {
  margin-right: 5px;
  padding: 5px 10px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  font-size: 0.8em;
  transition: background-color 0.2s ease;
}

.board-table td button:hover:not(:disabled) {
  background-color: #e9ecef;
}

/* 메시지 스타일 */
.board-table .no-posts-message {
  /* 클래스 이름 확인 */
  text-align: center;
  font-style: italic;
  color: #888;
  padding: 20px;
}
.txt-red {
  /* 총 개수 텍스트 스타일 */
  color: red;
  font-weight: bold;
}
/* ✅✅✅ 카테고리 탭 스타일 추가 ✅✅✅ */
.category-tabs {
    margin-bottom: 15px; /* 검색 바와의 간격 */
    text-align: center; /* 버튼들을 가운데 정렬 */
}

.category-tabs button {
    margin: 0 5px; /* 버튼 간 간격 */
    padding: 8px 15px; /* 버튼 안쪽 여백 */
    border: 1px solid #ccc; /* 테두리 */
    border-radius: 20px; /* 모서리 둥글게 */
    background-color: #f8f9fa; /* 배경색 */
    cursor: pointer; /* 마우스 오버 시 포인터 모양 */
    font-size: 0.9em; /* 글자 크기 */
    transition: background-color 0.2s ease, border-color 0.2s ease; /* 호버/활성 애니메이션 */
}

/* 참고: 활성 탭 스타일 (.active 클래스)은 script에서 selectedCategory 상태와 연결되어야 작동합니다. */
/* 현재 이 코드만으로는 클릭해도 활성 상태가 바뀌지 않습니다. */
.category-tabs button.active {
    background-color: #007bff; /* 활성 탭 배경색 */
    color: white; /* 활성 탭 글자색 */
    border-color: #007bff; /* 활성 탭 테두리색 */
    font-weight: bold;
}

.category-tabs button:hover:not(.active) {
    background-color: #e9ecef; /* 호버 시 배경색 */
}
</style>