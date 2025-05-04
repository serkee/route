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
            <img
              v-if="post.authorProfileImageUrl"
              :src="post.authorProfileImageUrl"
              alt="작성자 프로필 이미지"
              class="avatar-image"
            />
            <div v-else class="profile-photo-placeholder"></div>
          </span>
          <p class="name">{{ post.authorName || post.authorId || '익명' }}</p>
          <p class="info">
            {{ formatDate(post.createdAt) }}
            <span>조회수 {{ post.views }}</span>
          </p>
        </div>
      </div>
      <div class="post-link" v-if="post.linkedRouteUrl">
        <a :href="post.linkedRouteUrl" target="_blank" rel="noopener noreferrer">제안 경로 이동 ></a>
      </div>
      <div class="content-body">
        <div v-if="post.imageUrl" class="img">
          <img :src="post.imageUrl" :alt="post.title + ' 이미지'" />
        </div>
        {{ post.content }}
      </div>

      <div
        v-if="post && currentUser && (currentUser.uid === post.authorId || userStore.isCurrentUserAdmin)"
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
                  v-if="currentUser && (currentUser.uid === comment.authorId || userStore.isCurrentUserAdmin)"
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
                    !comment.parentId && // 최상위 댓글이고
                    currentUser && // 로그인 상태이며
                    editingCommentId !== comment.id // 현재 이 댓글을 수정 중이 아닐 때
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
                      v-if="currentUser && (currentUser.uid === reply.authorId || userStore.isCurrentUserAdmin)"
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

// Firestore SDK 함수 import (조회수 업데이트 및 댓글 실시간 리스닝, 사용자 정보 조회에 필요)
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc, // Import doc for document reference
  updateDoc,
  increment,
  getDoc, // Import getDoc to fetch a single document
} from "firebase/firestore";
// @/firebase 에서 db 인스턴스 import
import { db } from "@/firebase";

// Pinia 스토어 임포트 (관리자 상태 확인을 위해 필요)
import { useUserStore } from "@/store/user"; // <-- useUserStore 임포트


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

// Pinia 스토어 인스턴스 (관리자 상태 확인에 사용)
const userStore = useUserStore(); // <-- userStore 인스턴스 가져오기


// Firestore에 저장된 category 값과 화면 표시용 한글 이름을 매핑하는 객체
const categoryDisplayNameMap = {
  free: "자유게시판",
  route: "루트",
  market: "중고마켓",
};

//category값을받아한글표시이름으로변환하는함수
function getCategoryDisplayName(categoryValue) {
  return categoryDisplayNameMap[categoryValue] || categoryValue;
}

// 카테고리 목록 페이지로 이동하는 함수
const goToCategoryList = () => {
  // post 데이터가 로드되었고 category 값이 있을 때만 실행
  if (post.value && post.value.category) {
    // /board 루트로 이동하면서 post.category 값을 'category' 쿼리 파라미터로 전달
    router.push({ path: "/board", query: { category: post.value.category } });
  } else {
    // 만약 post 데이터나 category가 없다면 기본 게시판 목록으로 이동
    router.push("/board");
  }
};

