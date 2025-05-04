<template>
  <div class="container">
    <h1>루트 관리</h1>

    <button class="add-route-button" @click="openAddFormModal">새 루트 추가</button>

    <RouteListView
      :routes="routes"
      :loading="loading"
      :error="fetchError"
      :formatDate="formatDate"
      @edit="handleEditRoute"
      @delete="confirmDeleteRoute"
    />

    <div v-if="showConfirmModal" class="modal-overlay">
        <div class="modal-content">
            <p>이 루트를 정말 삭제하시겠습니까?</p>
            <button @click="deleteRoute">확인</button>
            <button @click="cancelDelete">취소</button>
        </div>
     </div>

     <div v-if="showFormModal" class="modal-overlay" @click="handleCancelEdit"> <div class="modal-content form-modal-content" @click.stop> <RouteFormView
              ref="routeFormRef"
              :initialRouteData="routeToEdit"
              :isEditing="isEditing"
              :pitches="currentRoutePitches"
              @save="handleSaveRoute"
              @cancel="handleCancelEdit"
              @add-pitch="handleAddPitch"
              @edit-pitch="handleEditPitch"
              @delete-pitch="handleDeletePitch"
            />
        </div>
     </div>

      <div v-if="saveError" class="error-message">저장 오류: {{ saveError.message }}</div>
      <div v-if="deleteError" class="error-message">삭제 오류: {{ deleteError.message }}</div>
      <div v-if="pitchError" class="error-message">피치 오류: {{ pitchError.message }}</div>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db, storage } from '@/firebase';
import { collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// 분리된 하위 컴포넌트 임포트
import RouteListView from './RouteListView.vue';
import RouteFormView from './RouteFormView.vue';


// RouteFormView 자식 컴포넌트 인스턴스에 접근하기 위한 ref
const routeFormRef = ref(null);


// 상태 변수 (공유 및 메인 관리)
const routes = ref([]);
const loading = ref(true); // 목록 로딩 상태 (fetchRoutes 함수에서 사용)
const fetchError = ref(null); // 목록 로딩 오류 상태

const isEditing = ref(false); // 수정 모드 상태
const routeToEdit = ref(null); // 수정할 루트 데이터 객체 (폼 컴포트로 전달)
const currentRoutePitches = ref([]); // 현재 수정 중인 루트의 피치 목록
const pitchError = ref(null); // 피치 관리 관련 오류 상태


const showConfirmModal = ref(false); // 루트 삭제 확인 모달 표시 상태
const routeToDeleteId = ref(null); // 삭제할 루트의 ID

const showFormModal = ref(false); // 폼 모달 표시 상태


const saveError = ref(null); // 루트 저장 중 오류 상태
const deleteError = ref(null); // 루트 삭제 중 오류 상태


// Firestore 컬렉션 참조
const routesCollectionRef = collection(db, 'routes');

// 날짜 포맷팅 헬퍼 함수 (공유)
const formatDate = (timestamp) => {
  if (!timestamp) return '정보 없음';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};


// 이미지 업로드 함수 (메인 관리 - 루트 및 피치 이미지) - pathPrefix 활용
const uploadImage = async (file, pathPrefix) => {
    if (!file) return null;

    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `${pathPrefix}/${fileName}`; // 예: 'routes/ROUTE_ID/image.png' 또는 'routes/ROUTE_ID/pitches/PITCH_ID/image.png'

    console.log(`[MapManagement] Storage 파일 업로드 시작: ${storagePath}`);

    const imageRef = storageRef(storage, storagePath);
    const uploadTask = uploadBytesResumable(imageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => { /* 진행 상태 모니터링 (선택 사항) */ },
            (error) => { console.error(`[MapManagement] 이미지 업로드 오류 (${storagePath}):`, error); reject(error); },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log(`[MapManagement] 이미지 업로드 성공. 다운로드 URL: ${downloadURL}`);
                    resolve(downloadURL);
                }).catch(reject);
            }
        );
    });
};

