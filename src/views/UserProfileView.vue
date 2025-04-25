<template>
    <div class="container">
      <div class="header">
        <button class="back-button" @click="goBack">←</button>
        <h1>회원 정보</h1>
         <div class="header__right"></div>
      </div>
  
      <div v-if="loading" class="loading-message">로딩 중...</div>
  
      <div v-else class="profile-content">
        <div v-if="!isEditing" class="display-mode">
          <h2>{{ userStore.name || userStore.email || '사용자' }}</h2>
  
          <div class="profile-photo-area">
             <img
              v-if="userStore.profileImageUrl"
              :src="userStore.profileImageUrl"
              alt="프로필 사진"
              class="profile-photo-display"
            />
            <div v-else class="profile-photo-placeholder-display">👤</div>
          </div>
  
          <p>{{ userStore.email || '이메일 없음' }}</p>
          <p v-if="userStore.isCurrentUserAdmin"><strong>권한:</strong> 관리자</p>
  
          <button @click="startEditing" class="edit-button">정보 수정</button>
        </div>
  
        <div v-else class="edit-mode">
          <h2>회원 정보 수정</h2>
  
           <div class="profile-photo-area">
              <img
                v-if="profileImagePreviewUrl || userStore.profileImageUrl"
                :src="profileImagePreviewUrl || userStore.profileImageUrl"
                alt="프로필 사진 미리보기"
                class="profile-photo-display"
              />
               <div v-else class="profile-photo-placeholder-display">👤</div>
           </div>
  
           <div class="file-upload-container">
              <label for="profile-image-upload" class="upload-button">사진 변경</label>
              <input
                  type="file"
                  id="profile-image-upload"
                  accept="image/*"
                  @change="handleImageUpload"
                  hidden
              />
               <span v-if="selectedFileName" class="selected-file-name">{{ selectedFileName }}</span>
           </div>
  
  
          <div class="form-group">
            <label for="name">닉네임:</label>
            <input type="text" id="name" v-model="editableName" />
          </div>
  
          <div class="form-group">
            <label>이메일:</label>
            <p class="email-display">{{ userStore.email || '이메일 정보 없음' }}</p>
          </div>
  
  
          <div class="form-actions">
            <button @click="saveProfile" class="save-button">저장</button>
            <button @click="cancelEdit" class="cancel-button">취소</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user'; // Pinia 스토어 임포트

// Firebase 관련 SDK 임포트
import { getAuth, updateProfile } from 'firebase/auth'; // Firebase Auth 프로필 업데이트 함수
// deleteObject 임포트를 제거합니다. (이전 답변에서 이미 제거했지만, 혹시 남아있다면 삭제)
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL /*, deleteObject */ } from 'firebase/storage'; // Firebase Storage
import { doc, updateDoc } from 'firebase/firestore'; // Firestore 문서 업데이트
import { db } from '@/firebase'; // Firebase 설정 파일에서 db 인스턴스 임포트 (Storage도 firebase에서 가져올 수 있음)


const router = useRouter();
const userStore = useUserStore();

// --- Reactive State ---
const loading = ref(true); // 로딩 상태 (데이터 로드 또는 저장 중)
const isEditing = ref(false); // 현재 수정 모드인지 여부
const editableName = ref(''); // 수정 폼에 바인딩될 닉네임
const profileImageFile = ref(null); // 사용자가 새로 선택한 이미지 파일 객체
const profileImagePreviewUrl = ref(null); // 선택된 이미지 파일의 미리보기 URL
const selectedFileName = ref(''); // 선택된 파일 이름 (UI 표시용)


// --- Methods ---

// 뒤로가기 함수
const goBack = () => {
  router.go(-1);
};

// 수정 모드 시작 함수
const startEditing = () => {
  isEditing.value = true; // isEditing 상태를 true로 변경하여 수정 폼 표시
  // 수정 모드 시작 시 현재 스토어에 있는 사용자 정보로 입력 필드 초기화
  editableName.value = userStore.name || '';
  // 파일 선택 및 미리보기 상태 초기화 (기존 이미지가 있다면 미리보기에 표시)
  profileImageFile.value = null;
  profileImagePreviewUrl.value = userStore.profileImageUrl; // 미리보기는 현재 프로필 이미지로 시작
  selectedFileName.value = '';
};

