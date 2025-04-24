<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>게시글 상세</h1>
      <div class="header__right"></div>
    </div>

    <div v-if="loading" class="loading">로딩 중...</div>

    <div v-else-if="!post" class="not-found">게시글을 찾을 수 없습니다.</div>

    <div v-else class="post-content">
      <div class="post-content-head">
        <a
          href="javascript:void(0)"
          class="post-content-head-cate"
          @click="goToCategoryList"
          >{{ getCategoryDisplayName(post.category) }} ></a
        >
        <h2>{{ post.title }}</h2>
        <div class="post-content-info">
          <span class="profile">
            <img src="/images/contents/@thumb.png" alt="" />
          </span>
          <p class="name">{{ post.authorName || post.authorId }}</p>
          <p class="info">
            {{ formatDate(post.createdAt) }}
            <span>조회수 {{ post.views }}</span>
          </p>
          <p></p>
        </div>
      </div>
      <div class="content-body">
        <div v-if="post.imageUrl" class="img">
          <img :src="post.imageUrl" :alt="post.title + ' 이미지'" />
        </div>
        {{ post.content }}
      </div>
      <div
        v-if="post && currentUser && currentUser.uid === post.authorId"
        class="post-actions"
      >
        <button @click="handleEdit" class="edit-button">수정</button>
        <button @click="handleDelete" class="delete-button">삭제</button>
      </div>

      <div class="comments-section">
        <h3>댓글 ({{ comments.length }})</h3>
        <div v-if="comments.length > 0" class="comment-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-author">
              {{ comment.authorName || comment.authorId || "익명" }}
              <div class="comment-info">
                <span>{{ formatDate(comment.createdAt) }}</span>

                <template
                  v-if="currentUser && currentUser.uid === comment.authorId"
                >
                  <button
                    @click="startEditComment(comment)"
                    class="action-button edit-comment-button"
                  >
                    수정
                  </button>
                  <button
                    @click="deleteComment(postId, comment.id)"
                    class="action-button delete-comment-button"
                  >
                    삭제
                  </button>
                </template>

                <button
                  v-if="
                    !comment.parentId &&
                    currentUser &&
                    editingCommentId !== comment.id
                  "
                  @click="startReply(comment.id)"
                  class="reply-button action-button"
                >
                  답글
                </button>
              </div>
            </div>

            <div
              v-if="editingCommentId === comment.id"
              class="edit-comment-form"
            >
              <textarea v-model="editingCommentText"></textarea>
              <div class="form-actions">
                <button @click="saveEditedComment">저장</button>
                <button @click="cancelEditComment" class="cancel-button">
                  취소
                </button>
              </div>
            </div>
            <div v-else class="comment-text">
              {{ comment.text }}
            </div>

            <div
              v-if="replyingToCommentId === comment.id && currentUser"
              class="add-comment-form nested"
            >
              <textarea
                v-model="newCommentText"
                :placeholder="`${
                  comment.authorName || comment.authorId || '댓글'
                }에게 답글 작성`"
              ></textarea>
              <div class="form-actions">
                <button @click="addComment">답글 작성</button>
                <button @click="cancelReply" class="cancel-button">취소</button>
              </div>
            </div>

            <div
              v-if="comment.replies && comment.replies.length > 0"
              class="replies-list"
            >
              <div
                v-for="reply in comment.replies"
                :key="reply.id"
                class="comment-item is-reply"
              >
                <div class="comment-author">
                  {{ reply.authorName || reply.authorId || "익명" }}
                  <div class="comment-info">
                  <span>{{ formatDate(reply.createdAt) }}</span>

                  <template
                    v-if="currentUser && currentUser.uid === reply.authorId"
                  >
                    <button
                      @click="startEditComment(reply)"
                      class="action-button edit-comment-button"
                    >
                      수정
                    </button>
                    <button
                      @click="deleteComment(postId, reply.id)"
                      class="action-button delete-comment-button"
                    >
                      삭제
                    </button>
                  </template>
                </div>
                </div>

                <div
                  v-if="editingCommentId === reply.id"
                  class="edit-comment-form nested"
                >
                  <textarea v-model="editingCommentText"></textarea>
                  <div class="form-actions">
                    <button @click="saveEditedComment">저장</button>
                    <button @click="cancelEditComment" class="cancel-button">
                      취소
                    </button>
                  </div>
                </div>
                <div v-else class="comment-text">
                  <span class="reply-indicator">→</span>
                  {{ reply.text }}
                </div>

                
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-comments-message">
          <p>아직 댓글이 없습니다.</p>
        </div>

        <div
          v-if="currentUser && !replyingToCommentId && !editingCommentId"
          class="add-comment-form"
        >
          <textarea
            v-model="newCommentText"
            placeholder="댓글을 입력하세요"
          ></textarea>
          <button @click="addComment">댓글 작성</button>
        </div>
        <div
          v-else-if="!currentUser && !replyingToCommentId && !editingCommentId"
          class="login-prompt"
        >
          댓글을 작성하려면 로그인하세요.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getAuth } from "firebase/auth";

// boardService에서 필요한 함수들을 import 합니다.
import {
  getPostById,
  addCommentToPost,
  deletePost, // 게시글 삭제
  deleteComment, // <-- 댓글 삭제 함수 import (boardService에 구현 필요)
  updateComment, // <-- 댓글 수정 함수 import (boardService에 구현 필요)
} from "@/services/boardService";

// Firestore SDK 함수 import (조회수 업데이트 및 댓글 실시간 리스닝에 필요)
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
// @/firebase 에서 db 인스턴스 import
import { db } from "@/firebase";

const route = useRoute();
const router = useRouter();
const postId = route.params.id;

const post = ref(null);
const loading = ref(true);
const currentUser = ref(null); // 현재 로그인 사용자 정보

const newCommentText = ref(""); // 새 댓글/답글 입력 내용
const comments = ref([]); // 최상위 댓글과 그 안에 답글 배열을 포함하는 구조

// 댓글 실시간 리스너 해제 함수
let unsubscribeComments = null;

// 현재 답글 작성 중인 댓글의 ID를 저장 (null이면 최상위 댓글 작성 모드)
const replyingToCommentId = ref(null);

// --- 댓글 수정 모드 관련 상태 변수 ---
const editingCommentId = ref(null); // <-- 수정 중인 댓글/답글의 ID
const editingCommentText = ref(""); // <-- 수정 중인 댓글/답글의 내용

// Firestore에 저장된 category 값과 화면 표시용 한글 이름을 매핑하는 객체
const categoryDisplayNameMap = {
  free: "자유게시판",
  route: "루트",
  market: "중고마켓",
};

// category 값을 받아 한글 표시 이름으로 변환하는 함수
const getCategoryDisplayName = (categoryValue) => {
  return categoryDisplayNameMap[categoryValue] || categoryValue;
};

// 카테고리 목록 페이지로 이동하는 함수
const goToCategoryList = () => {
  // post 데이터가 로드되었고 category 값이 있을 때만 실행
  if (post.value && post.value.category) {
    // /board 라우트로 이동하면서 post.category 값을 'category' 쿼리 파라미터로 전달
    router.push({ path: "/board", query: { category: post.value.category } });
  } else {
    // 만약 post 데이터나 category가 없다면 기본 게시판 목록으로 이동
    router.push("/board");
  }
};

// 게시글 데이터 가져오는 함수 (boardService 사용)
const fetchPost = async () => {
  loading.value = true;
  try {
    const fetchedPost = await getPostById(postId);
    post.value = fetchedPost;

    // *** 게시글 조회수 증가 로직 추가 ***
    // 게시글 정보를 성공적으로 가져온 후 조회수를 증가시킵니다.
    if (post.value) {
      const postRef = doc(db, "posts", postId); // 해당 게시글 문서 참조 가져오기
      try {
        // updateDoc과 increment 함수를 사용하여 views 필드를 원자적으로 1 증가
        await updateDoc(postRef, {
          views: increment(1), // increment 함수는 여기서 사용됩니다.
        });
        console.log(`게시글 ${postId} 조회수 1 증가 완료.`);
        // views 필드가 실시간으로 업데이트되므로 화면에도 곧 반영됩니다.
        // post.value.views 값을 클라이언트 측에서 즉시 업데이트할 수도 있습니다.
        // if(post.value.views !== undefined) {
        //   post.value.views++; // 화면 표시 값을 즉시 증가 (선택 사항)
        // } else {
        //   post.value.views = 1; // views 필드가 없었다면 1로 초기화 (선택 사항)
        // }
      } catch (updateError) {
        console.error("조회수 업데이트 오류:", updateError);
        // 조회수 업데이트 오류는 사용자에게 치명적이지 않으므로 alert는 보통 하지 않습니다.
      }
    }
  } catch (error) {
    console.error("게시글 가져오기 오류:", error);
    // 오류 처리 로직
    post.value = null; // 게시글 없음 상태로 설정
  } finally {
    loading.value = false;
  }
};

// 특정 게시글의 댓글 목록을 실시간으로 가져오는 함수 (답글 관계 처리)
const listenForComments = (postId) => {
  console.log(`게시글 ${postId} 댓글 리스닝 시작`);
  const commentsCollectionRef = collection(db, "posts", postId, "comments");

  // 쿼리: createdAt 기준 오름차순 정렬
  // 답글도 동일한 컬렉션에 저장되고 createdAt으로 정렬하여 가져온 후,
  // 클라이언트 측에서 parentId를 보고 관계를 구성합니다.
  const q = query(commentsCollectionRef, orderBy("createdAt", "asc"));

  unsubscribeComments = onSnapshot(
    q,
    (snapshot) => {
      console.log("댓글 스냅샷 업데이트 감지");
      const allComments = []; // 모든 댓글 (최상위 + 답글) 임시 저장
      snapshot.forEach((doc) => {
        allComments.push({ id: doc.id, ...doc.data(), replies: [] }); // replies 배열 추가
      });

      const commentMap = {}; // 댓글 ID를 키로 댓글 객체를 저장하는 맵
      allComments.forEach((comment) => {
        commentMap[comment.id] = comment;
      });

      const topLevelComments = []; // 최상위 댓글만 저장할 배열

      allComments.forEach((comment) => {
        if (comment.parentId) {
          // parentId가 있는 댓글 (답글)
          const parent = commentMap[comment.parentId];
          if (parent) {
            // 부모 댓글을 찾으면 부모의 replies 배열에 추가
            parent.replies.push(comment);
            // 답글들은 부모 댓글의 replies 배열 안에서 다시 createdAt 순으로 정렬 (선택 사항)
            // parent.replies.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
          } else {
            // 부모 댓글을 찾을 수 없는 답글 (예: 부모 댓글이 삭제된 경우)
            console.warn(
              `부모 댓글 ${comment.parentId}를 찾을 수 없습니다. 답글 ID: ${comment.id}`
            );
            // 필요하다면 고아 답글 처리 로직 추가 (예: 최상위로 표시 등)
            // topLevelComments.push(comment); // 고아 답글을 최상위로 표시하려면 이 라인 활성화
          }
        } else {
          // parentId가 없는 댓글 (최상위 댓글)
          topLevelComments.push(comment);
        }
      });

      // 최상위 댓글 배열을 comments 반응형 변수에 할당
      // 답글들은 해당 최상위 댓글 객체의 replies 배열 안에 포함됩니다.
      comments.value = topLevelComments;

      console.log(
        `게시글 ${postId} 댓글 데이터 업데이트 완료. 최상위 댓글 ${topLevelComments.length}개`
      );

      // TODO: 댓글 수 카운트 업데이트 로직 필요 (Firestore에서 comments 컬렉션의 문서 수를 세거나, 게시글 문서에 commentCount 필드를 업데이트)
      // 게시글 문서의 commentCount 필드를 업데이트하는 것이 더 효율적일 수 있습니다. (댓글 추가/삭제 시 트랜잭션 사용)
      // 현재는 comments.length를 사용하여 화면에 표시합니다.
    },
    (error) => {
      console.error("댓글 리스닝 오류:", error);
      // 댓글 로딩 중 오류 발생 시 처리
      alert("댓글을 불러오는 중 오류가 발생했습니다.");
    }
  );
};

// 댓글 추가 함수 (addCommentToPost 함수 사용 - 답글 기능 포함)
const addComment = async () => {
  if (!newCommentText.value.trim()) {
    alert(
      replyingToCommentId.value
        ? "답글 내용을 입력하세요."
        : "댓글 내용을 입력하세요."
    );
    return;
  }
  if (!currentUser.value) {
    alert("댓글을 작성하려면 로그인해야 합니다.");
    // TODO: 로그인 페이지로 리디렉션하거나 로그인 모달 띄우기
    return;
  }

  try {
    const commentData = {
      text: newCommentText.value.trim(),
      // boardService의 addCommentToPost 함수에서 authorId, authorName, createdAt 등을 추가합니다.
    };

    // 답글 작성 모드이면 parentId를 commentData에 추가
    if (replyingToCommentId.value) {
      commentData.parentId = replyingToCommentId.value; // 부모 댓글 ID 추가
    }

    console.log("댓글/답글 작성 요청:", commentData);

    // boardService의 addCommentToPost 함수 호출
    // addCommentToPost 함수는 댓글 문서 추가와 commentCount 증가 로직을 포함
    await addCommentToPost(postId, commentData, currentUser.value); // currentUser 전달 필요

    newCommentText.value = ""; // 입력 필드 초기화
    replyingToCommentId.value = null; // 답글 모드 해제

    console.log("댓글/답글 작성 요청 완료.");

    // TODO: 댓글 작성 완료 후 스크롤을 최신 댓글 위치로 이동 (선택 사항)
  } catch (error) {
    console.error("댓글/답글 작성 오류:", error);
    alert("댓글/답글 작성 중 오류가 발생했습니다.");
  }
};

// 답글 작성 모드 시작 (부모 댓글 ID 설정)
const startReply = (commentId) => {
  // 만약 현재 다른 댓글을 수정 중이라면 수정 모드 취소
  if (editingCommentId.value) {
    cancelEditComment();
  }
  replyingToCommentId.value = commentId; // 클릭된 댓글의 ID를 답글 작성 모드로 설정
  newCommentText.value = ""; // 입력 필드 초기화
  // 필요하다면 해당 댓글 위치로 스크롤 이동 (선택 사항)
};

// 답글 작성 모드 취소
const cancelReply = () => {
  replyingToCommentId.value = null; // 답글 모드 해제
  newCommentText.value = ""; // 입력 필드 초기화
};

// --- 댓글 수정 관련 함수 ---

// 댓글 수정 모드 시작 (댓글 정보 설정)
const startEditComment = (comment) => {
  // 만약 현재 답글 작성 모드라면 답글 작성 모드 취소
  if (replyingToCommentId.value) {
    cancelReply();
  }
  editingCommentId.value = comment.id; // 수정 중인 댓글 ID 설정
  editingCommentText.value = comment.text; // 수정 중인 댓글 내용 설정
  console.log(`댓글 ${comment.id} 수정 모드 시작. 내용: "${comment.text}"`);
  // TODO: 필요하다면 수정할 댓글 위치로 스크롤 이동 (선택 사항)
};

// 댓글 수정 내용 저장 (updateComment 함수 사용)
const saveEditedComment = async () => {
  const commentIdToEdit = editingCommentId.value;
  const updatedText = editingCommentText.value.trim();

  if (!updatedText) {
    alert("수정할 댓글 내용을 입력하세요.");
    return;
  }

  // 현재 로그인 사용자 == 댓글 작성자인지 다시 확인 (BoardDetailView.vue 리스너에서 authorId를 가져오므로 확인 가능)
  // 하지만 boardService의 updateComment 함수에서도 보안을 위해 작성자 확인 로직을 포함하는 것이 좋습니다.
  // 여기서는 일단 입력값 검사 후 서비스 함수 호출

  try {
    console.log(
      `댓글 ${commentIdToEdit} 수정 내용 저장 시도. 새로운 내용: "${updatedText}"`
    );
    // boardService의 updateComment 함수 호출 (댓글 ID와 수정된 내용 전달)
    await updateComment(postId, commentIdToEdit, updatedText); // <-- boardService에서 구현 필요

    console.log(`댓글 ${commentIdToEdit} 수정 완료.`);
    // 수정 완료 후 수정 모드 해제
    editingCommentId.value = null;
    editingCommentText.value = "";

    // TODO: 성공 메시지 표시 (선택 사항)
    // alert('댓글이 수정되었습니다.'); // 실시간 업데이트로 화면에 자동으로 반영됨
  } catch (error) {
    console.error(`댓글 ${commentIdToEdit} 수정 오류:`, error);
    alert("댓글 수정 중 오류가 발생했습니다.");
  }
};

// 댓글 수정 모드 취소
const cancelEditComment = () => {
  console.log(`댓글 ${editingCommentId.value} 수정 모드 취소.`);
  editingCommentId.value = null; // 수정 모드 해제
  editingCommentText.value = ""; // 입력 필드 초기화
};

// 게시글 삭제 함수 (boardService 사용)
const handleDelete = async () => {
  // 삭제 확인 컨펌
  if (!confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
    return;
  }
  // 삭제 권한 확인 (현재 사용자 == 게시글 작성자)
  if (
    !post.value ||
    !currentUser.value ||
    currentUser.value.uid !== post.value.authorId
  ) {
    alert("게시글 작성자만 삭제할 수 있습니다.");
    return;
  }

  try {
    console.log(`게시글 ${postId} 삭제 시도.`);
    // boardService의 deletePost 함수 호출 (이미지, 댓글, 게시글 문서 모두 삭제)
    await deletePost(postId); // boardService 함수 호출
    console.log("게시글 삭제 완료.");

    alert("게시글이 삭제되었습니다.");
    // 삭제 성공 후 게시글 목록 페이지로 이동
    router.push("/board");
  } catch (error) {
    console.error("게시글 삭제 오류:", error);
    alert("게시글 삭제 중 오류가 발생했습니다.");
  }
};

// 게시글 수정 페이지로 이동하는 함수
const handleEdit = () => {
  if (
    !post.value ||
    !currentUser.value ||
    currentUser.value.uid !== post.value.authorId
  ) {
    alert("게시글 작성자만 수정할 수 있습니다.");
    return;
  }
  console.log(`게시글 ${postId} 수정 페이지로 이동.`);
  // BoardWriteView.vue 페이지로 이동하면서 게시글 ID를 쿼리 파라미터로 전달
  router.push({ path: "/board/write", query: { id: postId } });
};

// 날짜 포맷팅 함수 (Timestamp 객체 또는 Date 객체 처리)
const formatDate = (timestamp) => {
  if (!timestamp) return "날짜 없음";
  // Firebase Timestamp 객체라면 toDate() 사용, Date 객체라면 바로 사용
  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);
  // toLocaleString()은 사용자의 로컬 시간대에 맞게 날짜와 시간을 포맷팅
  return date.toLocaleString();
};

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1);
};

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  // 현재 로그인 사용자 정보 가져오기
  const auth = getAuth();
  currentUser.value = auth.currentUser;
  console.log(
    "BoardDetailView mounted. Current User:",
    currentUser.value ? currentUser.value.uid : "None"
  );

  if (postId) {
    console.log(`BoardDetailView: 게시글 ID ${postId} 감지됨.`);
    await fetchPost(); // 게시글 상세 정보 가져오기
    listenForComments(postId); // 댓글 목록 실시간 리스닝 시작
  } else {
    console.error("게시글 ID가 라우트 파라미터에 없습니다.");
    router.replace("/board"); // 게시글 ID 없으면 게시판 목록으로 리다이렉션
  }
});

// 컴포넌트 언마운트 시 실행
onUnmounted(() => {
  // 댓글 실시간 리스너가 있다면 해제
  if (unsubscribeComments) {
    unsubscribeComments();
    console.log("댓글 Firestore 리스너 해제됨.");
  }
});
</script>

<style scoped>
/* 컨테이너 및 헤더 기본 스타일 */
.container {
  padding-left: 0;
  padding-right: 0;
}
.header {
  display: flex;
  align-items: center;
  padding: 0 10px; /* 헤더 좌우 패딩 */
  height: 50px; /* 헤더 높이 */
  border-bottom: 1px solid #eee;
  background-color: #fff;
}
.header__left .back-button {
  width: 50px; /* 버튼 영역 확보 */
  height: 50px; /* 버튼 영역 확보 */
  text-indent: -9999px;
  background: url(@/assets/images/common/ico_back.svg) no-repeat center center;
  background-size: 24px auto;
  border: 0;
  cursor: pointer;
}
.header h1 {
  flex-grow: 1; /* 제목이 남은 공간 차지 */
  text-align: center;
  font-size: 18px; /* 제목 폰트 크기 */
  margin: 0; /* 제목 기본 마진 제거 */
}
.header__right {
  width: 50px; /* 우측 더미 공간 확보 (삭제 버튼 자리) */
}

/* 게시글 내용 영역 스타일 */
.post-content {
  text-align: left; /* 본문 정렬 */
  width: 100%;
  padding-bottom: 20px; /* 하단 여백 추가 */
}

.post-content-head {
  padding: 15px 20px 10px 20px; /* 상하좌우 패딩 */
  font-size: 22px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  /* padding-bottom: 10px; 이미 위에서 설정 */
}
.post-content-head-cate {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 14px;
  text-decoration: none;
  color: #005fec;
}
.post-content-head > h2 {
  padding-bottom: 18px; /* 제목 아래 패딩 */
  font-size: 24px;
  margin: 0; /* h2 기본 마진 제거 */
}

/* 작성자 정보 스타일 */
.post-content-info {
  position: relative;
  padding-left: 50px; /* 프로필 이미지 공간 확보 */
  gap: 15px; /* 항목 간 간격 */
}
.post-content-info .profile {
  width: 40px;
  height: 40px;
  border-radius: 100%;
  overflow: hidden;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 0;
  background: #ededed; /* 기본 배경색 */
}
/* 기본 프로필 아이콘 스타일 */
.post-content-info .profile:before {
  content: "";
  display: block;
  position: absolute;
  width: 80%;
  height: 80%;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #cbcbcb; /* 아이콘 색상 */
  /* mask-image 경로 확인 */
  -webkit-mask-image: url(@/assets/images/common/ico_menu_user.svg);
  mask-image: url(@/assets/images/common/ico_menu_user.svg);
  -webkit-mask-size: cover;
  mask-size: cover;
}
.post-content-info .profile > img {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 2; /* 이미지 위에 표시 */
  object-fit: cover; /* 이미지를 채우도록 */
}
.post-content-info .name {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin: 0; /* 기본 마진 제거 */
}
.post-content-info .info {
  font-size: 13px; /* 정보 폰트 크기 조정 */
  color: #888;
  margin: 5px 0 0 0; /* 기본 마진 제거 */
}
.post-content-info .info > span {
  display: inline-block;
  margin-left: 15px;
}

/* 게시글 본문 스타일 */
.content-body {
  margin-top: 20px;
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap; /* 줄바꿈 및 공백 유지 */
  word-break: break-word; /* 긴 단어 자동 줄바꿈 */
  padding: 0 20px; /* 좌우 패딩 */
}
.content-body .img {
  text-align: center;
  margin-bottom: 20px; /* 이미지 아래 여백 */
}
.content-body .img > img {
  max-width: 100%; /* 이미지가 컨테이너 넘지 않도록 */
  height: auto; /* 높이 자동 */
  display: block; /* 이미지 하단 미세 여백 제거 */
  margin: 0 auto; /* 가운데 정렬 */
}

/* 작성자에게 보이는 수정/삭제 버튼 스타일 */
.post-actions {
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽으로 정렬 */
  gap: 10px; /* 버튼 사이 간격 */
  padding: 40px 20px; /* 상하좌우 패딩 */
  border-bottom: 1px solid #eee; /* 하단 구분선 */
}
.post-actions button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}
.post-actions .edit-button {
  background-color: #fff;
  border:1px solid #e1e1e1;
}
.post-actions .delete-button {
  background-color: #a7a7a7; /* 빨간색 */
  color: white;
}

/* 댓글 섹션 스타일 */
.comments-section {
  margin-top: 30px; /* 게시글 내용과의 간격 */
  /* border-top: 1px solid #eee; */ /* post-actions 아래에 이미 선 있음 */
  padding: 0 20px 0 20px; /* 좌우 패딩 */
}

.comments-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  margin-top: 0; /* h3 기본 마진 제거 */
}

.comment-list {
  margin-top: 15px;
}

.comment-item {
  border-bottom: 1px solid #eee;
  padding-bottom: 9px;
  margin-bottom: 15px; /* 다음 댓글 항목과의 간격 */
}

.comment-item.is-reply {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 0 7px 7px 0;
  border-bottom: 0;
  margin-bottom: 0;
  margin-top: 5px;
  border-radius: 5p;
}
.comment-item.is-reply .comment-text{
  margin-bottom: 0;
}
.comment-author {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-text {
  margin-bottom: 8px;
  line-height: 1.5;
  color: #555;
  white-space: pre-wrap; /* 줄바꿈 및 공백 유지 */
  word-break: break-word; /* 긴 단어 자동 줄바꿈 */
  margin-top: 7px;
}

.comment-info {
  font-size: 12px;
  color: #888;
  text-align: right;
  display: flex; /* 정보를 가로로 배치 */
  justify-content: flex-end; /* 오른쪽 정렬 */
  gap: 5px; /* 항목 간 간격 */
  align-items: center; /* 세로 중앙 정렬 */
}
.comment-info > span:first-child {
  margin-right: 10px;
  font-weight: normal;
}
/* 답글 달기, 수정, 삭제 버튼 공통 스타일 */
.comment-info .action-button {
  background: none;
  border: 1px solid #ccc;
  padding: 2px 6px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  color: #555;
  transition: all 0.2s ease;
}
.comment-info .action-button:hover {
  background-color: #eee;
}

/* 답글 버튼 */
.comment-info .reply-button {
  /* 위 .action-button 스타일 상속 */
}
/* 수정 버튼 */
.comment-info .edit-comment-button {
  color: rgb(19, 177, 56);
}
/* 삭제 버튼 */
.comment-info .delete-comment-button {
  color: #c82333;
}

.no-comments-message {
  text-align: center;
  color: #b9b9b9;
  font-style: italic;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.login-prompt {
  margin-top: 15px;
  font-style: italic;
  color: #777;
}

/* 댓글/답글 입력 폼 (최상위, 답글, 수정 공통) */
.add-comment-form,
.edit-comment-form {
  /* <-- edit-comment-form 추가 */
  margin-top: 15px;
  display: flex;
  gap: 10px; /* 입력 필드와 버튼 그룹 사이 간격 */
  padding-bottom: 20px; /* 하단 여백 추가 */
  border-bottom: 1px solid #eee; /* 아래 구분선 */
}
.add-comment-form textarea,
.edit-comment-form textarea {
  /* <-- textarea 선택자 추가 */
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;
  font-size: 14px;
}
/* 입력 폼 액션 (버튼 그룹) */
.add-comment-form .form-actions,
.edit-comment-form .form-actions {
  /* <-- .form-actions 선택자 추가 */
  display: flex;
  justify-content: flex-end; /* 버튼을 오른쪽으로 정렬 */
  gap: 10px; /* 버튼 사이 간격 */
}
.add-comment-form button,
.edit-comment-form button {
  /* <-- button 선택자 추가 */
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #fff;
  background: #357ae8;
}
.add-comment-form button:first-child,
.edit-comment-form button:first-child {
  /* 작성/답글/저장 버튼 */
  background-color: #007bff;
  color: white;
}
.add-comment-form .cancel-button,
.edit-comment-form .cancel-button {
  /* 취소 버튼 */
  background-color: #ddd;
  color: #333;
}

/* 답글 입력/수정 폼 (nested) 스타일 */
.add-comment-form.nested,
.edit-comment-form.nested {
  /* <-- .edit-comment-form.nested 추가 */
  margin-top: 10px;
  padding: 15px;
  background-color: #eef7ff;
  border: 0;
  border-radius: 7px;
}

/* 답글 목록 (nested) 스타일 - 이 부분은 comment-item.is-reply 의 padding-left로 대체될 수 있음 */
/* .replies-list {
    margin-top: 10px;
    padding: 0 0 0 10px;
} */

/* 답글 항목 스타일 */
/* .comment-item.is-reply 스타일은 위에 통합 */

/* 답글 표시 화살표 */
.reply-indicator {
  margin-right: 5px;
  font-weight: bold;
  color: #007bff;
}

/* 로딩 및 찾을 수 없음 메시지 스타일 */
.loading,
.not-found {
  text-align: center;
  font-size: 18px;
  color: #777;
  margin-top: 50px;
}
</style>