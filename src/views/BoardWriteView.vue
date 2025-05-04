<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>{{ pageTitle }}</h1>

      <div class="header__right"></div>
    </div>

    <div v-if="isSubmitting" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>저장 중...</p>
    </div>

    <div class="form-section">
      <div class="form-group">
        <label for="category">카테고리</label>
        <select id="category" v-model="category" :disabled="!!editingPostId || route.query.category === 'route'">
          <option value="" disabled>카테고리를 선택하세요</option>
          <option value="free">자유게시판</option>
          <option value="route">루트</option>
          <option value="market">중고마켓</option>
        </select>
      </div>

      <div class="form-group">
        <label for="title">제목</label>
        <input
          type="text"
          id="title"
          v-model="title"
          placeholder="제목을 입력하세요"
        />
      </div>

      <div class="form-group">
        <label for="content">내용</label>
        <textarea
          id="content"
          v-model="content"
          placeholder="내용을 입력하세요"
        ></textarea>
      </div>

      <div class="form-group">
        <label>이미지 첨부</label>
        <input
          type="file"
          id="image"
          ref="imageInputRef"
          @change="handleImageUpload"
          accept="image/*"
        />
        <label for="image" class="btn-img" v-if="!imageUrlPreview"></label>

        <div v-if="imageUrlPreview" class="image-preview">
          <img :src="imageUrlPreview" alt="Image preview" />
          <button
              @click="selectedImageFile ? removeImage() : removeExistingImage()"
              class="remove-image-button">
              X
           </button>
        </div>
      </div>

      <input type="hidden" v-model="linkedRouteUrl">


      <button v-if="!isSubmitting" @click="submitPost" class="submit-button">
        완료
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getAuth } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/firebase";

import { getPostById, updatePost } from "@/services/boardService"; // boardService 경로 확인

import imageCompression from "browser-image-compression";

const category = ref("");
const title = ref("");
const content = ref("");
const selectedImageFile = ref(null);
const imageUrlPreview = ref(null);
const isSubmitting = ref(false);
const isUploadingImage = ref(false);

const editingPostId = ref(null);
const originalPost = ref(null);
const pageTitle = ref("게시글 작성");

const imageInputRef = ref(null);

const router = useRouter();
const route = useRoute(); // 현재 루트 정보 (쿼리 파라미터 포함) 가져오기

// ✅ 링크 정보 저장용 ref 추가
const linkedRouteUrl = ref(null);

onMounted(async () => {
  // 수정 모드인지 확인 (params.id 사용)
  const id = route.params.id; // 수정 모드는 params.id로 판단

  // ✅ 쿼리 파라미터 확인 및 필드 초기값 설정
  console.log("[BoardWriteView] Component mounted. Route query:", route.query);

  // 카테고리 쿼리 파라미터 처리
  if (route.query.category) {
      // 쿼리 파라미터로 넘어온 카테고리 값으로 초기값 설정
      // RouteDetailView에서 'route' 값을 넘기도록 수정했다면 여기서도 'route'를 기대합니다.
      // 드롭다운 옵션의 value 값과 일치해야 합니다.
      const queryCategory = route.query.category;
      const validCategories = ['free', 'route', 'market']; // 드롭다운 옵션 value와 일치하는 유효한 카테고리 목록
      if (validCategories.includes(queryCategory)) {
          category.value = queryCategory;
          console.log(`[BoardWriteView] 카테고리 초기값 설정됨: ${queryCategory}`);
      } else {
           console.warn(`[BoardWriteView] 유효하지 않은 카테고리 쿼리 파라미터: ${queryCategory}`);
      }
  }

   // 링크 정보 쿼리 파라미터 처리
   if (route.query.linkedRouteUrl) {
       linkedRouteUrl.value = route.query.linkedRouteUrl;
       console.log(`[BoardWriteView] 링크 정보 초기값 설정됨: ${linkedRouteUrl.value}`);
       // 필요하다면 사용자에게 이 링크 정보를 보여줄 수도 있습니다.
   }


  // ✅ 수정 모드 로직 (기존 코드 유지)
  if (id) {
    editingPostId.value = id;
    pageTitle.value = "게시글 수정";
    try {
      // 게시글 수정 시에는 쿼리 파라미터로 넘어온 카테고리/링크 정보를 무시하고
      // 기존 게시글 데이터를 불러와서 필드를 채우는 것이 일반적입니다.
      // 따라서 위 쿼리 파라미터 처리 로직은 수정 모드 (id가 있는 경우)에는
      // 적용되지 않거나, 적용하더라도 기존 데이터를 덮어쓰도록 해야 합니다.
      // 현재 코드에서는 id가 있을 때 아래 로직이 실행되어 쿼리 파라미터 값은 무시됩니다.

      const postToEdit = await getPostById(id);
      if (postToEdit) {
        originalPost.value = postToEdit;
        category.value = postToEdit.category;
        title.value = postToEdit.title;
        content.value = postToEdit.content;
        // 수정 모드 시 기존 게시글에 링크 정보가 있다면 그것도 불러옵니다.
        linkedRouteUrl.value = postToEdit.linkedRouteUrl || null; // 기존 링크 정보 로드
        if (postToEdit.imageUrl) {
          imageUrlPreview.value = postToEdit.imageUrl; // 기존 이미지 URL을 미리보기에 설정
        }
         console.log(`[BoardWriteView] 수정 모드 - 기존 게시글 정보 로드됨 (ID: ${id}). 기존 링크 정보: ${linkedRouteUrl.value}`);

      } else {
        alert("수정할 게시글을 찾을 수 없습니다.");
        router.replace("/board");
      }
    } catch (error) {
      console.error("게시글 로드 오류:", error);
      alert("게시글을 불러오는 중 오류가 발생했습니다.");
      router.replace("/board");
    }
  } else {
     // 작성 모드 - 쿼리 파라미터로 넘어온 카테고리/링크 정보로 초기값 설정 완료.
     console.log("[BoardWriteView] 작성 모드.");
  }
});