// 게시글 데이터 가져오는 함수 (boardService 사용 및 작성자 프로필 이미지 추가)
const fetchPost = async () => {
  loading.value = true;
  try {
    const fetchedPost = await getPostById(postId);

    if (fetchedPost) {
      post.value = fetchedPost;

      // ### 작성자 프로필 이미지 URL 및 이름 가져오기 ###
      // 게시글 데이터에 authorId가 있다면 사용자 정보 가져오기 시도
      if (post.value.authorId) {
        try {
          // 'users' 컬렉션에서 게시글 작성자의 UID와 동일한 문서 참조 가져오기
          const userDocRef = doc(db, 'users', post.value.authorId);
          // 해당 사용자 문서 가져오기
          const userDocSnap = await getDoc(userDocRef);

          // 사용자 문서가 존재하고 데이터가 있다면 photoURL과 이름 가져오기
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // 가져온 사용자 데이터에서 photoURL 필드를 게시글 객체에 추가 (템플릿에서 사용)
            post.value.authorProfileImageUrl = userData.photoURL;
            // 작성자 이름이 게시글 문서에 없거나 불완전할 경우 사용자 문서의 displayName/username 사용
            // 게시글 문서에 저장된 authorName이 우선이지만, 사용자 문서의 정보로 보완
             post.value.authorName = post.value.authorName || userData.displayName || userData.username || post.value.authorId || '익명';

            console.log("작성자 프로필 이미지 URL 가져옴:", post.value.authorProfileImageUrl);
            console.log("게시글 작성자 이름 (보완 후):", post.value.authorName);

          } else {
            // 사용자 문서를 찾을 수 없는 경우 경고 로깅
            console.warn(`작성자 사용자 문서 (ID: ${post.value.authorId})를 찾을 수 없습니다.`);
            post.value.authorProfileImageUrl = null; // URL을 null로 설정하여 이미지 숨김
             // 사용자 문서 없으면 게시글 문서에 있는 authorName 사용 또는 기본값
             post.value.authorName = post.value.authorName || post.value.authorId || '익명';
          }
        } catch (userFetchError) {
          // 사용자 데이터 가져오기 오류 발생 시 로깅
          console.error(`작성자 데이터 (ID: ${post.value.authorId}) 가져오기 오류:`, userFetchError);
            post.value.authorProfileImageUrl = null; // 오류 발생 시 URL을 null로 설정
           // 오류 발생 시 게시글 문서에 있는 authorName 사용 또는 기본값
           post.value.authorName = post.value.authorName || post.value.authorId || '익명';
        }
      } else {
          // 게시글에 작성자 ID가 없는 경우 경고 로깅 (필수 필드가 누락된 경우일 수 있음)
          console.warn("게시글 작성자 ID가 없습니다.");
          post.value.authorProfileImageUrl = null; // URL을 null로 설정
         // 작성자 ID 없으면 게시글 문서에 있는 authorName 사용 또는 기본값
         post.value.authorName = post.value.authorName || '익명';
      }

      // *** 게시글 조회수 증가 로직 ***
      // 게시글 정보를 성공적으로 가져온 후에만 조회수 증가 시도
      const postRef = doc(db, "posts", postId); // 해당 게시글 문서 참조 가져오기
      // 로그인된 사용자의 조회수만 증가시키거나, 중복 조회 방지 로직 추가 가능 (현재는 단순 증가)
      try {
        // updateDoc과 increment 함수를 사용하여 views 필드를 원자적으로 1 증가
        await updateDoc(postRef, {
          views: increment(1),
        });
        console.log(`게시글 ${postId} 조회수 1 증가 완료.`);
        // 화면에 즉시 반영하려면 post.value.views 값을 클라이언트 측에서 증가
          if(post.value.views !== undefined) {
            post.value.views++; // 화면 표시 값을 즉시 증가 (선택 사항)
          } else {
            post.value.views = 1; // views 필드가 없었다면 1로 초기화 (선택 사항)
          }

      } catch (updateError) {
        console.error("조회수 업데이트 오류:", updateError);
      }
    } else {
        // getPostById로 게시글을 찾을 수 없는 경우
        console.warn(`게시글 ID ${postId}를 찾을 수 없습니다.`);
        post.value = null; // 게시글 없음 상태로 설정
    }

  } catch (error) {
    console.error("게시글 가져오기 오류:", error);
    post.value = null; // 오류 발생 시 게시글 없음 상태로 설정
  } finally {
    loading.value = false; // 로딩 상태 해제
  }
};