// Storage에서 파일 삭제 함수 (메인 관리 - 루트 및 피치 이미지)
const deleteFileFromStorage = async (fileUrl) => {
    if (!fileUrl || (!fileUrl.startsWith('gs://') && !fileUrl.startsWith('http'))) {
         console.warn("[MapManagement] 유효한 Storage 파일 URL이 아닙니다. 삭제를 건너뜁니다.", fileUrl);
         return;
    }
    try {
        let storagePath;
        if (fileUrl.startsWith('gs://')) {
            const pathSegments = fileUrl.substring(5).split('/');
            storagePath = pathSegments.slice(1).join('/');
        } else if (fileUrl.startsWith('http')) {
            const url = new URL(fileUrl);
            const pathSegments = url.pathname.split('/');
             const oIndex = pathSegments.indexOf('o');
             if (oIndex !== -1 && pathSegments.length > oIndex + 1) {
                 // /o/ 이후의 경로를 디코딩하여 사용
                 storagePath = decodeURIComponent(pathSegments.slice(oIndex + 1).join('/'));
             } else {
                 console.warn("[MapManagement] HTTP URL에서 Storage 경로를 파싱할 수 없습니다. 삭제를 건너옴.", fileUrl);
                 return;
             }
        } else {
            console.warn("[MapManagement] 알 수 없는 형식의 파일 URL입니다. 삭제를 건너옴.", fileUrl);
            return;
        }

        console.log(`[MapManagement] Storage 파일 삭제 시도: ${storagePath}`);
        const fileRef = storageRef(storage, storagePath);
        await deleteObject(fileRef);
        console.log(`[MapManagement] Storage 파일 삭제 완료: ${storagePath}`);

    } catch (error) {
        // 파일이 이미 없거나 접근 권한이 없는 경우 오류가 발생할 수 있으나,
        // 이 함수는 best-effort로 동작하도록 합니다.
        console.error(`[MapManagement] Storage 파일 삭제 오류 (${fileUrl}):`, error);
    }
};