const goBack = () => {
  router.go(-1);
};

// 이미지 파일 선택 핸들러 (기존 코드 유지)
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    // 파일 선택 취소 또는 파일 없을 때
    // editingPostId가 있고 originalPost.imageUrl이 있고 selectedImageFile이 null이면 기존 이미지 미리보기를 복구
    if (
      editingPostId.value &&
      originalPost.value &&
      originalPost.value.imageUrl &&
      !selectedImageFile.value // 새로 파일 선택하다 취소한 경우 selectedImageFile은 null이 됨
    ) {
      imageUrlPreview.value = originalPost.value.imageUrl; // 기존 이미지 미리보기 복구
    } else {
      imageUrlPreview.value = null; // 그 외 경우 (새 글 작성 중 취소 등) 미리보기 초기화
    }
    selectedImageFile.value = null;
    if (imageInputRef.value) {
      imageInputRef.value.value = "";
    }
    console.log("이미지 파일 선택 취소 또는 파일 없음.");
    return; // 파일이 없으면 여기서 함수 종료
  }

  console.log("원본 파일 크기:", file.size / 1024 / 1024, "MB");

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };

  isUploadingImage.value = true; // 이미지 처리 시작 알림
  isSubmitting.value = true; // 이미지 처리 중에도 전체 로딩 표시
  console.log("이미지 압축 시작...");

  try {
    const compressedFile = await imageCompression(file, options);
    console.log("압축된 파일 크기:", compressedFile.size / 1024 / 1024, "MB");

    selectedImageFile.value = compressedFile;

    // FileReader 로딩을 Promise로 감싸서 await로 대기
    const imageUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(compressedFile);
    });

    imageUrlPreview.value = imageUrl; // FileReader 로딩 완료 후 미리보기 업데이트

    console.log("이미지 압축 및 미리보기 업데이트 완료.");
  } catch (error) {
    console.error("이미지 처리 오류:", error);
    alert("이미지 처리 중 오류가 발생했습니다.");
    selectedImageFile.value = null;
    imageUrlPreview.value = null;
    if (imageInputRef.value) {
      imageInputRef.value.value = "";
    }
  } finally {
    isUploadingImage.value = false; // 이미지 처리 종료
    isSubmitting.value = false; // 이미지 처리 완료 후 전체 로딩 해제
  }
};

// 이미지 제거 핸들러 (기존 코드 유지)
const removeImage = () => {
  selectedImageFile.value = null;
  imageUrlPreview.value = null;
  if (imageInputRef.value) {
    imageInputRef.value.value = "";
  }
  console.log("새 이미지 선택 취소.");

  if (
    editingPostId.value &&
    originalPost.value &&
    originalPost.value.imageUrl
  ) {
    imageUrlPreview.value = originalPost.value.imageUrl;
    console.log("기존 이미지 미리보기 복구됨.");
  }
};

// 기존 이미지 제거 핸들러 (기존 코드 유지)
const removeExistingImage = () => {
  selectedImageFile.value = null;
  imageUrlPreview.value = null;
  if (imageInputRef.value) {
    imageInputRef.value.value = "";
  }
  console.log("기존 이미지 제거 요청됨.");
};