// 수정 모드 취소 함수
const cancelEdit = () => {
  // 사용자에게 변경 사항이 저장되지 않음을 알릴지 선택 가능
  // if (confirm('변경 사항이 저장되지 않습니다. 취소하시겠습니까?')) {
       isEditing.value = false; // isEditing 상태를 false로 변경하여 정보 표시 모드로 돌아감
       // 수정 모드 취소 시 입력 내용 및 미리보기 초기화 (원래 값으로 되돌림)
       editableName.value = userStore.name || userStore.email || ''; // 취소 시 원래 이름/이메일로 되돌림
       profileImageFile.value = null;
       profileImagePreviewUrl.value = userStore.profileImageUrl; // 미리보기를 원래 프로필 이미지로 되돌림
       selectedFileName.value = '';
  // }
};

// 이미지 파일 선택 input에서 파일 선택 시 호출되는 함수
const handleImageUpload = (event) => {
  const file = event.target.files[0]; // 선택된 파일 가져오기
  if (file) {
    // 파일 크기 또는 타입 제한 검사 추가 가능
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택 가능합니다.');
        event.target.value = ''; // input 값 초기화
        profileImageFile.value = null;
        profileImagePreviewUrl.value = userStore.profileImageUrl; // 잘못된 파일 선택 시 기존 이미지로 돌아감
        selectedFileName.value = '';
        return;
    }
     // 필요 시 파일 크기 제한 추가 (예: 5MB)
    // const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    // if (file.size > MAX_SIZE) {
    //     alert('파일 크기가 너무 큽니다. (최대 5MB)');
    //     event.target.value = '';
    //     profileImageFile.value = null;
    //     profileImagePreviewUrl.value = userStore.profileImageUrl; // 파일 크기 초과 시 기존 이미지로 돌아감
    //     selectedFileName.value = '';
    //     return;
    // }


    profileImageFile.value = file; // 선택된 파일 저장
    selectedFileName.value = file.name; // 파일 이름 저장

    // 선택된 이미지 파일의 미리보기 URL 생성 (FileReader 사용)
    const reader = new FileReader();
    reader.onload = (e) => {
      profileImagePreviewUrl.value = e.target.result; // 미리보기 URL 업데이트
    };
    reader.readAsDataURL(file); // 파일을 Data URL로 읽어오기
  } else {
      // 파일 선택 취소 또는 오류 시 상태 초기화
      profileImageFile.value = null;
      profileImagePreviewUrl.value = userStore.profileImageUrl; // 취소 시 기존 이미지로 돌아감
      selectedFileName.value = '';
  }
};