// 특정 게시글의 댓글 목록을 실시간으로 가져오는 함수 (답글 관계 처리 및 작성자 정보 포함)
const listenForComments = (postId) => {
  console.log(`게시글 ${postId} 댓글 리스닝 시작`);
  // 해당 게시글 문서의 하위 컬렉션 'comments'에 대한 참조 가져오기
  const commentsCollectionRef = collection(db, "posts", postId, "comments");

  // 댓글 쿼리: 생성 시간(createdAt) 기준 오름차순 정렬
  const q = query(commentsCollectionRef, orderBy("createdAt", "asc"));

  // 실시간 리스너 설정
  unsubscribeComments = onSnapshot(
    q,
    async (snapshot) => { // async로 변경하여 사용자 데이터 비동기 처리 가능하게 함
      console.log("댓글 스냅샷 업데이트 감지");
      const allComments = []; // 모든 댓글 (최상위 + 답글) 임시 저장

      // 각 댓글 문서 데이터를 가져오면서 작성자 프로필 이미지 URL 및 이름 가져오기 시도
      for (const docSnapshot of snapshot.docs) {
        const commentData = { id: docSnapshot.id, ...docSnapshot.data(), replies: [] }; // replies 배열 추가

        // 댓글 작성자 프로필 이미지 URL 및 이름 가져오기
        if (commentData.authorId) {
          try {
            const userDocRef = doc(db, 'users', commentData.authorId);
            const userDocSnap = await getDoc(userDocRef); // 사용자 문서 비동기로 가져오기

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              commentData.authorProfileImageUrl = userData.photoURL; // 프로필 이미지 URL 추가
               // 댓글 작성자 이름이 댓글 문서에 없거나 불완전할 경우 사용자 문서의 displayName/username 사용
              commentData.authorName = commentData.authorName || userData.displayName || userData.username || commentData.authorId || '익명';
              console.log("댓글 작성자 이름 (보완 후):", commentData.authorName);

            } else {
              console.warn(`댓글 작성자 사용자 문서 (ID: ${commentData.authorId})를 찾을 수 없습니다.`);
              commentData.authorProfileImageUrl = null; // URL을 null로 설정
               // 사용자 문서 없으면 댓글 문서에 있는 authorName 사용 또는 기본값
               commentData.authorName = commentData.authorName || commentData.authorId || '익명';
            }
          } catch (userFetchError) {
             console.error(`댓글 작성자 데이터 (ID: ${commentData.authorId}) 가져오기 오류:`, userFetchError);
             commentData.authorProfileImageUrl = null; // 오류 발생 시 URL을 null로 설정
             // 오류 발생 시 댓글 문서에 있는 authorName 사용 또는 기본값
             commentData.authorName = commentData.authorName || commentData.authorId || '익명';
           }
          } else {
             console.warn("댓글 작성자 ID가 없습니다.");
             commentData.authorProfileImageUrl = null; // URL을 null로 설정
            // 작성자 ID 없으면 댓글 문서에 있는 authorName 사용 또는 기본값
            commentData.authorName = commentData.authorName || '익명';
          }
        allComments.push(commentData); // 데이터 가져오기가 완료된 댓글 객체 추가
      }


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
             // const sortFn = (a, b) => (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) - (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime());
             // parent.replies.sort(sortFn);
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
        `게시글 ${postId} 댓글 데이터 업데이트 완료. 최상위 댓글 ${topLevelComments.length}개, 총 댓글 ${allComments.length}개`
      );

      // TODO: 게시글 문서의 commentCount 필드를 업데이트하는 로직 필요 (댓글 추가/삭제 시 Cloud Functions 또는 트랜잭션 사용 권장)
      // 현재는 comments.length를 사용하여 화면에 댓글 총 개수를 표시합니다.
      // 게시글 문서에 commentCount 필드를 저장하는 것이 좋습니다.
    },
    (error) => {
      console.error("댓글 리스닝 오류:", error);
      // 댓글 로딩 중 오류 발생 시 처리
      alert("댓글을 불러오는 중 오류가 발생했습니다.");
      comments.value = []; // 오류 발생 시 댓글 목록 초기화
    }
  );
};