// ✅✅✅ 게시글 제출 함수 수정 (링크 정보 포함) ✅✅✅
const submitPost = async () => {
  if (!category.value) {
    alert("카테고리를 선택하세요.");
    return;
  }
  if (!title.value.trim()) {
    alert("제목을 입력하세요.");
    return;
  }
  if (!content.value.trim()) {
    alert("내용을 입력하세요.");
    return;
  }

  isSubmitting.value = true; // 최종 제출 시작 로딩

  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    alert("로그인 후 게시글을 작성/수정할 수 있습니다.");
    isSubmitting.value = false;
    return;
  }

  let imageUrl = originalPost.value ? originalPost.value.imageUrl : null;

  // 이미지 URL 결정 및 Storage 처리 로직 (기존 코드 유지)
  if (selectedImageFile.value) {
    console.log("새 이미지 감지됨. 업로드 시도.");
    isUploadingImage.value = true;
    try {
      const storagePath = `posts_images/${user.uid}/${Date.now()}_${
        selectedImageFile.value.name
      }`;
      const imageRef = storageRef(storage, storagePath);
      const uploadResult = await uploadBytes(imageRef, selectedImageFile.value);
      imageUrl = await getDownloadURL(uploadResult.ref);
      console.log("새 이미지 업로드 성공, URL:", imageUrl);

      if (
        editingPostId.value &&
        originalPost.value &&
        originalPost.value.imageUrl &&
        originalPost.value.imageUrl !== imageUrl
      ) {
        console.log(
          "기존 이미지 Storage에서 삭제 시도:",
          originalPost.value.imageUrl
        );
        try {
          const oldImageUrl = originalPost.value.imageUrl;
          const pathStartIndex = oldImageUrl.indexOf("/o/") + 3;
          const pathEndIndex = oldImageUrl.indexOf("?");
          let imagePathEncoded;
          if (pathEndIndex !== -1) {
            imagePathEncoded = oldImageUrl.substring(
              pathStartIndex,
              pathEndIndex
            );
          } else {
            imagePathEncoded = oldImageUrl.substring(pathStartIndex);
          }
          const imagePath = decodeURIComponent(imagePathEncoded);
          const imageStorageRef = storageRef(storage, imagePath);

          await deleteObject(imageStorageRef);
          console.log("기존 이미지 Storage 삭제 성공.");
        } catch (storageDeleteError) {
          console.error("기존 이미지 Storage 삭제 오류:", storageDeleteError);
        }
      }
    } catch (storageError) {
      console.error("새 이미지 업로드 오류:", storageError);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      isSubmitting.value = false;
      isUploadingImage.value = false;
      return;
    } finally {
      isUploadingImage.value = false;
    }
  } else if (
    editingPostId.value &&
    originalPost.value &&
    originalPost.value.imageUrl &&
    imageUrlPreview.value === null
  ) {
    console.log("기존 이미지 삭제 요청 감지됨. Storage에서 삭제 시도.");
    try {
      const oldImageUrl = originalPost.value.imageUrl;
      const pathStartIndex = oldImageUrl.indexOf("/o/") + 3;
      const pathEndIndex = oldImageUrl.indexOf("?");
      let imagePathEncoded;
      if (pathEndIndex !== -1) {
        imagePathEncoded = oldImageUrl.substring(pathStartIndex, pathEndIndex);
      } else {
        imagePathEncoded = oldImageUrl.substring(pathStartIndex);
      }
      const imagePath = decodeURIComponent(imagePathEncoded);
      const imageStorageRef = storageRef(storage, imagePath);

      await deleteObject(imageStorageRef);
      imageUrl = null;
      console.log("기존 이미지 Storage 삭제 성공 및 imageUrl null 설정.");
    } catch (storageError) {
      console.error("기존 이미지 Storage 삭제 오류:", storageError);
      imageUrl = null;
      alert("기존 이미지 삭제 중 오류가 발생했습니다.");
    }
  } else {
    imageUrl = originalPost.value ? originalPost.value.imageUrl : null;
    console.log("이미지 변경 없음. 기존 URL 사용:", imageUrl);
  }


  // Firestore에 게시글 데이터 저장 또는 업데이트
  const postData = {
    category: category.value,
    title: title.value.trim(),
    content: content.value.trim(),
    imageUrl: imageUrl, // 최종 결정된 이미지 URL
    // ✅ 링크 정보 추가
    linkedRouteUrl: linkedRouteUrl.value || null, // linkedRouteUrl 값이 있으면 포함, 없으면 null
    // 작성자 정보, 생성 시간 등은 작성 시에만 설정
    ...(editingPostId.value
      ? {} // 수정 모드에서는 추가하지 않음
      : {
          authorId: user.uid,
          authorName: user.displayName || user.email || "익명",
          createdAt: serverTimestamp(),
          views: 0,
          commentCount: 0,
        }),
  };

  try {
    if (editingPostId.value) {
      // 수정 모드: 게시글 업데이트
      console.log(
        `게시글 ${editingPostId.value} 업데이트 시도. 데이터:`,
        postData
      );
      // boardService의 updatePost 함수 호출 (Storage 이미지 삭제 로직 포함)
      // updatePost 함수도 linkedRouteUrl 필드를 처리할 수 있도록 수정 필요
      await updatePost(
        editingPostId.value,
        postData,
        originalPost.value ? originalPost.value.imageUrl : null
      );
      console.log(`게시글 ${editingPostId.value} 업데이트 완료.`);
      alert("게시글이 수정되었습니다.");

      router.push(`/board/${editingPostId.value}`); // 수정 완료 후 해당 게시글 상세로 이동
    } else {
      // 작성 모드: 새 게시글 추가
      console.log("새 게시글 작성 시도. 데이터:", postData);
      // boardService의 createPost 함수를 사용하도록 변경 가능
      // linkedRouteUrl은 여기서 addDoc에 바로 포함됩니다.
      const newPostRef = await addDoc(collection(db, "posts"), postData); // addDoc 직접 호출
      console.log("새 게시글 작성 완료. ID:", newPostRef.id);
      alert("게시글이 작성되었습니다.");

      router.push("/board"); // 목록 페이지로 이동 (가장 일반적)
      // 또는 router.push(`/board/${newPostRef.id}`); // 작성 후 해당 글 상세로 이동
    }
  } catch (error) {
    console.error("게시글 저장 오류:", error);
    alert("게시글 저장 중 오류가 발생했습니다.");
  } finally {
    isSubmitting.value = false; // 최종 제출 종료 로딩 해제
  }
};
</script>