// 프로필 정보 저장 (수정) 함수 - 비동기 처리
const saveProfile = async () => {
  // 입력값 검증 (예: 닉네임이 비어있는지 등)
  if (!editableName.value.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
  }

  loading.value = true; // 저장 시작 시 로딩 상태 true

  try {
    const auth = getAuth();
    const user = auth.currentUser; // 현재 로그인된 Firebase Auth 사용자 객체 가져오기

    if (!user) {
      alert('로그인 상태가 아닙니다. 다시 로그인해주세요.');
      router.push('/login'); // 비로그인 상태면 로그인 페이지로 이동
      return;
    }

    let newPhotoURL = userStore.profileImageUrl; // 업데이트할 프로필 이미지 URL 초기값 (기존 URL)


    // 1. 새로운 프로필 이미지가 선택되었다면 Firebase Storage에 업로드
    if (profileImageFile.value) {
       console.log("새 프로필 이미지 업로드 시작:", profileImageFile.value.name);
        try {
             const storage = getStorage(); // Firebase Storage 인스턴스
             // 프로필 이미지 저장 경로 설정: avatars/{사용자UID}/고유파일명 (예: timestamp_파일명)
             // --- FIX: Remove backslashes from template literal ---
             // Line 209: 중괄호와 점 앞의 백슬래시 제거
             const storagePath = `avatars/${user.uid}/${Date.now()}_${profileImageFile.value.name}`; // <-- 수정된 줄
             // ----------------------------------------------------
             // --- FIX: Rename local variable to avoid potential conflict ---
             // 임포트된 storageRef 함수와 구분하기 위해 지역 변수 이름 변경
             const storageFileRef = storageRef(storage, storagePath); // Storage 참조 생성 (imported storageRef 사용) // <-- 변수 이름 변경
             // ----------------------------------------------------


             // 이미지 파일 업로드 시작
             console.log("Storage에 파일 업로드 중...");
             // --- FIX: Use the new variable name ---
             // 변경된 변수 이름 사용
             const uploadResult = await uploadBytes(storageFileRef, profileImageFile.value); // 파일 업로드 실행 // <-- 수정된 부분
             // ------------------------------------
             console.log("업로드 성공, 다운로드 URL 가져오는 중...");
             newPhotoURL = await getDownloadURL(uploadResult.ref);
             console.log("프로필 이미지 업로드 및 URL 가져오기 성공. URL:", newPhotoURL);

             // TODO: (선택 사항) 기존 프로필 이미지가 Storage에 있다면 삭제하는 로직 추가 (deleteObject 사용)
             // deleteOldProfileImage(originalPhotoURL); // 이 함수는 따로 구현 필요

        } catch (storageError) {
             console.error("프로필 이미지 업로드 오류:", storageError);
             alert("프로필 이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
             loading.value = false; // 로딩 해제
             return; // 업로드 실패 시 저장 중단
        }
    } else {
        // 새로운 이미지를 선택하지 않았을 경우, 기존 이미지를 유지 (newPhotoURL = originalPhotoURL)
        // 만약 '사진 삭제' 기능을 구현한다면 여기서 newPhotoURL을 null로 설정하는 로직 필요
    }


    // 2. Firebase Authentication 사용자 프로필 업데이트 (displayname 및 photoURL)
    // Auth 프로필은 클라이언트에서 직접 업데이트 가능하며, 즉시 적용됩니다.
    console.log("Firebase Auth 사용자 프로필 업데이트 시도...");
    await updateProfile(user, {
      displayName: editableName.value, // 수정된 닉네임으로 업데이트
      photoURL: newPhotoURL, // 새로 업로드된 이미지 URL 또는 기존 URL로 업데이트 (또는 null)
    });
    console.log("Firebase Auth 사용자 프로필 업데이트 완료.");


    // 3. Firestore 사용자 문서 업데이트 (사용자 문서에 닉네임과 사진 URL을 저장하는 경우)
    // userStore가 Firestore 문서의 username과 photoURL을 읽어와 표시한다면 이 단계가 필요합니다.
    // 사용자 문서의 UID는 Auth user 객체의 uid와 동일합니다.
    console.log("Firestore 사용자 문서 업데이트 시도...");
    try {
        const userDocRef = doc(db, 'users', user.uid); // 사용자 문서 참조 가져오기
        await updateDoc(userDocRef, {
            username: editableName.value, // username 필드 업데이트 (닉네임)
            photoURL: newPhotoURL // photoURL 필드 업데이트
            // 필요하다면 다른 필드도 업데이트 (예: updatedAt 등)
        });
        console.log("Firestore 사용자 문서 업데이트 완료.");

    } catch (firestoreError) {
         console.error("Firestore 사용자 문서 업데이트 오류:", firestoreError);
         // Firestore 업데이트 실패는 Auth 업데이트와 별개로 처리할 수 있습니다.
         // 사용자에게 알림을 주거나 로깅만 할 수 있습니다. (Auth 프로필 업데이트는 성공했으므로 치명적이지 않을 수 있음)
         alert("회원 정보 동기화 중 오류가 발생했습니다. 다시 시도해주세요.");
         // 계속 진행 (UI는 Auth 프로필을 따르고, 스토어 업데이트 시 Auth 정보를 사용하므로)
    }


    // 4. Pinia 스토어 상태 업데이트
    // Firebase Auth 프로필이 업데이트되면 userStore의 onAuthStateChanged 리스너에 의해 setUser 액션이 자동으로 호출됩니다.
    // 하지만 즉시 UI에 반영되도록 하려면 명시적으로 userStore.setUser를 호출하는 것이 좋습니다.
    // userStore의 setUser 액션은 업데이트된 auth.currentUser 객체를 인자로 받아 스토어 상태를 갱신합니다.
    // setUser 액션 내부에서 Firestore 문서도 다시 읽어와 스토어 상태가 완전히 동기화됩니다.
     console.log("userStore 상태 업데이트 시작...");
     const updatedUser = auth.currentUser; // 업데이트된 Auth user 객체 다시 가져오기
     await userStore.setUser(updatedUser); // userStore의 setUser 액션 호출 (비동기이므로 await)
     console.log("userStore 상태 업데이트 완료.");


    // 저장 성공 시 메시지 알림 및 수정 모드 종료
    console.log("프로필 정보 저장 완료.");
    alert("회원 정보가 성공적으로 수정되었습니다.");
    isEditing.value = false; // 수정 모드 종료

  } catch (error) {
    // 저장 과정 중 발생한 오류 처리
    console.error("프로필 정보 저장 중 예상치 못한 오류 발생:", error);
    alert("회원 정보 저장 중 오류가 발생했습니다.");
  } finally {
    loading.value = false; // 저장 완료 (성공 또는 실패) 시 로딩 상태 해제
  }
};

// TODO: (선택 사항) 기존 Storage 이미지 삭제 함수 구현 예시 (deleteObject 사용)
/*
async function deleteOldProfileImage(oldPhotoURL) {
  if (!oldPhotoURL || !oldPhotoURL.startsWith('https://firebasestorage.googleapis.com/')) {
    // Firebase Storage URL이 아니거나 없으면 삭제하지 않음
    return;
  }
  try {
    const storage = getStorage();
    // URL로부터 Storage 참조 경로 파싱 (구현에 따라 다를 수 있음)
    // deleteObject를 사용하려면 이 함수가 필요합니다.
    const storageRefToDelete = storageRef(storage, getPathStorageFromUrl(oldPhotoURL)); // storageRef 사용
    await deleteObject(storageRefToDelete); // deleteObject 사용
    console.log("기존 프로필 이미지 삭제 완료:", oldPhotoURL);
  } catch (error) {
    console.warn("기존 프로필 이미지 삭제 오류:", error);
    // 삭제 실패는 저장 실패로 이어지지 않도록 경고만 로깅
  }
}

// URL에서 Storage 경로를 추출하는 헬퍼 함수 (Storage URL 구조에 따라 다름)
// 이 함수는 deleteOldProfileImage 함수가 주석 해제될 때 필요합니다.
// function getPathStorageFromUrl(url){ ... }
*/


// Component mounted lifecycle hook
onMounted(async () => {
  console.log("UserProfileView mounted.");

   if (!userStore.isAuthenticated) {
       console.warn("비로그인 상태로 프로필 페이지 접근 시도. 로그인 페이지로 이동합니다.");
       router.push('/login');
       return; // 로그인 페이지로 이동 후 이 컴포넌트 로직 중단
   }

   console.log("Current User in store:", userStore.uid);

   // --- 디버깅: 마운트 시점의 userStore 상태 및 email 값 확인 ---
   console.log("UserProfileView Debug: userStore state on mount:", userStore); // userStore 전체 상태 로깅
   console.log("UserProfileView Debug: userStore.email on mount:", userStore.email); // userStore.email 값 로깅
   // ------------------------------------------------------------


   // 로그인 상태라면 현재 스토어의 사용자 정보로 입력 필드 및 표시 초기화
   console.log("Current User in store:", userStore.uid); // 이 줄은 위에 이미 있을 수 있습니다. 중복되면 하나만 남겨두세요.
   editableName.value = userStore.name || userStore.email || ''; // 이름 초기값 설정 (이름 없으면 이메일 사용)
   profileImagePreviewUrl.value = userStore.profileImageUrl; // 이미지 미리보기 초기값 설정 (현재 이미지)

  loading.value = false; // 초기 로딩 상태 해제
});

// --- Watchers (Optional) ---
// userStore의 상태 변화를 감지하여 editableName 등을 업데이트할 필요는 없을 수 있습니다.
// 수정 모드 시작 시 fetchPost처럼 데이터를 다시 불러오는 방식이 명확할 수 있습니다.
// 하지만 여기서는 mounted 시점의 값으로 초기화합니다.

</script>

<style scoped>
/* 컴포넌트 전체 컨테이너 스타일 */
.user-profile-container {
    padding: 0 20px; /* 좌우 패딩 */
    max-width: 600px; /* 최대 너비 설정 (PC 등 넓은 화면에서 중앙 정렬) */
    margin: 0 auto; /* 좌우 마진 auto로 중앙 정렬 */
}


/* 프로필 콘텐츠 영역 (정보 표시 또는 수정 폼) */
.profile-content {
    margin-top: 20px;
    padding-bottom: 40px; /* 하단 여백 */
}

/* 정보 표시 모드 스타일 */
.display-mode {
    text-align: center; /* 내용 중앙 정렬 */
}

.display-mode h2 {
    font-size: 24px;
    margin-bottom: 20px;
    color: #333;
}

/* 프로필 사진 표시 영역 (정보 표시/수정 모드 공통) */
.profile-photo-area {
    width: 120px; /* 사진 영역 너비 */
    height: 120px; /* 사진 영역 높이 */
    border-radius: 50%; /* 원형 */
    overflow: hidden; /* 넘치는 콘텐츠 숨김 */
    margin: 0 auto 20px auto; /* 상하 마진, 좌우 auto로 중앙 정렬, 하단 마진 */
    background-color: #eee; /* 기본 배경색 */
    display: flex; /* 내용 중앙 정렬 */
    justify-content: center;
    align-items: center;
    /* 필요 시 테두리 등 추가 스타일 */
    /* border: 1px solid #ccc; */
}

/* 표시 모드 실제 프로필 사진 스타일 */
.profile-photo-display {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 비율 유지하며 채우기 */
}

/* 표시 모드 프로필 사진 없을 때 기본 아이콘 스타일 */
.profile-photo-placeholder-display {
    font-size: 60px; /* 아이콘 크기 */
    color: #aaa; /* 아이콘 색상 */
}

/* 정보 표시 모드 텍스트 스타일 */
.display-mode p {
    font-size: 16px;
    margin-bottom: 10px;
    color: #555;
}
.display-mode p strong {
    font-weight: bold;
    margin-right: 5px;
    color: #333;
}

/* 정보 수정 버튼 스타일 */
.edit-button {
    background-color: #007bff; /* 파란색 배경 */
    color: white; /* 흰색 글자 */
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 20px; /* 상단 마진 */
    transition: background-color 0.2s ease;
}
.edit-button:hover {
    background-color: #0056b3;
}


/* 회원 정보 수정 모드 스타일 */
.edit-mode {
    /* text-align: center; /* 폼 요소를 중앙 정렬할 경우 */
}

.edit-mode h2 {
     font-size: 20px;
     margin-bottom: 20px;
     color: #333;
     text-align: center; /* 제목 중앙 정렬 */
}

/* 파일 선택 input과 label을 묶는 컨테이너 */
.file-upload-container {
    text-align: center; /* 파일 선택 관련 요소 중앙 정렬 */
    margin-bottom: 20px;
    display: flex; /* 라벨과 파일 이름 가로 정렬 */
    justify-content: center; /* 중앙 정렬 */
    align-items: center;
    gap: 10px; /* 라벨과 파일 이름 사이 간격 */
}

/* 사용자에게 보이는 '사진 변경' 버튼 (실제 input 아님) */
.upload-button {
    display: inline-block; /* inline-block으로 설정 */
    background-color: #6c757d; /* 회색 배경 */
    color: white; /* 흰색 글자 */
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease;
}
.upload-button:hover {
    background-color: #5a6268;
}

/* 선택된 파일 이름 표시 스타일 */
.selected-file-name {
    font-size: 14px;
    color: #555;
}


/* 폼 그룹 (라벨 + 입력 필드) */
.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block; /* 라벨을 블록 요소로 만들어 입력 필드 위에 오게 함 */
    font-weight: bold;
    margin-bottom: 5px;
    color: #333;
    font-size: 15px;
}