// 댓글 추가 함수 (addCommentToPost 함수 사용 - 답글 기능 포함)
const addComment = async () => {
  // 입력 내용 검사
  if (!newCommentText.value.trim()) {
    alert(
      replyingToCommentId.value
        ? "답글 내용을 입력하세요."
        : "댓글 내용을 입력하세요."
    );
    return;
  }
  // 로그인 상태 확인 (UI에서도 제어하지만 함수 시작 시 다시 확인)
  if (!currentUser.value) {
    alert("댓글/답글을 작성하려면 로그인해야 합니다.");
    // TODO: 로그인 페이지로 리다이렉션하거나 로그인 모달 띄우기
    return;
  }

  try {
    // 댓글 데이터 객체 생성
    const commentData = {
      text: newCommentText.value.trim(),
      // boardService의 addCommentToPost 함수에서 authorId, authorName, createdAt 등을 추가합니다.
      // 필요하다면 commentData에 다른 필드 추가 (예: authorProfileImageUrl 등)
    };

    // 답글 작성 모드이면 parentId를 commentData에 추가
    if (replyingToCommentId.value) {
      commentData.parentId = replyingToCommentId.value; // 부모 댓글 ID 추가
    }

    console.log("댓글/답글 작성 요청:", commentData);

    // boardService의 addCommentToPost 함수 호출 (게시글 ID, 댓글 데이터, 현재 사용자 정보 전달)
    // addCommentToPost 함수는 댓글 문서 추가와 게시글 commentCount 증가 로직을 포함 (boardService에 구현 필요)
    // currentUser.value 객체 전체 또는 필요한 정보(uid, displayName 등)만 전달
    await addCommentToPost(postId, commentData, currentUser.value);

    // 작성 완료 후 입력 필드 및 모드 초기화
    newCommentText.value = "";
    replyingToCommentId.value = null;

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
  newCommentText.value = ""; // 답글 입력 필드 초기화
  // 필요하다면 해당 댓글 위치로 스크롤 이동 (선택 사항)
};

// 답글 작성 모드 취소
const cancelReply = () => {
  replyingToCommentId.value = null; // 답글 모드 해제
  newCommentText.value = ""; // 입력 필드 초기화
};

// --- 댓글 수정 관련 함수 ---

// 댓글 수정 모드 시작 (선택된 댓글 정보 설정)
const startEditComment = (comment) => {
  // 만약 현재 답글 작성 모드라면 답글 작성 모드 취소
  if (replyingToCommentId.value) {
    cancelReply();
  }
  // 현재 사용자가 댓글 작성자 본인이거나 관리자인지 확인 (UI에서도 제어되지만 여기서도 확인)
  if (!currentUser.value || (currentUser.value.uid !== comment.authorId && !userStore.isCurrentUserAdmin)) {
      alert("댓글 수정 권한이 없습니다.");
      return; // 권한 없으면 함수 실행 중단
  }

  editingCommentId.value = comment.id; // 수정 중인 댓글 ID 설정
  editingCommentText.value = comment.text; // 수정 중인 댓글 내용 설정
  console.log(`댓글 ${comment.id} 수정 모드 시작. 내용: "${comment.text}"`);
  // TODO: 필요하다면 수정할 댓글 위치로 스크롤 이동 (선택 사항)
};

// 댓글 수정 내용 저장 (updateComment 함수 사용)
const saveEditedComment = async () => {
  const commentIdToEdit = editingCommentId.value; // 수정할 댓글의 ID
  const updatedText = editingCommentText.value.trim(); // 수정된 내용 (앞뒤 공백 제거)

  // 수정 내용 검사
  if (!updatedText) {
    alert("수정할 댓글 내용을 입력하세요.");
    return;
  }

  // 현재 로그인 사용자 == 댓글 작성자이거나 관리자인지 다시 확인 (Submit 시점)
  // startEditComment에서도 확인했지만, 저장 직전에도 다시 확인하는 것이 안전합니다.
   const commentToEdit = findCommentById(commentIdToEdit, comments.value); // comments 배열에서 해당 댓글 찾기
   if (!commentToEdit || !currentUser.value || (currentUser.value.uid !== commentToEdit.authorId && !userStore.isCurrentUserAdmin)) {
       alert("댓글 수정 권한이 없습니다.");
       // 수정 모드 초기화 후 종료
       editingCommentId.value = null;
       editingCommentText.value = "";
       return;
   }

   try {
  console.log(
   `댓글 ${commentIdToEdit} 수정 내용 저장 시도. 새로운 내용: "${updatedText}"`
  );
  // boardService의 updateComment 함수 호출 (게시글 ID, 댓글 ID, 수정된 내용 전달)
  // ✅ FIX: 세 번째 인자로 객체 { text: updatedText } 대신 문자열 updatedText 자체를 전달합니다.
  await updateComment(postId, commentIdToEdit, updatedText); // <-- 수정된 부분

  console.log(`댓글 ${commentIdToEdit} 수정 완료.`);
  // 수정 완료 후 수정 모드 해제 및 입력 필드 초기화
  editingCommentId.value = null;
  editingCommentText.value = "";

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

// 재귀적으로 댓글 및 답글 목록에서 특정 ID의 댓글/답글을 찾는 헬퍼 함수
// (saveEditedComment 함수에서 수정할 댓글 객체를 찾기 위해 사용)
function findCommentById(id, commentList) {
    for (const comment of commentList) {
        if (comment.id === id) {
            return comment; // 현재 댓글이 일치하면 반환
        }
        // 답글 목록이 있다면 재귀적으로 탐색
        if (comment.replies && comment.replies.length > 0) {
            const foundInReplies = findCommentById(id, comment.replies);
            if (foundInReplies) {
                return foundInReplies; // 답글에서 찾았으면 반환
            }
        }
    }
    return null; // 찾지 못함
}


// 게시글 삭제 함수 (boardService 사용)
const handleDelete = async () => {
  // 삭제 권한 확인 (현재 사용자 == 게시글 작성자이거나 관리자)
  if (
    !post.value || // 게시글 데이터가 없거나
    !currentUser.value || // 현재 사용자가 로그인되지 않았거나
    (currentUser.value.uid !== post.value.authorId && !userStore.isCurrentUserAdmin) // <-- 작성자 본인도 아니고 관리자도 아니면
  ) {
    alert("게시글 삭제 권한이 없습니다.");
    return; // 권한 없으면 함수 실행 중단
  }

  // 삭제 확인 컨펌
  if (!confirm("정말로 이 게시글을 삭제하시겠습니까? 이 게시글에 달린 모든 댓글과 답글도 함께 삭제됩니다.")) {
    return; // 사용자가 '취소'를 누르면 함수 실행 중단
  }

  try {
    console.log(`게시글 ${postId} 삭제 시도.`);
    // boardService의 deletePost 함수 호출 (이미지, 댓글 컬렉션, 게시글 문서 모두 삭제)
    // 이 함수는 게시글 ID만 인자로 받으며, 실제 삭제 로직은 boardService에서 구현됩니다.
    // boardService의 deletePost 함수 내부에서도 Firestore 보안 규칙을 통과해야 실제 삭제가 됩니다.
    await deletePost(postId); // <-- boardService에서 구현 필요
    console.log("게시글 삭제 완료.");

    // alert("게시글이 성공적으로 삭제되었습니다.");
    // 삭제 성공 후 게시글 목록 페이지로 이동
    router.push("/board");
  } catch (error) {
    console.error("게시글 삭제 오류:", error); // 삭제 중 오류 발생 시 로깅
    alert("게시글 삭제 중 오류가 발생했습니다."); // 사용자에게 오류 알림
  }
};

// 게시글 수정 페이지로 이동하는 함수
const handleEdit = () => {
  // 수정 권한 확인 (현재 사용자 == 게시글 작성자이거나 관리자)
  if (
    !post.value || // 게시글 데이터가 없거나
    !currentUser.value || // 현재 사용자가 로그인되지 않았거나
    (currentUser.value.uid !== post.value.authorId && !userStore.isCurrentUserAdmin) // <-- 작성자 본인도 아니고 관리자도 아니면
  ) {
    alert("게시글 수정 권한이 없습니다.");
    return; // 권한 없으면 함수 실행 중단
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
  // 현재 로그인 사용자 정보 가져오기 (getAuth().currentUser는 초기 인증 상태를 가져옵니다.)
  // Pinia userStore는 onAuthStateChanged 리스너에 의해 비동기적으로 업데이트됩니다.
  // UI 표시를 위해 초기 currentUser 값을 사용하지만, 관리자 권한은 userStore.isCurrentUserAdmin에 의존합니다.
  const auth = getAuth();
  currentUser.value = auth.currentUser;

  console.log(
    "BoardDetailView mounted. Current User UID:",
    currentUser.value ? currentUser.value.uid : "None"
  );
  // 디버그 로그 1: mounted 시점의 userStore.isCurrentUserAdmin 값
  console.log("BoardDetailView mounted DEBUG: userStore.isCurrentUserAdmin (initial):", userStore.isCurrentUserAdmin); // <-- 이 줄 추가


  if (postId) {
    console.log(`BoardDetailView: 게시글 ID ${postId} 감지됨. 데이터 가져오기 시작.`);
    // 게시글 상세 정보 가져오기 및 조회수 증가 (async 함수)
    await fetchPost();
    // 댓글 목록 실시간 리스닝 시작
    listenForComments(postId);
  } else {
    console.error("게시글 ID가 루트 파라미터에 없습니다.");
    router.replace("/board"); // 게시글 ID 없으면 게시판 목록으로 리다이렉션
  }

  // 디버그 로그 2: 데이터 로드 및 댓글 리스닝 시작 후의 userStore.isCurrentUserAdmin 값
  console.log("BoardDetailView Debug: userStore.isCurrentUserAdmin after data load:", userStore.isCurrentUserAdmin); // <-- 이 줄 추가
});

// 컴포넌트 언마운트 시 실행
onUnmounted(() => {
  // 댓글 실시간 리스너가 있다면 해제하여 메모리 누수 방지
  if (unsubscribeComments) {
    unsubscribeComments();
    console.log("댓글 Firestore 리스너 해제됨.");
  }
});
</script>

<style scoped>
/* 기존 스타일 유지 및 필요 시 추가/수정 */
.container{
  padding-left: 0;
  padding-right: 0;
}
/* 게시글 내용 영역 전체 스타일 */
.post-content {
  text-align: left;
  width: 100%;
}

/* 게시글 제목, 카테고리, 정보 포함 헤더 스타일 */
.post-content-head {
  padding: 0px 20px 10px 20px; /* 상하좌우 패딩 */
  font-size: 22px; /* 게시글 제목 크기 */
  margin-bottom: 10px; /* 본문과의 간격 */
  border-bottom: 1px solid #eee; /* 하단 구분선 */
}

/* 카테고리 링크 스타일 */
.post-content-head-cate {
  display: inline-block;
  margin-bottom: 14px; /* 제목과의 간격 */
  font-size: 14px;
  text-decoration: none;
  color: #005fec; /* 링크 색상 */
}
.post-content-head-cate:hover {
    text-decoration: underline; /* 호버 시 밑줄 */
}

/* 게시글 제목 스타일 */
.post-content-head > h2 {
  padding-bottom: 18px; /* 작성자 정보와의 간격 */
  font-size: 24px;
  margin: 0;
}

/* 작성자 정보 컨테이너 스타일 */
.post-content-info {
  position: relative;
  padding-left: 50px; /* 프로필 이미지 공간 확보 */
  display: flex; /* 이름과 정보가 프로필 이미지 옆에 오도록 */
  flex-direction: column; /* 이름과 정보는 세로로 쌓이도록 */
  justify-content: center; /* 세로 중앙 정렬 */
  min-height: 40px; /* 프로필 이미지 높이와 맞춤 */
}

/* 프로필 이미지 컨테이너 (span.profile) 스타일 */
.post-content-info .profile {
  width: 40px; /* 아바타 컨테이너 크기 */
  height: 40px; /* 아바타 컨테이너 크기 */
  border-radius: 100%; /* 원형 */
  overflow: hidden;
  display: block;
  position: absolute; /* post-content-info 기준으로 위치 설정 */
  top: 50%; /* 상단 50% 위치 */
  transform: translateY(-50%); /* 세로 중앙 정렬 */
  left: 0; /* 왼쪽 정렬 */
  background: #ededed; /* 기본 배경색 */
  /* 필요 시 border 추가 */
  /* border: 1px solid #ccc; */
}

/* 기본 프로필 아이콘 (이미지 없을 때 표시) 스타일 */
.post-content-info .profile-photo-placeholder {
  width: 80%;
    height: 80%;
    margin: 8px 0 0 4px;
    background-color: #b6b6b6;
    -webkit-mask-image: url(@/assets/images/common/ico_menu_user.svg);
    mask-image: url(@/assets/images/common/ico_menu_user.svg);
    -webkit-mask-size: cover;
}

/* .post-content-info .profile-photo-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    color: #cbcbcb;
    margin-top: 0;
} */
/* 기존 .profile:before 유사한 스타일을 여기에 적용 가능 */


/* 업로드된 프로필 이미지 (img.avatar-image) 스타일 */
.post-content-info .profile .avatar-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 비율 유지하며 컨테이너 꽉 채우기 (필요 시 잘림) */
  border-radius: 50%; /* 이미지를 원형으로 만듦 */
  position: relative;
  z-index: 2; /* 이미지가 Placeholder 아이콘 위에 오도록 */
}

/* 작성자 이름 스타일 */
.post-content-info .name {
  font-size: 15px;
  font-weight: 500;
  color: #222;
  margin: 0; /* 기본 마진 제거 */
}
/* 작성 시간 및 조회수 정보 스타일 */
.post-content-info .info {
  font-size: 13px;
  color: #888;
  margin: 5px 0 0 0; /* 이름과의 간격 */
}
.post-content-info .info > span {
  display: inline-block;
  margin-left: 15px; /* 작성 시간과의 간격 */
}

/* 게시글 본문 스타일 */
.content-body {
  margin-top: 20px; /* 작성자 정보와의 간격 */
  font-size: 16px;
  line-height: 1.6;
  white-space: pre-wrap; /* 공백 및 줄바꿈 유지 */
  word-break: break-word; /* 긴 단어 강제 줄바꿈 */
  padding: 0 20px 10px; /* 좌우 패딩 */
  /* border-bottom: 1px solid #eee; */
}
.content-body .img {
  text-align: center; /* 이미지 중앙 정렬 */
  margin-bottom: 20px; /* 내용과의 간격 */
}
.content-body .img > img {
  max-width: 100%; /* 컨테이너 너비를 넘지 않도록 */
  height: auto; /* 비율 유지 */
  display: block; /* 블록 요소 */
  margin: 0 auto; /* 중앙 정렬 */
}

/* 게시글 수정/삭제 버튼 영역 스타일 */
.post-actions {
  display: flex;
  justify-content: flex-end; /* 버튼들을 오른쪽으로 정렬 */
  gap: 10px; /* 버튼들 사이 간격 */
  padding: 20px; /* 패딩 */
  border-bottom: 1px solid #eee;
  margin-top: -1px;
  background: #fff;
}
.post-actions button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  /* flex: 1;  flex: 1을 주면 아이템들이 컨테이너 너비를 균등하게 나눕니다. 필요에 따라 조절하세요. */
  min-width: 80px; /* 최소 너비 설정 */
  text-align: center; /* 텍스트 중앙 정렬 */
  flex: 1;
}
.post-actions .edit-button {
  background-color: #fff;
  border:1px solid #e1e1e1; /* 테두리 */
  color: #555; /* 글자색 */
  transition: background-color 0.2s ease;
}
.post-actions .edit-button:hover {
    background-color: #f0f0f0;
}
.post-actions .delete-button {
  background-color: #dc3545; /* 빨간색 배경 */
  color: white; /* 글자색 */
  border: 1px solid #dc3545;
   transition: background-color 0.2s ease;
}
.post-actions .delete-button:hover {
     background-color: #c82333;
}


/* 댓글 섹션 전체 스타일 */
.comments-section {
  margin-top: 50px; /* 게시글 본문과의 간격 */
}

/* 댓글 섹션 제목 스타일 */
.comments-section h3 {
  font-size: 18px;
  margin-bottom: 15px;
  padding:0 20px 10px;
  border-bottom: 1px solid #eee;
  margin-top: 0;
}

/* 댓글 목록 컨테이너 스타일 */
.comment-list {
  margin-top: 15px; /* 제목과의 간격 */
}

/* 개별 댓글 항목 스타일 */
.comment-item {
  border-bottom: 1px solid #eee; /* 하단 구분선 */
  padding-bottom: 15px; /* 하단 패딩 */
  margin-bottom: 15px; /* 다음 댓글과의 간격 */
}

/* 답글 항목 스타일 (최상위 댓글과 구분) */
.comment-item.is-reply {
  padding: 15px; /* 패딩 */
  background-color: #f9f9f9; /* 배경색 */
  border-radius: 5px; /* 모서리 둥글게 */
  border-bottom: 0; /* 하단 보더 제거 */
  margin-bottom: 0; /* 다음 답글 또는 최상위 댓글과의 간격 제거 */
  margin-top: 10px; /* 부모 댓글 본문과의 간격 */
}
.comment-item.is-reply .comment-text {
    margin-top: 5px; /* 답글 텍스트와 작성자 정보와의 간격 */
    margin-bottom: 0; /* 답글 텍스트 하단 마진 제거 */
    padding: 0;
}
.comment-item.is-reply .comment-author{
  padding: 0;
}

/* 댓글/답글 작성자 정보 스타일 */
.comment-author {
  font-weight: bold;
  margin-bottom: 5px; /* 텍스트와의 간격 */
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center; /* 세로 중앙 정렬 */
  gap: 10px; /* 이름과 정보 사이 간격 */
  padding: 0 20px;
}

/* 댓글/답글 텍스트 스타일 */
.comment-text {
  margin-top: 5px; /* 작성자 정보와의 간격 */
  /* margin-bottom: 8px;*/
  line-height: 1.5;
  color: #555;
  white-space: pre-wrap; /* 공백 및 줄바꿈 유지 */
  word-break: break-word; /* 긴 단어 강제 줄바꿈 */
  padding: 0 20px;
}

/* 댓글/답글 정보 (작성 시간, 액션 버튼) 스타일 */
.comment-info {
  font-size: 12px;
  color: #888;
  text-align: right; /* 오른쪽 정렬 */
  display: flex;
  justify-content: flex-end; /* 오른쪽 끝 정렬 */
  gap: 5px; /* 버튼들 사이 간격 */
  align-items: center; /* 세로 중앙 정렬 */
  flex-wrap: wrap; /* 공간 부족 시 줄바꿈 */
}
.comment-info > span:first-child {
  margin-right: auto; /* 작성 시간과 버튼 그룹 사이에 최대한 공간 확보 */
  font-weight: normal;
  white-space: nowrap; /* 작성 시간 줄바꿈 방지 */
}

/* 답글 달기, 수정, 삭제 버튼 공통 스타일 */
.comment-info .action-button {
  background: none;
  border: 1px solid #ccc;
  padding: 0px 6px 1px;
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
  color: #007bff; /* 파란색 글자색 */
  border-color: #007bff; /* 파란색 테두리 */
}
.comment-info .reply-button:hover {
    background-color: #007bff;
    color: white;
}
/* 수정 버튼 */
.comment-info .edit-comment-button {
  color: rgb(19, 177, 56); /* 녹색 계열 */
  border-color: rgb(19, 177, 56);
}
.comment-info .edit-comment-button:hover {
     background-color: rgb(19, 177, 56);
     color: white;
}
/* 삭제 버튼 */
.comment-info .delete-comment-button {
  color: #dc3545; /* 빨간색 */
  border-color: #dc3545;
}
.comment-info .delete-comment-button:hover {
    background-color: #dc3545;
    color: white;
}


/* 댓글이 없을 때 메시지 스타일 */
.no-comments-message {
  text-align: center;
  color: #b9b9b9;
  font-style: italic;
  padding: 20px 0 40px;
  border-bottom: 1px solid #eee;
}

/* 댓글 작성 안내 메시지 (로그인 안 한 사용자에게 표시) */
.login-prompt {
  margin-top: 15px;
  font-style: italic;
  color: #777;
  text-align: center; /* 중앙 정렬 */
  padding-bottom: 20px; /* 하단 패딩 */
  border-bottom: 1px solid #eee; /* 하단 구분선 */
}


/* 댓글/답글 입력 폼 (최상위, 답글, 수정 공통) */
.add-comment-form,
.edit-comment-form {
  margin-top: 15px;
  display: flex;
  gap: 10px;
  padding: 0 20px;
}

.add-comment-form textarea,
.edit-comment-form textarea {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical; /* 세로 방향으로만 크기 조절 가능 */
  min-height: 60px; /* 최소 높이 */
  box-sizing: border-box; /* 패딩 및 보더 포함 */
  font-size: 14px;
  width: auto; /* 부모 요소 너비에 맞춤 */
  flex: 1;
}

/* 폼 내 액션 버튼 그룹 스타일 */
.form-actions {
  display: flex;
  justify-content: flex-end; /* 버튼들을 오른쪽으로 정렬 */
  gap: 10px; /* 버튼들 사이 간격 */
}

.add-comment-form button,
.edit-comment-form button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #fff;
  background: #007bff;
}