// 루트 목록 가져오기 (메인 관리) - 새로운 필드 포함
const fetchRoutes = async () => {
  loading.value = true; // 목록 로딩 상태 시작
  fetchError.value = null; // 목록 오류 초기화
  try {
     const q = query(routesCollectionRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const routesList = [];
    querySnapshot.forEach(doc => {
      // Include new fields when fetching
      routesList.push({
        id: doc.id,
        ...doc.data(),
        climbingOverview: doc.data().climbingOverview || '', // 새로운 필드 포함
        climbingStyle: doc.data().climbingStyle || '',     // 새로운 필드 포함
        climbingGear: doc.data().climbingGear || '',       // 새로운 필드 포함
        averageDifficulty: doc.data().averageDifficulty || '', // 이름 변경된 필드 포함
        developer: doc.data().developer || '',             // 새로운 필드 포함
      });
    });
    routes.value = routesList;
    console.log(`[MapManagement] ${routes.value.length}개 루트 가져옴.`, routes.value);

  } catch (e) {
    console.error("[MapManagement] 루트 목록 가져오기 오류:", e);
    fetchError.value = e; // 목록 오류 상태 설정
  } finally {
    loading.value = false; // 목록 로딩 상태 완료
  }
};

// 특정 루트의 피치 목록 가져오기
const fetchPitchesForRoute = async (routeId) => {
    if (!routeId) {
        console.warn("[MapManagement] fetchPitchesForRoute: routeId가 제공되지 않았습니다.");
        currentRoutePitches.value = [];
        return;
    }
     console.log(`[MapManagement] 루트 "${routeId}"의 피치 목록 가져오기 시작.`);
     pitchError.value = null; // 피치 오류 초기화
    try {
         // routes/{routeId}/pitches 서브컬렉션 참조
        const pitchesCollectionRef = collection(db, 'routes', routeId, 'pitches');
         // 피치 번호 순으로 정렬하여 조회
        const q = query(pitchesCollectionRef, orderBy('number', 'asc'));
        const querySnapshot = await getDocs(q);

        const pitchesList = [];
        querySnapshot.forEach(doc => {
            pitchesList.push({
                id: doc.id, // 피치 문서 ID
                ...doc.data() // 피치 데이터 (number, name, length, difficulty, climbingStyle, bolts, imagePath 등)
            });
        });
         currentRoutePitches.value = pitchesList; // 가져온 피치 목록으로 상태 업데이트
        console.log(`[MapManagement] 루트 "${routeId}"의 피치 ${pitchesList.length}개 가져옴.`, currentRoutePitches.value);

    } catch (e) {
        console.error(`[MapManagement] 루트 "${routeId}"의 피치 목록 가져오기 오류:`, e);
        pitchError.value = e; // 피치 오류 상태 설정
        currentRoutePitches.value = []; // 오류 발생 시 목록 초기화
    }
};


// 루트 추가/수정 저장 처리 (메인 관리) - 새로운 필드 저장
// RouteFormView 컴포넌트로부터 'save' 이벤트 발생 시 호출됨
const handleSaveRoute = async (formData) => {
    console.log("[MapManagement] 'save' 이벤트 수신. 데이터:", formData);

    saveError.value = null; // 저장 오류 초기화

    const isAdding = !formData.id; // ID가 없으면 추가 모드
    const routeId = formData.id; // 수정 모드 시 ID

    let imageUrlToSave = null; // 최종적으로 문서에 저장될 이미지 URL

    try {
        if (isAdding) {
            // ⭐⭐ 추가 모드 ⭐⭐
            console.log("[MapManagement] 새 루트 추가 시작. 문서 생성 먼저.");

            // 1. 이미지 업로드 없이 문서 먼저 추가하여 ID 확보
            const newRouteData = {
                 name: formData.name,
                 location: formData.location,
                 // Include new fields when adding
                 climbingOverview: formData.climbingOverview || '', // 새로운 필드 포함
                 climbingStyle: formData.climbingStyle || '',     // 새로운 필드 포함
                 climbingGear: formData.climbingGear || '',       // 새로운 필드 포함
                 averageDifficulty: formData.averageDifficulty || '', // 이름 변경된 필드 포함
                 developer: formData.developer || '',             // 새로운 필드 포함
                 timestamp: serverTimestamp(),
                 imageUrl: '', // 이미지 URL 필드 추가 (처음에는 비워둠)
            };
            const newRouteRef = await addDoc(routesCollectionRef, newRouteData);
            const finalRouteId = newRouteRef.id; // 새로 생성된 문서 ID 확보
            console.log(`[MapManagement] 문서 생성 완료, ID: ${finalRouteId}`);

            // 2. 새 이미지가 선택되었다면, 확보한 ID를 사용하여 최종 경로로 업로드
            if (formData.selectedImageFile) {
                 console.log(`[MapManagement] 새 이미지 업로드 시작 (ID: ${finalRouteId}).`);
                 // 루트 이미지 경로: routes/${routeId}/image.png 형태
                 const uploadedUrl = await uploadImage(formData.selectedImageFile, `routes/${finalRouteId}`);
                 // 업로드된 URL로 문서 업데이트
                 await updateDoc(newRouteRef, { imageUrl: uploadedUrl });
                 imageUrlToSave = uploadedUrl; // 저장된 URL 기록
                 console.log(`[MapManagement] 문서 ${finalRouteId}에 이미지 URL 업데이트 완료.`);
            }

             // 저장 완료 메시지 및 후처리
            console.log(`[MapManagement] 새 루트 추가 및 이미지 처리 완료: ${finalRouteId}`);
            alert('새 루트가 성공적으로 추가되었습니다.');

        } else {
            // ⭐⭐ 수정 모드 ⭐⭐
            console.log(`[MapManagement] 루트 수정 시작: ${routeId}`);
            const routeRef = doc(db, 'routes', routeId);

             // 기존 루트 데이터 가져오기 (Storage 이미지 URL 확인용)
             const oldRouteDocSnapshot = await getDoc(doc(db, 'routes', routeId));
             const oldRoute = oldRouteDocSnapshot.exists() ? oldRouteDocSnapshot.data() : null;
             const oldImageUrl = oldRoute?.imageUrl || null;
             console.log(`[MapManagement] 기존 이미지 URL: ${oldImageUrl}`);

            // 1. 이미지 처리 (기존 이미지 삭제 및 새 이미지 업로드)
            if (formData.selectedImageFile) {
                // 새 이미지가 선택됨
                 console.log("[MapManagement] 새 이미지 파일 감지.");
                // 기존 이미지가 Storage에 있다면 삭제
                if (oldImageUrl) {
                     console.log("[MapManagement] 기존 이미지 삭제 시도.");
                     await deleteFileFromStorage(oldImageUrl);
                }
                // 새 이미지 업로드 (루트 ID를 경로에 포함)
                 console.log(`[MapManagement] 새 이미지 업로드 시작 (ID: ${routeId}).`);
                 // 루트 이미지 경로: routes/${routeId}/image.png 형태
                imageUrlToSave = await uploadImage(formData.selectedImageFile, `routes/${routeId}`);
                 console.log(`[MapManagement] 새 이미지 업로드 완료: ${imageUrlToSave}`);

            } else if (formData.removeExistingImage) {
                // 기존 이미지 제거 요청됨 (새 파일 선택 안함)
                 console.log("[MapManagement] 기존 이미지 제거 요청 감지.");
                if (oldImageUrl) {
                     console.log("[MapManagement] 기존 이미지 삭제 시도.");
                     await deleteFileFromStorage(oldImageUrl);
                }
                imageUrlToSave = null; // 문서에서 이미지 URL 필드 제거

            } else {
                 // 이미지 변경 없음 (새 파일 선택 안함, 제거 요청 안함)
                 console.log("[MapManagement] 이미지 변경 없음. 기존 이미지 URL 유지.");
                 imageUrlToSave = oldImageUrl; // 기존 이미지 URL 유지
            }


            // 2. Firestore 문서 업데이트
             const updatedRouteData = {
                 name: formData.name,
                 location: formData.location,
                 // Include new fields when updating
                 climbingOverview: formData.climbingOverview || '',
                 climbingStyle: formData.climbingStyle || '',
                 climbingGear: formData.climbingGear || '',
                 averageDifficulty: formData.averageDifficulty || '', // 이름 변경된 필드 포함
                 developer: formData.developer || '',
                 imageUrl: imageUrlToSave, // 처리된 이미지 URL
                 // timestamp는 추가 시에만 설정하고 수정 시에는 변경하지 않는 것이 일반적
                 // timestamp: serverTimestamp(),
             };
            await updateDoc(routeRef, updatedRouteData);

            console.log(`[MapManagement] 루트 수정 완료: ${routeId}`);
            alert('루트가 성공적으로 수정되었습니다.');
        }

        // 저장 완료 후 후처리 (추가/수정 공통)
        resetForm(); // 폼 초기화 (모달 닫기 포함)
        fetchRoutes(); // 리스트를 재취득

    } catch (e) {
        console.error("[MapManagement] ルート保存エラー:", e);
        saveError.value = e; // 保存エラー状態設定
        // MapManagement에서는 루트 저장 오류만 직접 처리
        throw e; // RouteFormView로 오류를 다시 던져서 RouteFormView가 에러 메시지를 표시하게 함
    } finally {
        // RouteFormView 의 isSaving 状態は RouteFormView 内で直接 false に設定されます。
    }
  };


  // 修正モード開始処理 (RouteListView から 'edit' イベント受信)
  const handleEditRoute = (route) => {
    isEditing.value = true;
    // Pass all route data including new fields to RouteFormView
    routeToEdit.value = route; // フォームコンポーネントに渡すデータ設定 (ルート情報 및 新しい 필드含む)
    currentRoutePitches.value = []; // 以前ピッチリストをクリア
    fetchPitchesForRoute(route.id); // 選択された 루트의 ピッチリスト取得
    showFormModal.value = true; // 修正時にフォームモーダルを開く
    console.log(`[MapManagement] ルート修正モード 진입: ${route.id}`, route);
  };

  // 修正/追加キャンセル処理 (RouteFormView から 'cancel' イベント受信)
  const handleCancelEdit = () => {
    // RouteFormView의 isSaving 또는 isSavingPitch 상태 확인
    // RouteFormView 컴포넌트 ref가 존재하고, 그 안에 isSaving 또는 isSavingPitch 상태가 true이면 닫기 방지
    if (routeFormRef.value && (routeFormRef.value.isSaving || routeFormRef.value.isSavingPitch)) {
        console.log("[MapManagement] RouteFormView가 현재 저장 중이므로 폼 닫기 불가.");
        // 사용자에게 저장 중임을 알리는 메시지 표시 (선택 사항)
        alert("현재 저장 중입니다. 작업이 완료될 때까지 기다려주세요.");
        return; // 저장 중이면 함수 실행 중단
    }
    resetForm(); // 폼 초기화 (모달 닫기 포함)
    console.log("[MapManagement] 루트 수정/추가 취소 처리.");
  };

  // フォーム状態 초기화と モーダルを閉じる 함수
  const resetForm = () => {
    isEditing.value = false;
    routeToEdit.value = null;
    currentRoutePitches.value = []; // ピッチリスト 상태도 초기화
    showFormModal.value = false;
    saveError.value = null;
    pitchError.value = null; // ピッチエラー 상태 초기화
     console.log("[MapManagement] フォーム 상태 초기화 및 モーダル 닫기.");
  };

  // 新規ルート追加フォームモーダルを開く 함수
  const openAddFormModal = () => {
      resetForm(); // 既存フォーム状態初期化 (修正モード나 이전 입력값 방지)
      isEditing.value = false; // 追加モード 設定
      routeToEdit.value = null; // フォームコンポーネントに初期データなし를 渡す
      currentRoutePitches.value = []; // 追加モードでは 피치 목록 없음
      showFormModal.value = true; // 폼 モーダル 열기
      console.log("[MapManagement] 새 루트 추가 フォーム モーダル 열기.");
  };


  // 削除確認モーダル表示 (RouteListView から 'delete' イベント受信)
  const confirmDeleteRoute = (routeId) => {
      routeToDeleteId.value = routeId;
      showConfirmModal.value = true;
      deleteError.value = null; // 削除エラー 初期化
      console.log(`[MapManagement] 루트 삭제 확인 요청: ${routeId}`);
  };

  // 削除キャンセル (メイン管理)
  const cancelDelete = () => {
      routeToDeleteId.value = null;
      showConfirmModal.value = false;
       deleteError.value = null; // 削除エラー 初期化
      console.log("[MapManagement] 루트 삭제 취소.");
  };

  // ルート削除実行 (メイン管理)
  const deleteRoute = async () => {
    if (!routeToDeleteId.value) return;

    deleteError.value = null; // 削除エラー 初期化
    const routeId = routeToDeleteId.value;

    try {
       // 1. ルート画像の削除
       const routeToDeleteDocSnapshot = await getDoc(doc(db, 'routes', routeId));
       const routeToDelete = routeToDeleteDocSnapshot.exists() ? routeToDeleteDocSnapshot.data() : null;

       if (routeToDelete && routeToDelete.imageUrl) {
           console.log(`[MapManagement] ルート 이미지 삭제 시도: ${routeToDelete.imageUrl}`);
           await deleteFileFromStorage(routeToDelete.imageUrl);
       }

       // 2. そのルートのすべてのピッチとピッチ画像の削除
       console.log(`[MapManagement] 루트 ${routeId}의 모든 피치 삭제 시작.`);
       const pitchesCollectionRef = collection(db, 'routes', routeId, 'pitches');
       const pitchesSnapshot = await getDocs(pitchesCollectionRef);

       const deletePitchPromises = pitchesSnapshot.docs.map(async (pitchDoc) => {
           const pitchData = pitchDoc.data();
           // 피치 이미지 삭제
           if (pitchData.imagePath) {
               console.log(`[MapManagement] ピッチ 이미지 삭제 시도: ${pitchData.imagePath}`);
               await deleteFileFromStorage(pitchData.imagePath);
           }
           // ピッチ 문서 삭제
           console.log(`[MapManagement] ピッチ 문서 삭제 시도: ${pitchDoc.id}`);
           return deleteDoc(doc(db, 'routes', routeId, 'pitches', pitchDoc.id));
       });

       await Promise.all(deletePitchPromises); // 모든 ピッチ 삭제 완료 기다림
       console.log(`[MapManagement] 루트 ${routeId}의 모든 피치 삭제 완료.`);


      // 3. ルート 문서 삭제
      const routeRef = doc(db, 'routes', routeId);
      await deleteDoc(routeRef);

      console.log(`[MapManagement] ルート 문서 삭제 완료: ${routeId}`);
      alert('루트가 성공적으로 삭제되었습니다.');

      // リストから削除されたルート 제거 및 モーダル 닫기
      routes.value = routes.value.filter(route => route.id !== routeId);
      cancelDelete(); // モーダル 닫기
       // 削除されたルート가 현재 수정 중인 루트였다면、フォーム 초기화 및 モーダル 닫기
       if (routeToEdit.value?.id === routeId) {
            // RouteFormView의 resetForm 함수를 호출하여 상태 및 모달 닫기 처리
            // routeFormRef가 존재하고 resetForm 함수가 노출(expose)되어 있는지 확인
            if(routeFormRef.value && typeof routeFormRef.value.resetForm === 'function') {
                routeFormRef.value.resetForm();
                console.log("[MapManagement] 루트 삭제 완료 후 RouteFormView resetForm 호출됨.");
            } else {
                // RouteFormView의 resetForm 함수를 찾을 수 없거나 노출되지 않았다면 MapManagement 자체의 resetForm 사용
                resetForm(); // MapManagement 자체의 resetForm 사용
                console.warn("[MapManagement] RouteFormView의 resetForm 함수를 찾을 수 없습니다. MapManagement 자체 resetForm 사용.");
            }
       }

    } catch (e) {
      console.error(`[MapManagement] ルート削除エラー (${routeId}):`, e);
      deleteError.value = e; // 削除エラー 状態設定
      alert(`루트 삭제 중 오류가 발생했습니다: ${e.message}`);
       cancelDelete(); // エラー発生時 モーダル 닫기
    } finally {
      // ローディング 상태 관리
    }
  };

  // 피치 추가 이벤트 핸들러 (MapManagement에서 구현) - 완료 후 폼 닫기 호출
  const handleAddPitch = async ({ routeId, pitchData }) => {
      console.log(`[MapManagement] 'add-pitch' 이벤트 수신. 루트 ID: ${routeId}, 피치 데이터:`, pitchData);
      if (!routeId) {
           console.error("[MapManagement] 피치 추가 오류: 루트 ID가 없습니다.");
           const error = new Error("피치를 추가할 루트 정보가 없습니다.");
           pitchError.value = error;
           throw error; // RouteFormView로 오류 전달
      }
       pitchError.value = null; // 피치 오류 초기화

      try {
           // 피치 문서 먼저 추가 (이미지 URL 없이) -> ID 확보 -> 이미지 업로드 -> 문서 업데이트
           const pitchDocData = { ...pitchData };
           delete pitchDocData.selectedPitchImageFile; // 파일 객체는 Firestore에 저장하지 않음
           delete pitchDocData.removeExistingImage; // 이 플래그도 저장하지 않음

           const pitchesCollectionRef = collection(db, 'routes', routeId, 'pitches');
           const newPitchRef = await addDoc(pitchesCollectionRef, {
               ...pitchDocData,
               timestamp: serverTimestamp(), // 피치 등록 시간
               imagePath: '', // 일단 빈 문자열로 추가
           });
           const newPitchId = newPitchRef.id;
           console.log(`[MapManagement] 피치 문서 생성 완료, ID: ${newPitchId}`);

           // Optional: Save the Document ID into an 'id' field within the document data
           await updateDoc(newPitchRef, { id: newPitchId });
           console.log(`[MapManagement] 피치 문서 ${newPitchId}에 자체 id 필드 저장 완료.`);


           // 이미지 파일이 있다면, 확보한 피치 ID를 사용하여 최종 경로에 이미지 업로드
           if (pitchData.selectedPitchImageFile) {
               console.log(`[MapManagement] 피치 이미지 업로드 시작 (루트 ID: ${routeId}, 피치 ID: ${newPitchId}).`);
               // 피치 이미지 경로: routes/${routeId}/pitches/${newPitchId}/image.png 형태
              const uploadedUrl = await uploadImage(pitchData.selectedPitchImageFile, `routes/${routeId}/pitches/${newPitchId}`);
              // 생성된 피치 문서에 이미지 URL 업데이트
              await updateDoc(doc(db, 'routes', routeId, 'pitches', newPitchId), { imagePath: uploadedUrl });
              console.log(`[MapManagement] 피치 문서 ${newPitchId}에 이미지 URL 업데이트 완료.`);
           }


          // 피치 목록 새로고침 (MapManagement의 상태 업데이트)
          await fetchPitchesForRoute(routeId); // 목록 새로고침 완료까지 기다림
          alert('피치가 성공적으로 추가되었습니다.');

           // 피치 추가 완료 후 RouteFormView의 피치 폼 닫기
           if(routeFormRef.value && typeof routeFormRef.value.cancelPitchForm === 'function'){
               routeFormRef.value.cancelPitchForm();
               console.log("[MapManagement] RouteFormView의 피치 폼 닫기 호출됨.");
           }


      } catch (e) {
          console.error("[MapManagement] 피치 추가 중 오류 발생:", e);
          const error = new Error(`피치 추가 중 오류가 발생했습니다: ${e.message}`);
          pitchError.value = error;
          throw error; // RouteFormView로 오류 전달
      }
  };

  // 피치 수정 이벤트 핸들러 (MapManagement에서 구현) - 완료 후 폼 닫기 호출
  const handleEditPitch = async ({ routeId, pitchData }) => {
      console.log(`[MapManagement] 'edit-pitch' 이벤트 수신. 루트 ID: ${routeId}, 피치 데이터:`, pitchData);
       if (!routeId || !pitchData?.id) {
           console.error("[MapManagement] 피치 수정 오류: 루트 ID 또는 피치 ID가 없습니다.");
           const error = new Error("피치를 수정할 루트 또는 피치 정보가 없습니다.");
           pitchError.value = error;
           throw error; // RouteFormView로 오류 전달
       }
       pitchError.value = null;

      const pitchId = pitchData.id;
      const pitchDocRef = doc(db, 'routes', routeId, 'pitches', pitchId);

      try {
          // 기존 피치 문서 가져와서 기존 이미지 URL 확인
          const pitchDocSnapshot = await getDoc(pitchDocRef);
          const oldPitchData = pitchDocSnapshot.exists() ? pitchDocSnapshot.data() : null;
          const oldPitchImageUrl = oldPitchData?.imagePath || null;
          console.log(`[MapManagement] 수정할 피치 기존 이미지 URL: ${oldPitchImageUrl}`);

          let pitchImageUrlToSave = oldPitchImageUrl; // 기본적으로 기존 URL 유지

          // 이미지 처리 (새 이미지 업로드 또는 기존 이미지 제거)
          if (pitchData.selectedPitchImageFile) {
              // 새 이미지 파일이 선택됨
              console.log(`[MapManagement] 피치 ${pitchId} 새 이미지 파일 감지.`);
              // 기존 이미지가 Storage에 있다면 삭제
              if (oldPitchImageUrl) {
                   console.log(`[MapManagement] 피치 ${pitchId} 기존 이미지 삭제 시도.`);
                   await deleteFileFromStorage(oldPitchImageUrl);
              }
              // 새 이미지 업로드 (루트 ID와 피치 ID를 경로에 포함)
               console.log(`[MapManagement] 피치 ${pitchId} 새 이미지 업로드 시작.`);
              pitchImageUrlToSave = await uploadImage(pitchData.selectedPitchImageFile, `routes/${routeId}/pitches/${pitchId}`);
               console.log(`[MapManagement] 피치 ${pitchId} 새 이미지 업로드 완료: ${pitchImageUrlToSave}`);

          } else if (pitchData.removeExistingImage) {
              // 기존 이미지 제거 요청됨
               console.log(`[MapManagement] 피치 ${pitchId} 기존 이미지 제거 요청 감지.`);
              if (oldPitchImageUrl) {
                   console.log(`[MapManagement] 피치 ${pitchId} 기존 이미지 삭제 시도.`);
                   await deleteFileFromStorage(oldPitchImageUrl);
              }
              pitchImageUrlToSave = null; // 문서에서 이미지 URL 필드 제거

          } else {
               // 이미지 변경 없음 (selectedPitchImageFile 없고 removeExistingImage도 false)
               console.log(`[MapManagement] 피치 ${pitchId} 이미지 변경 없음. 기존 URL 유지.`);
               pitchImageUrlToSave = oldPitchImageUrl; // 기존 URL 유지
          }


          // Firestore 피치 문서 업데이트
          const updatedPitchData = { ...pitchData };
          delete updatedPitchData.selectedPitchImageFile; // 파일 객체는 Firestore에 저장하지 않음
          delete updatedPitchData.removeExistingImage; // 이 플래그도 저장하지 않음
          delete updatedPitchData.id; // 문서 업데이트 시 ID 필드는 포함하지 않음 (routeFormView에서 이미 id를 받고 있음)

          await updateDoc(pitchDocRef, {
              ...updatedPitchData,
              imagePath: pitchImageUrlToSave, // 처리된 이미지 URL
              // timestamp는 추가 시에만 설정하고 수정 시에는 변경하지 않는 것이 일반적
              // timestamp: serverTimestamp(),
              id: pitchId, // Optional: Update the 'id' field within the document data on edit as well
          });

          console.log(`[MapManagement] 피치 ${pitchId} 수정 완료.`);
          alert('피치가 성공적으로 수정되었습니다.');

          // 피치 목록 새로고침 (MapManagement의 상태 업데이트)
          await fetchPitchesForRoute(routeId); // 목록 새로고침 완료까지 기다림

           // 피치 수정 완료 후 RouteFormView의 피치 폼 닫기
           if(routeFormRef.value && typeof routeFormRef.value.cancelPitchForm === 'function'){
               routeFormRef.value.cancelPitchForm();
               console.log("[MapManagement] RouteFormView의 피치 폼 닫기 호출됨.");
           }


      } catch (e) {
          console.error(`[MapManagement] 피치 수정 중 오류 발생 (${pitchId}):`, e);
          const error = new Error(`피치 수정 중 오류가 발생했습니다: ${e.message}`);
          pitchError.value = error;
          throw e; // RouteFormView로 오류 전달
      }
  };

  // 피치 삭제 이벤트 핸들러 (MapManagement에서 구현)
  const handleDeletePitch = async ({ routeId, pitchId }) => {
      console.log(`[MapManagement] 'delete-pitch' 이벤트 수신. 루트 ID: ${routeId}, 피치 ID: ${pitchId}`);
      if (!routeId || !pitchId) {
          console.error("[MapManagement] 피치 삭제 오류: 루트 ID 또는 피치 ID가 없습니다.");
          pitchError.value = new Error("삭제할 루트 또는 피치 정보가 없습니다.");
          return; // 이 경우는 RouteFormView에서 오류 표시하지 않도록 throw 하지 않음
      }
       // 피치 삭제 중에는 삭제 버튼 비활성화는 필요 없지만, 루트나 피치 저장 중에는 비활성화 가능
       // routeFormRef가 존재하고 isSaving 또는 isSavingPitch 상태가 true이면 삭제 방지
       if(routeFormRef.value && (routeFormRef.value.isSaving || routeFormRef.value.isSavingPitch)) {
           console.log("[MapManagement] RouteFormView가 현재 저장 중이므로 피치 삭제 불가.");
            alert("현재 저장 중이므로 피치를 삭제할 수 없습니다."); // 간단히 alert
           return; // 저장 중이면 함수 실행 중단
       }


       pitchError.value = null;

      // 사용자에게 삭제 확인을 요청 (confirm 모달 사용)
      const confirmed = confirm('이 피치를 정말 삭제하시겠습니까?'); // 브라우저 기본 confirm 사용
      if (!confirmed) {
          console.log("[MapManagement] 피치 삭제 취소됨.");
          return; // 사용자가 취소한 경우
      }

      const pitchDocRef = doc(db, 'routes', routeId, 'pitches', pitchId);

      try {
          // 1. 피치 이미지 파일이 있다면 Storage에서 삭제
          const pitchDocSnapshot = await getDoc(pitchDocRef);
          if (pitchDocSnapshot.exists()) {
             const pitchData = pitchDocSnapshot.data();
             if (pitchData.imagePath) {
                 console.log(`[MapManagement] 피치 이미지 삭제 시도: ${pitchData.imagePath}`);
                 await deleteFileFromStorage(pitchData.imagePath);
             }
             // 2. 피치 문서 삭제
             await deleteDoc(pitchDocRef);
              console.log(`[MapManagement] 피치 문서 삭제 완료: ${pitchId}`);
              alert('피치가 성공적으로 삭제되었습니다.');

          } else {
             console.warn(`[MapManagement] 삭제하려는 피치 문서 (${pitchId})를 찾을 수 없습니다.`);
              alert('삭제하려는 피치를 찾을 수 없습니다.');
          }

          // 피치 목록 새로고침 (MapManagement의 상태 업데이트)
          fetchPitchesForRoute(routeId);

      } catch (e) {
          console.error(`[MapManagement] 피치 삭제 중 오류 발생 (${pitchId}):`, e);
          pitchError.value = e;
          alert(`피치 삭제 중 오류가 발생했습니다: ${e.message}`);
      }
  };


  // 컴포넌트 마운트 시 루트 리스트를 가져옵니다.
  onMounted(() => {
    console.log("[MapManagement] コンポーネントがマウントされました。ルートリスト의 取得を開始합니다。");
    fetchRoutes();
  });

  // getDoc インポート確認 (既に一番上でインポート済み)

  </script>

  
  <style scoped>
  /* 기존 스타일 유지 */
.container{
    padding: 0;
}
  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 20px; /* 버튼과의 간격 */
  }
  
  .add-route-button {
      display: block;
      margin: 0 auto 20px;
      padding: 10px 20px;
      background-color: #28a745;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 1em;
      transition: background-color 0.3s ease;
  }
  .add-route-button:hover {
      background-color: #218838;
  }
  
  
  /* モーダルオーバーレイのスタイル */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  /* モーダルコンテンツエリアのスタイル */
  .modal-content {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
     max-width: 90%;
     max-height: 90vh;
     overflow-y: auto;
     box-sizing: border-box;
  }
  
  /* フォームモーダルコンテンツエリアの追加スタイル */
  .modal-content.form-modal-content {
      text-align: left;
      padding: 20px;
      width: 700px; /* フォームモーダルの適切な幅 */
      max-width: 90%;
  }
  
  /* 既存削除モーダル内の要素スタイル */
  .modal-content p {
    margin-bottom: 20px;
    font-size: 1.1em;
  }
  
  .modal-content button {
    padding: 10px 20px;
    margin: 0 5px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
  }
  
  .modal-content button {
    background-color: #dc3545;
    color: white;
  }
  
  .modal-content button:last-child {
    background-color: #6c757d;
    color: white;
  }
  
  
  .loading-message, .error-message {
    text-align: center;
    margin-top: 15px;
    font-style: italic;
  }
  .error-message {
    color: red;
  }
  
  
  </style>