/* FIX: Corrected style rule - ensure closing brace is present and comments are correct */
.form-group input[type="text"],
.form-group input[type="email"] {
    width: 100%;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
}
/* End FIX */


/* 이메일 표시 p 태그 스타일 */
.form-group .email-display {
     padding: 10px;
     border: 1px solid #eee; /* 읽기 전용 필드처럼 보이게 */
     border-radius: 4px;
     background-color: #f8f9fa; /* 배경색 */
     color: #555;
     font-size: 16px;
}


/* 폼 액션 버튼 그룹 (저장, 취소) */
.form-actions {
    margin-top: 30px;
    text-align: center; /* 버튼 그룹 중앙 정렬 */
}

.form-actions button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    margin: 0 5px; /* 버튼 사이 간격 */
    transition: background-color 0.2s ease;
}

.save-button {
    background-color: #28a745; /* 녹색 배경 */
    color: white;
}
.save-button:hover {
    background-color: #218838;
}

.cancel-button {
    background-color: #dc3545; /* 빨간색 배경 */
    color: white;
}
.cancel-button:hover {
    background-color: #c82333;
}

/* 로딩 메시지 스타일 */
.loading-message {
    text-align: center;
    font-size: 18px;
    color: #777;
    margin-top: 50px;
}

</style>