/* 폼 내 첫 번째 버튼 (주로 '작성' 또는 '저장') */
.add-comment-form button:first-child,
.edit-comment-form button:first-child {
  background-color: #007bff; /* 파란색 배경 */
  color: white;
   transition: background-color 0.2s ease;
}
.add-comment-form button:first-child:hover,
.edit-comment-form button:first-child:hover {
    background-color: #0056b3;
}

/* 취소 버튼 스타일 */
.add-comment-form .cancel-button,
.edit-comment-form .cancel-button {
  background-color: #ddd; /* 회색 배경 */
  color: #333; /* 어두운 글자색 */
   transition: background-color 0.2s ease;
}
.add-comment-form .cancel-button:hover,
.edit-comment-form .cancel-button:hover {
    background-color: #ccc;
}

/* 답글 입력/수정 폼 (nested) 스타일 */
.add-comment-form.nested,
.edit-comment-form.nested {
  margin-top: 10px;
  padding: 15px;
  background-color: #eef7ff; /* 연한 파란색 배경 */
  border: 0; /* 보더 제거 */
  border-radius: 7px;
  width: auto;
  margin: 10px 20px 0;
}

/* 답글 목록 컨테이너 스타일 */
.replies-list {
    margin-top: 10px; /* 부모 댓글 본문과의 간격 */
    padding: 0 20px;
    border-left: 2px solid #eee; /* 들여쓰기 시 시각적 구분선 */
}

/* 답글 항목 스타일 (comment-item.is-reply)는 위에 정의되어 있습니다. */

/* 답글 표시 화살표 스타일 */
.reply-indicator {
  margin-right: 5px;
  font-weight: bold;
  color: #007bff; /* 파란색 */
}

/* 로딩 및 찾을 수 없음 메시지 스타일 */
.loading,
.not-found {
  text-align: center;
  font-size: 18px;
  color: #777;
  margin-top: 50px;
}
.post-link{
  padding: 10px 20px 20px;
  border-bottom: 1px solid #eee;
}
.post-link a{
  font-weight: bold;
  color: #222;
  text-decoration: none;
}
</style>