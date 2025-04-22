<template>
    <div class="container">
      <div class="header">
        <div class="header__left">
          <button class="back-button" @click="goBack">←</button>
        </div>
        <h1>게시글 상세</h1>
        <div class="header__right"></div>
      </div>
  
      <template v-if="post">
          <div class="post-detail">
            <h2>{{ post.title }}</h2>
            <div class="post-meta">
              <span class="post-img">
                <img src="@/assets/images/contents/@thumb.png" alt="" />
              </span>
              <strong class="post-author">{{ post.authorName }}</strong>
              <span class="post-date"
                ><strong>{{ formatDate(post.createdAt) }}</strong></span
              >
              <span class="post-views"
                >조회 <strong>{{ post.views || 0 }}</strong></span
              >
            </div>
            <div class="post-content">
              <div v-html="post.content"></div>
            </div>
          </div>
  
          <div class="comments-section">
            <h3>댓글 ({{ comments.length }})</h3>
            <div v-if="comments.length > 0">
              <ul>
                <li
                  v-for="comment in comments"
                  :key="comment.id"
                  class="comment-item"
                >
                  <div class="comment-author">{{ comment.authorName }}</div>
                  <div class="comment-text">{{ comment.text }}</div>
                  <div class="comment-date">
                    {{ formatDate(comment.createdAt) }}
                    <button class="btn-reply" @click="toggleReplyForm(comment.id)">
                      답글쓰기
                    </button>
                  </div>
  
                  <ul
                    v-if="getReplies(comment.id).length > 0"
                    class="replies-list"
                  >
                    <li
                      v-for="reply in getReplies(comment.id)"
                      :key="reply.id"
                      class="comment-item reply-item"
                    >
                      <div class="comment-author">{{ reply.authorName }}</div>
                      <div class="comment-text">{{ reply.text }}</div>
                      <div class="comment-date">{{ formatDate(reply.createdAt) }}</div>
                    </li>
                  </ul>
  
                  <div
                    v-if="replyingToCommentId === comment.id"
                    class="comment-form reply-form"
                  >
                    <textarea
                      v-model="newReplyText"
                      placeholder="답글을 입력하세요"
                    ></textarea>
                    <button @click="addReply(comment.id)">답글 작성</button>
                  </div>
                </li>
              </ul>
            </div>
            <p v-else>댓글이 없습니다.</p>
  
            <div class="comment-form">
              <textarea
                v-model="newComment"
                placeholder="댓글을 입력하세요"
              ></textarea>
              <button @click="addComment">댓글 작성</button>
            </div>
          </div>
          <div class="btn-section" v-if="isAuthor">
            <button class="btn-modify" @click="handleModifyPost">수정</button>
            <button class="btn-del" @click="handleDeletePost">삭제</button>
          </div>
      </template>
  
      <div v-else>
          <p>게시글 로딩 중...</p>
          </div>
    </div>
  </template>
  
  <script setup>
  // 스크립트 부분은 이전 답변에서 수정된 내용 그대로 유지하면 됩니다.
  import { ref, onMounted, onUnmounted, computed } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { getPostDetail, addCommentToPost, deletePost } from "@/services/boardService";
  import { auth } from "@/firebase";
  
  const route = useRoute();
  const router = useRouter();
  
  const currentUser = ref(null);
  const post = ref(null); // 초기값을 null로 유지
  const allComments = ref([]);
  const newComment = ref("");
  const replyingToCommentId = ref(null);
  const newReplyText = ref("");
  
  const goBack = () => {
    router.go(-1);
  };
  
  const loadPostDetail = async (postId) => {
    console.log("Firebase에서 게시글 상세 데이터 로드 시도 (ID:", postId, ")");
    try {
      const result = await getPostDetail(postId);
      if (result) {
        post.value = result.post; // 데이터 로드 성공 시 post.value 업데이트
        allComments.value = result.comments;
      } else {
        // 게시글이 없는 경우
        post.value = null; // 명시적으로 null 설정 유지
        alert("게시글을 찾을 수 없습니다.");
        router.push("/board");
      }
    } catch (error) {
      console.error("게시글 로드 에러:", error);
      post.value = null; // 에러 발생 시 null 설정 유지
      alert("게시글을 불러오는 중 오류가 발생했습니다.");
      router.push("/board");
    }
  };
  
  const comments = computed(() => {
    return allComments.value.filter(comment => !comment.parentId);
  });
  
  const getReplies = (commentId) => {
    return allComments.value.filter(comment => comment.parentId === commentId);
  };
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const addComment = async () => {
    if (newComment.value.trim() === "") {
      alert("댓글 내용을 입력해주세요.");
      return;
    }
    if (!post.value?.id) {
        alert("게시글 정보가 없습니다."); // post가 null일 때 이미 이 체크에서 걸러짐
        return;
    }
    if (!currentUser.value) {
        alert("로그인 후 댓글을 작성할 수 있습니다.");
        return;
    }
  
    try {
      await addCommentToPost(post.value.id, newComment.value.trim());
      const result = await getPostDetail(post.value.id);
       if (result) {
         allComments.value = result.comments;
       }
      newComment.value = "";
      alert("댓글이 작성되었습니다.");
    } catch (error) {
      console.error("댓글 작성 에러:", error);
      alert("댓글 작성 중 오류가 발생했습니다: " + error.message);
    }
  };
  
  const addReply = async (parentCommentId) => {
    if (newReplyText.value.trim() === "") {
      alert("답글 내용을 입력해주세요.");
      return;
    }
    if (!post.value?.id) {
        alert("게시글 정보가 없습니다."); // post가 null일 때 이미 이 체크에서 걸러짐
        return;
    }
    if (!currentUser.value) {
        alert("로그인 후 답글을 작성할 수 있습니다.");
        return;
    }
  
    try {
      await addCommentToPost(post.value.id, newReplyText.value.trim(), parentCommentId);
       const result = await getPostDetail(post.value.id);
       if (result) {
         allComments.value = result.comments;
       }
      newReplyText.value = "";
      replyingToCommentId.value = null;
      alert("답글이 작성되었습니다.");
    } catch (error) {
      console.error("답글 작성 에러:", error);
      alert("답글 작성 중 오류가 발생했습니다: " + error.message);
    }
  };
  
  const toggleReplyForm = (commentId) => {
     if (!currentUser.value) {
        alert("로그인 후 답글을 작성할 수 있습니다.");
        return;
      }
    if (replyingToCommentId.value === commentId) {
      replyingToCommentId.value = null;
      newReplyText.value = "";
    } else {
      replyingToCommentId.value = commentId;
      newReplyText.value = "";
    }
  };
  
  const handleModifyPost = () => {
    const postId = post.value?.id;
    if (postId) { // post가 null이 아닐 때만 실행
      console.log("게시글 수정 페이지로 이동 (ID:", postId, ")");
      alert("게시글 수정 기능은 실제 라우트 이동으로 구현해야 합니다. (ID: " + postId + ")");
      // router.push(`/board/edit/${postId}`);
    } else {
      alert("게시글 정보를 불러오지 못했습니다. 수정할 수 없습니다.");
    }
  };
  
  const handleDeletePost = async () => {
    const postId = post.value?.id;
    if (!postId) { // post가 null이 아닐 때만 실행
      alert("게시글 정보를 불러오지 못했습니다. 삭제할 수 없습니다.");
      return;
    }
  
    if (confirm("정말 이 게시글을 삭제하시겠습니까?")) {
      try {
          await deletePost(postId);
          alert("게시글이 삭제되었습니다.");
          router.push("/board");
      } catch (error) {
          console.error("게시글 삭제 에러:", error);
          alert("게시글 삭제 중 오류가 발생했습니다: " + error.message);
      }
    } else {
      console.log("게시글 삭제가 취소되었습니다.");
    }
  };
  
  const isAuthor = computed(() => {
      // post가 null일 때는 authorId에 접근하지 않도록 안전하게 체크
      return post.value && currentUser.value && post.value.authorId === currentUser.value.uid;
  });
  
  let unsubscribeAuth = null;
  
  onMounted(() => {
    unsubscribeAuth = auth.onAuthStateChanged((user) => {
      currentUser.value = user;
       console.log("Firebase Auth 상태 변경:", user ? user.uid : "로그아웃");
       // 로그인 상태가 변경되면 게시글 정보가 로드되었는지 다시 확인하고 필요한 로직 수행 가능
       // (예: 수정/삭제 버튼 표시 업데이트 등 - computed 속성인 isAuthor가 알아서 반응함)
    });
  
    const postId = route.params.id;
    console.log("BoardDetailView mounted. 라우트 파라미터 ID:", postId);
  
    if (postId) {
      loadPostDetail(postId);
    } else {
      console.error("게시글 ID가 라우트 파라미터에 없습니다.");
      alert("잘못된 접근입니다.");
      router.push("/board");
    }
  });
  
  onUnmounted(() => {
     if (unsubscribeAuth) {
       unsubscribeAuth();
       console.log("Firebase Auth 리스너 해제");
     }
  });
  </script>
  
  <style scoped>
  /* 기존 스타일 유지 */
  
  /* post-detail과 comments-section이 flex-grow를 가질 수 있도록 부모 컨테이너의 높이를 설정 */
  .post-detail {
    flex-shrink: 0; /* 게시글 상세 내용은 스크롤되지 않도록 */
    width: 100%;
    text-align: left;
    border-bottom: 1px solid #eee;
    background-color: white;
    padding-bottom: 20px; /* 하단 여백 추가 */
    box-sizing: border-box;
  }
  
  .post-detail h2 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 22px;
    color: #333;
    word-break: break-word;
    padding: 0 20px;
  }
  
  .post-meta {
    font-size: 14px;
    color: #777;
    margin-bottom: 15px;
    border-bottom: 1px solid #eee;
    padding: 0 20px 20px 70px;
    position: relative;
    height: 54px;
  }
  
  .post-img {
    width: 40px;
    height: 40px;
    background: #e9e9e9;
    border-radius: 100%;
    overflow: hidden;
    display: block;
    position: absolute;
    left: 20px;
    top: -3px;
  }
  .post-img:before {
    content: "";
    display: block;
    position: relative;
    width: 100%;
    height: 100%;
    background: url(@/assets/images/common/ico_menu_user.svg) no-repeat center
      bottom;
    background-size: 70% auto;
    opacity: 0.15;
  }
  .post-img > img{
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  .post-author {
    font-weight: 500;
    color: #000;
    display: block;
    margin-bottom: 5px;
    font-size: 14px;
  }
  
  .post-meta span {
    font-size: 13px;
    color: #999;
  }
  .post-meta span strong {
    color: #222;
  }
  .post-meta span + span {
    margin-left: 10px;
  }
  
  .post-content {
    font-size: 16px;
    line-height: 1.6;
    color: #555;
    word-break: break-word;
    /* white-space: pre-wrap; */ /* v-html 사용 시 필요에 따라 조정 */
    padding: 0 20px; /* 좌우 패딩 조정 */
  }
  
  /* post.content 내 이미지 스타일 */
  
  
  .comments-section {
    width: 100%;
    background-color: white;
    margin-top: 20px; /* 게시글 상세와 댓글 섹션 사이 간격 조정 */
    text-align: left;
    flex-grow: 1; /* 댓글 섹션이 남은 공간을 차지하고 스크롤 */
    box-sizing: border-box;
  }
  
  .comments-section h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 18px;
    border-bottom: 1px solid #eee;
    padding: 0 20px 10px;
    color: #333;
  }
  
  .comments-section ul {
    list-style: none;
    padding: 0 20px;
    border:0;
  }
  
  .comment-item {
    border-bottom: 1px dotted #e0e0e0;
    padding: 10px 0;
    margin-bottom: 10px;
    font-size: 14px;
    color: #555;
    position: relative;
  }
  
  .comment-author {
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  .comment-text {
    word-break: break-word;
    margin-bottom: 5px; /* 날짜와의 간격 */
  }
  
  .comment-date {
    font-size: 12px;
    color: #999;
    margin-top: 7px;
  }
  
  .btn-reply {
    font-size: 12px;
    padding: 3px;
    border: 1px solid #e1e1e1;
    background: #fff;
    color: #666;
    border-radius: 5px;
    margin-left: 10px;
    cursor: pointer;
  }
  
  /* 대댓글 목록 스타일 */
  .replies-list {
    list-style: none;
    padding: 0;
    margin-top: 10px;
    border-top: 1px solid #eee; /* 대댓글 목록 상단 구분선 */
    padding-top: 10px;
    /* margin-left: 20px; */
  }
  
  .reply-item {
    background-color: #f9f9f9; /* 대댓글 배경색 */
    border: 1px solid #eee; /* 대댓글 테두리 */
    padding: 10px;
    margin-bottom: 0;
    border-radius: 4px;
  }
  .reply-item + .reply-item{
    margin-top: 10px;
  }
  
  .reply-item .comment-author {
  }
  .reply-item .comment-text {
  }
  .reply-item .comment-date {
    font-size: 11px; /* 대댓글 날짜 폰트 크기 조정 */
  }
  
  /* 댓글 및 대댓글 작성 폼 공통 스타일 */
  .comment-form {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-top: 1px solid #eee;
    padding: 15px 20px; /* 하단 패딩 추가 */
  }
  
  /* 대댓글 작성 폼 특정 스타일 */
  .reply-form {
    margin-top: 10px; /* 댓글 본문과의 간격 */
    padding: 10px 20px; /* 패딩 조정 */
    background-color: #f9f9f9; /* 배경색 */
    border: 1px solid #eee; /* 테두리 */
    border-radius: 4px;
    margin-bottom: 10px; /* 댓글 아이템 하단 간격 */
  }
  
  .comment-form textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #eaeced;
    background: #f5f6f8;
    border-radius: 4px;
    font-size: 14px;
    resize: vertical;
    min-height: 100px; /* 대댓글 폼 높이 조정 */
    box-sizing: border-box;
  }
  
  .comment-form button {
    align-self: flex-end;
    padding: 8px 15px;
    font-size: 14px;
    color: white;
    background-color: #007bff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .comment-form button:hover {
    background-color: #0056b3;
  }
  
  /* 전체 컨테이너 패딩 제거는 그대로 */
  .container {
    padding-left: 0;
    padding-right: 0;
  }
  </style>
  
  <style>
  .post-content .img{
    text-align: center;
  }
  .post-content .img img {
    max-width: 100%; /* 이미지가 부모 너비를 넘지 않도록 */
    height: auto;
    display: block; /* 이미지 하단 미세 공간 제거 */
    margin: 0 auto 15px auto; /* 중앙 정렬 및 하단 간격 */
  }
  .btn-section{display: flex; gap: 10px; width: 100%; padding: 20px 20px 0; border-top: 1px solid #eee;}
  .btn-section > button{
      align-self: flex-end;
    padding: 12px 15px;
    font-size: 15px;
    color: white;
    background-color: #535353;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    flex: 1;
  }
  .btn-modify{
      
  }
  .btn-del{
      background-color: #cf0000 !important;
  }
  </style>