<style scoped>
.content {
  width: 100%;
  position: relative;
}

.write-form {
  flex-grow: 1; /* 폼이 남은 공간을 차지하도록 */
  overflow-y: auto; /* 내용이 넘치면 스크롤 */
}
.form-section {
  width: 100%;
}
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group textarea {
  min-height: 200px; /* 내용 입력 필드 최소 높이 */
  resize: vertical; /* 세로 방향으로만 크기 조절 가능 */
}

.submit-button {
  display: block; /* 버튼을 블록 요소로 만들어 전체 너비 차지 */
  width: 100%;
  padding: 15px;
  font-size: 18px;
  font-weight: bold;
  color: white;
  background-color: #4caf50; /* 초록색 배경 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 30px;
}

.submit-button:hover {
  background-color: #45a049;
}

.form-group > select {
  width: 100%;
  border: 0;
  border-bottom: 1px solid #ccc;
  padding: 10px 10px 10px 0;
}

#image {
  display: none;
}
#image + label {
  display: flex;
  border: 1px solid #eee;
  background: #f7f7f7;
  border-radius: 5px;
  height: 80px;
  position: relative;
  justify-content: center;
  align-items: center;
}
#image + label:before {
  content: "";
  width: 40px;
  height: 40px;
  display: block;
  background-color: #c7c7c7;
  -webkit-mask-image: url(@/assets/images/common/ico_img.svg);
  mask-image: url(@/assets/images/common/ico_img.svg);
  -webkit-mask-size: cover;
}

.image-preview {
  border: 1px solid #eee;
  background: #f7f7f7;
  border-radius: 5px;
  padding: 15px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.image-preview > img {
  max-width: 100%;
}
.btn-imgDel {
  position: absolute;
  width: 20px;
  height: 20px;
  padding-bottom: 2px;
  background: #222;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 100%;
  top: 4px;
  right: 4px;
  border: 0;
}

/* --- 이미지 업로드 로딩 오버레이 스타일 --- */
.loading-overlay {
  position: fixed; /* 화면 전체 고정 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* 반투명 검정색 배경 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 다른 요소들 위에 표시 */
  color: white; /* 로딩 텍스트 색상 */
  font-size: 18px;
}

.loading-spinner {
  /* 간단한 로딩 스피너 예시 (CSS 애니메이션 사용) */
  border: 4px solid #f3f3f3; /* 밝은 회색 테두리 */
  border-top: 4px solid #3498db; /* 파란색 상단 테두리 */
  border-radius: 50%; /* 원형 */
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite; /* 1초 동안 회전 애니메이션 무한 반복 */
  margin-bottom: 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 로딩 텍스트 */
.loading-overlay p {
  margin: 0; /* p 태그 기본 마진 제거 */
}

.remove-image-button {
  position: absolute;
  right: 5px;
  top: 5px;
  width: 20px;
  height: 20px;
  border-radius: 100%;
  border: 1px solid #fff;
  background: #222;
  color: #fff;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>