<template>
  <div class="admin-map-management">

    <div v-if="isUploadingAnyImage" class="loading-overlay">
        <div class="loading-content">
            <p>이미지 업로드 중...</p>
            <div class="spinner"></div>
             </div>
    </div>
    <div v-if="currentView === 'routeList'">
      <h2>지도 관리 (루트 목록)</h2>
      <button @click="addNewRoute" class="add-button">새 루트 추가</button>
      <div v-if="loading" class="loading-message">루트 목록 로딩 중...</div>
      <div v-if="error" class="error-message">루트 목록 로딩 오류: {{ error.message }}</div>
      <div v-if="routes.length > 0" class="route-list">
        <h3>기존 루트 목록 ({{ routes.length }}개)</h3>
        <ul>
          <li v-for="route in routes" :key="route.id" class="route-item">
            <div class="route-info">
              <p><strong>ID:</strong> {{ route.id }}</p>
              <p><strong>이름:</strong> {{ route.name || '이름 없음' }}</p>
               <p v-if="route.location">
                 <strong>위치:</strong> Lat: {{ route.location.lat }}, Lng: {{ route.location.lng }}
              </p>
               <p v-if="route.overview"><strong>개요:</strong> {{ route.overview }}</p>
               <p v-if="route.difficulty"><strong>난이도:</strong> {{ route.difficulty }}</p>
                <div v-if="route.mainImageUrl" style="margin-top: 10px;">
                     <img :src="route.mainImageUrl" alt="루트 이미지" style="max-width: 100px;">
                </div>
            </div>
            <div class="route-actions">
              <button @click="editRoute(route)" class="action-button">수정</button>
              <button @click="managePitches(route.id)" class="action-button">피치 관리</button>
              <button @click="deleteRoute(route.id)" class="action-button delete">삭제</button>
            </div>
          </li>
        </ul>
      </div>
       <div v-else-if="!loading">
           <p>등록된 루트가 없습니다.</p>
       </div>
    </div>

    <div v-else-if="currentView === 'routeForm'">
      <h2>{{ editingRoute && editingRoute.id ? '루트 수정' : '새 루트 추가' }}</h2>

      <form @submit.prevent="saveRoute">
        <div class="form-group">
          <label for="routeName">이름:</label>
          <input type="text" id="routeName" v-model="editingRoute.name" required>
        </div>
        <div class="form-group">
          <label for="routeLat">위도:</label>
          <input type="number" id="routeLat" v-model.number="editingRoute.location.lat" required step="any">
        </div>
         <div class="form-group">
          <label for="routeLng">경도:</label>
          <input type="number" id="routeLng" v-model.number="editingRoute.location.lng" required step="any">
        </div>
        <div class="form-group">
          <label for="routeOverview">등반 개요:</label>
          <textarea id="routeOverview" v-model="editingRoute.overview"></textarea>
        </div>
         <div class="form-group">
          <label for="routeStyle">등반 형태:</label>
          <input type="text" id="routeStyle" v-model="editingRoute.climbingStyle">
        </div>
         <div class="form-group">
          <label for="routeGear">등반 장비:</label>
          <input type="text" id="routeGear" v-model="editingRoute.gear">
        </div>
         <div class="form-group">
          <label for="routeDifficulty">평균 난이도:</label>
          <input type="text" id="routeDifficulty" v-model="editingRoute.difficulty">
        </div>
         <div class="form-group">
          <label for="routeFirstAscent">개척자:</label>
          <input type="text" id="routeFirstAscent" v-model="editingRoute.firstAscentParty">
        </div>

        <div class="form-group">
            <label for="routeMainImage">메인 이미지:</label>
            <input type="file" id="routeMainImage" @change="handleImageFileChange" accept="image/*">
            <div v-if="editingRoute.mainImageUrl && !selectedImageFile">
                 <p>현재 이미지:</p>
                 <img :src="editingRoute.mainImageUrl" alt="현재 루트 이미지" style="max-width: 200px; margin-top: 10px;">
            </div>
             <div v-else-if="selectedImageFile">
                 <p>선택된 파일: {{ selectedImageFile.name }}</p>
             </div>
             </div>

         <div v-if="!editingRoute || !editingRoute.id" class="new-pitches-section">
            <h3>피치 정보 추가</h3>
            <p class="section-description">새 루트에 속한 피치 정보를 여기서 바로 입력할 수 있습니다.</p>
             <button type="button" @click="addPitchToNewRoute" class="add-pitch-button">피치 추가</button>

            <div v-if="newPitches.length > 0" class="pitch-forms-list">
                 <div v-for="(pitch, index) in newPitches" :key="index" class="pitch-form-item">
                     <h4>피치 {{ index + 1 }}</h4>
                     <div class="form-group">
                        <label :for="'newPitchNumber_' + index">번호:</label>
                        <input type="number" :id="'newPitchNumber_' + index" v-model.number="pitch.number" required min="1">
                     </div>
                     <div class="form-group">
                        <label :for="'newPitchName_' + index">이름:</label>
                        <input type="text" :id="'newPitchName_' + index" v-model="pitch.name" required>
                     </div>
                     <div class="form-group">
                        <label :for="'newPitchLength_' + index">길이 (예: 20m):</label>
                        <input type="text" :id="'newPitchLength_' + index" v-model="pitch.length">
                     </div>
                      <div class="form-group">
                        <label :for="'newPitchDifficulty_' + index">난이도 (예: 5.10a):</label>
                        <input type="text" :id="'newPitchDifficulty_' + index" v-model="pitch.difficulty">
                     </div>
                      <div class="form-group">
                        <label :for="'newPitchStyle_' + index">형태 (예: 슬랩):</label>
                        <input type="text" :id="'newPitchStyle_' + index" v-model="pitch.climbingStyle">
                     </div>
                      <div class="form-group">
                        <label :for="'newPitchBolts_' + index">볼트 개수:</label>
                        <input type="number" :id="'newPitchBolts_' + index" v-model.number="pitch.bolts" min="0">
                     </div>
                     <div class="form-group">
                         <label :for="'newPitchImageFile_' + index">피치 이미지:</label>
                         <input type="file" :id="'newPitchImageFile_' + index" @change="handlePitchImageFileChange($event, index)" accept="image/*">

                          <div v-if="pitch.selectedFile">
                             <p>선택된 파일: {{ pitch.selectedFile.name }}</p>
                          </div>
                          </div>


                     <button type="button" @click="removePitchFromNewRoute(index)" class="action-button delete small">피치 삭제</button>
                 </div>
            </div>
         </div>


        <div class="form-actions">
          <button type="submit" class="action-button" :disabled="isUploadingAnyImage">저장</button>
          <button type="button" @click="cancelEdit" class="action-button">취소</button>
        </div>
      </form>
    </div>

    <div v-else-if="currentView === 'pitchList'">
      <h2>피치 관리 - {{ selectedRoute && selectedRoute.name || '로딩 중...' }}</h2>
      <button @click="cancelEdit" class="action-button">← 루트 목록으로</button>

      <button @click="addNewPitch" class="add-button">새 피치 추가</button>

       <div v-if="loadingPitches" class="loading-message">피치 목록 로딩 중...</div>
       <div v-if="pitchError" class="error-message">피치 목록 로딩 오류: {{ pitchError.message }}</div>

       <div v-if="pitchesForRoute.length > 0" class="pitch-list">
           <h3>{{ selectedRoute && selectedRoute.name || '' }}의 피치 목록 ({{ pitchesForRoute.length }}개)</h3>
           <ul>
               <li v-for="pitch in pitchesForRoute" :key="pitch.id" class="pitch-item">
                   <div class="pitch-info">
                       <p><strong>ID:</strong> {{ pitch.id }}</p>
                       <p><strong>번호:</strong> {{ pitch.number || '미지정' }}</p>
                       <p><strong>이름:</strong> {{ pitch.name || '이름 없음' }}</p>
                        <p><strong>길이:</strong> {{ pitch.length || '정보 없음' }}</p>
                        <p><strong>난이도:</strong> {{ pitch.difficulty || '정보 없음' }}</p>
                        <p><strong>형태:</strong> {{ pitch.climbingStyle || '情報 없음' }}</p>
                        <p v-if="pitch.bolts !== undefined"><strong>볼트:</strong> {{ pitch.bolts }}개</p>
                        <p v-if="pitch.imagePath"><strong>이미지 경로:</strong> {{ pitch.imagePath }}</p>
                        <div v-if="pitch.imagePath" style="margin-top: 10px;">
                             <img :src="pitch.imagePath" alt="피치 이미지" style="max-width: 80px;">
                        </div>
                   </div>
                   <div class="pitch-actions">
                       <button @click="editPitch(pitch)" class="action-button">수정</button>
                       <button @click="deletePitch(selectedRouteId, pitch.id)" class="action-button delete">삭제</button>
                   </div>
               </li>
           </ul>
       </div>
        <div v-else-if="!loadingPitches">
            <p>해당 루트에 등록된 피치가 없습니다.</p>
        </div>
    </div>

    <div v-else-if="currentView === 'pitchForm'">
     <h2>{{ editingPitch && editingPitch.id ? '피치 수정' : '새 피치 추가' }} (루트: {{ selectedRoute && selectedRoute.name || '로딩 중...' }})</h2>
       <button @click="cancelPitchEdit" class="action-button">← 피치 목록으로</button>

       <form @submit.prevent="savePitch">
         <div class="form-group">
            <label for="pitchNumber">번호:</label>
            <input type="number" id="pitchNumber" v-model.number="editingPitch.number" required min="1">
         </div>
         <div class="form-group">
            <label for="pitchName">이름:</label>
            <input type="text" id="pitchName" v-model="editingPitch.name" required>
         </div>
         <div class="form-group">
            <label for="pitchLength">길이 (예: 20m):</label>
            <input type="text" id="pitchLength" v-model="editingPitch.length">
         </div>
          <div class="form-group">
            <label for="pitchDifficulty">난이도 (예: 5.10a):</label>
            <input type="text" id="pitchDifficulty" v-model="editingPitch.difficulty">
         </div>
          <div class="form-group">
            <label for="pitchStyle">형태 (예: 슬랩):</label>
            <input type="text" id="pitchStyle" v-model="editingPitch.climbingStyle">
         </div>
          <div class="form-group">
            <label for="pitchBolts">볼트 개수:</label>
            <input type="number" id="pitchBolts" v-model.number="editingPitch.bolts" min="0">
         </div>
         <div class="form-group">
             <label for="pitchImageFile">피치 이미지:</label>
              <div v-if="editingPitch.imagePath && !selectedExistingPitchImageFile">
                 <p>현재 이미지:</p>
                 <img :src="editingPitch.imagePath" alt="현재 피치 이미지" style="max-width: 150px; margin-top: 10px;">
              </div>
             <input type="file" id="pitchImageFile" @change="handleExistingPitchImageFileChange($event)" accept="image/*">
              <div v-if="selectedExistingPitchImageFile">
                 <p>선택된 파일: {{ selectedExistingPitchImageFile.name }}</p>
              </div>

              </div>


         <div class="form-actions">
           <button type="submit" class="action-button" :disabled="isUploadingAnyImage">저장</button>
           <button type="button" @click="cancelPitchEdit" class="action-button">취소</button>
         </div>
       </form>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'; // computed 임포트
// Firestore
import { collection, getDocs, query, deleteDoc, doc, addDoc, updateDoc, orderBy, writeBatch } from 'firebase/firestore'; // writeBatch 임포트
import { db } from '@/firebase';
// Firebase Storage
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';


const storage = getStorage();


// ✅✅✅ 상태 변수 정의 ✅✅✅
const currentView = ref('routeList');
const routes = ref([]);
const selectedRouteId = ref(null);
const selectedRoute = ref(null);
const editingRoute = ref(null); // 루트 추가/수정 폼에서 사용
const pitchesForRoute = ref([]); // 피치 목록 뷰에서 사용
const editingPitch = ref(null); // 피치 추가/수정 폼에서 사용

// ✅✅✅ 새 루트 추가 시 함께 저장할 피치 목록 상태 추가 (이미지 업로드 관련 상태 포함) ✅✅✅
const newPitches = ref([]); // 새 루트 폼에서만 사용

const loading = ref(true); // 루트 목록 로딩 상태
const error = ref(null); // 루트 목록 로딩 오류 상태
const loadingPitches = ref(false); // 피치 목록 로딩 상태
const pitchError = ref(null); // 피치 목록 로딩 오류 상태

// 루트 이미지 업로드 관련 상태 변수 (메인 루트 이미지)
const selectedImageFile = ref(null);
const uploadingImage = ref(false); // 메인 이미지 업로드 중 상태
const uploadProgress = ref(0); // 메인 이미지 업로드 진행 상태 (전역 오버레이에서는 사용 안 할 예정)
const uploadError = ref(null); // 메인 이미지 업로드 오류 상태 (전역 오버레이에서는 사용 안 할 예정)

// ✅✅✅ 기존 피치 수정 시 이미지 업로드 관련 상태 변수 추가 ✅✅✅
const selectedExistingPitchImageFile = ref(null);
const uploadingExistingPitchImage = ref(false);
const uploadExistingPitchProgress = ref(0); // (전역 오버레이에서는 사용 안 할 예정)
const uploadExistingPitchError = ref(null); // (전역 오버레이에서는 사용 안 할 예정)

// ✅✅✅ 전체 이미지 업로드 상태를 나타내는 computed 속성 추가 ✅✅✅
const isUploadingAnyImage = computed(() => {
  return uploadingImage.value || // 메인 이미지 업로드 중
         uploadingExistingPitchImage.value || // 기존 피치 이미지 업로드 중
         newPitches.value.some(p => p.uploading); // 새 피치 이미지 중 하나라도 업로드 중
});


// Firestore에서 루트 목록을 가져오는 함수 (동일)
const fetchRoutes = async () => {
  console.log("[MapManagement] 루트 목록 가져오기 시작 (Firestore).");
  loading.value = true;
  error.value = null;
  try {
    const routesCollectionRef = collection(db, 'routes');
    const q = query(routesCollectionRef);

    const querySnapshot = await getDocs(q);

    const routesList = [];
    querySnapshot.forEach(doc => {
      const routeData = doc.data();
      routesList.push({
        id: doc.id,
        ...routeData
      });
    });
    routes.value = routesList;
    console.log(`[MapManagement] 루트 ${routes.value.length}개 가져옴.`, routes.value);

  } catch (e) {
    console.error("[MapManagement] 루트 목록 가져오기 오류:", e);
    error.value = e;
  } finally {
    loading.value = false;
  }
};

// 특정 루트의 피치 목록을 Firestore에서 가져오는 함수 (동일)
const fetchPitchesForRoute = async (routeId) => {
     if (!routeId) {
        pitchesForRoute.value = [];
        return;
     }
     console.log(`[MapManagement] 라우트 "${routeId}"의 피치 목록 가져오기 시작 (Firestore).`);
     loadingPitches.value = true;
     pitchError.value = null;
     try {
        const pitchesCollectionRef = collection(db, 'routes', routeId, 'pitches');
        const q = query(pitchesCollectionRef, orderBy('number', 'asc'));

        const querySnapshot = await getDocs(q);

        const pitchesList = [];
        querySnapshot.forEach(doc => {
            pitchesList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        pitchesForRoute.value = pitchesList;
        console.log(`[MapManagement] 라우트 "${routeId}"의 피치 ${pitchesForRoute.value.length}개 가져옴.`, pitchesForRoute.value);

     } catch (e) {
         console.error(`[MapManagement] 라우트 "${routeId}"의 피치 목록 가져오기 오류:`, e);
         pitchError.value = e;
     } finally {
         loadingPitches.value = false;
     }
};


// ✅✅✅ 새 루트 추가 시작 함수 - newPitches 및 이미지 관련 상태 초기화 추가 ✅✅✅
const addNewRoute = () => {
    console.log("[MapManagement] '새 루트 추가' 버튼 클릭. 폼으로 이동.");
    editingRoute.value = { // 새 루트 기본 데이터
        name: '',
        location: { lat: null, lng: null },
        overview: '',
        climbingStyle: '',
        gear: '',
        difficulty: '',
        firstAscentParty: '',
        mainImageUrl: null
    };
    newPitches.value = []; // ✅ 새 피치 목록 초기화
    selectedImageFile.value = null;
    uploadError.value = null;
    uploadProgress.value = 0;

    // 기존 피치 수정 관련 상태도 초기화 (루트 폼에서 사용될 수 있으므로)
    selectedExistingPitchImageFile.value = null;
    uploadingExistingPitchImage.value = false;
    uploadExistingPitchProgress.value = 0;
    uploadExistingPitchError.value = null;

    currentView.value = 'routeForm';
};

// 루트 수정 시작 함수 - (newPitches는 사용하지 않음, 기존 피치 이미지 상태 초기화)
const editRoute = (route) => {
     console.log(`[MapManagement] 루트 "${route.id}" 수정 버튼 클릭. フォームビューへ 移動.`);
    editingRoute.value = { ...route };
    if (route.location) {
        editingRoute.value.location = { ...route.location };
    } else {
        editingRoute.value.location = { lat: null, lng: null };
    }
    selectedImageFile.value = null;
    uploadError.value = null;
    uploadProgress.value = 0;

    // ✅ 기존 피치 수정 관련 상태 초기화 ✅
    selectedExistingPitchImageFile.value = null;
    uploadingExistingPitchImage.value = false;
    uploadExistingPitchProgress.value = 0;
    uploadExistingPitchError.value = null;


    currentView.value = 'routeForm';
};

// 메인 루트 이미지 파일 선택 시 호출되는 핸들러 (동일)
const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedImageFile.value = file;
        // uploadError.value = null; // 오류 상태는 saveRoute에서 관리
         console.log("메인 이미지 파일 선택됨:", file.name);
    } else {
        selectedImageFile.value = null;
         console.log("메인 이미지 파일 선택 취소됨.");
    }
};

// ✅✅✅ 새 피치 이미지 파일 선택 시 호출되는 핸들러 추가 ✅✅✅
const handlePitchImageFileChange = (event, index) => {
     const file = event.target.files[0];
     if (file) {
         // 해당 인덱스의 피치 객체에 파일 및 업로드 상태 추가
         newPitches.value[index].selectedFile = file;
         newPitches.value[index].uploading = false; // 업로드 시작은 saveRoute에서
         newPitches.value[index].uploadProgress = 0;
         newPitches.value[index].uploadError = null;
         // imagePath는 업로드 성공 후 채워집니다.
         console.log(`피치 ${index + 1} 이미지 파일 선택됨:`, file.name);
     } else {
         // 파일 선택 취소 시 해당 피치 객체에서 파일 정보 제거 및 상태 초기화
         newPitches.value[index].selectedFile = null;
         newPitches.value[index].uploading = false;
         newPitches.value[index].uploadProgress = 0;
         newPitches.value[index].uploadError = null;
         console.log(`피치 ${index + 1} 이미지 파일 선택 취소됨.`);
     }
};

// ✅✅✅ 기존 피치 수정 시 이미지 파일 선택 핸들러 추가 ✅✅✅
const handleExistingPitchImageFileChange = (event) => {
     const file = event.target.files[0];
     if (file) {
         selectedExistingPitchImageFile.value = file;
         // uploadExistingPitchError.value = null; // 오류 상태는 savePitch에서 관리
         // imagePath는 업로드 성공 후 editingPitch에 반영됩니다.
         console.log("기존 피치 이미지 파일 선택됨:", file.name);
     } else {
         selectedExistingPitchImageFile.value = null;
         // uploadExistingPitchError.value = null; // 오류 상태는 savePitch에서 관리
         console.log("기존 피치 이미지 파일 선택 취소됨.");
     }
};


// ✅✅✅ 이미지 파일을 Firebase Storage에 업로드하는 범용 함수 수정 ✅✅✅
// file 객체와 저장될 경로 접두사(pathPrefix)를 받도록 수정
const uploadImage = async (file, pathPrefix) => { // routeId 매개변수 제거, pathPrefix 추가
    if (!file || !pathPrefix) {
         // 파일이나 경로가 없으면 null 반환 (오류 처리는 호출하는 곳에서)
        return null;
    }

    // 업로드 상태는 호출하는 곳에서 설정 (메인, 새 피치, 기존 피치)

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${pathPrefix}/${fileName}`; // 경로 접두사 사용
    const fileStorageRef = storageRef(storage, filePath);

    const uploadTask = uploadBytesResumable(fileStorageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                // 업로드 진행 상태 업데이트는 호출하는 곳에서 (메인 또는 개별 피치)
                 // 이 함수 자체에서는 상태 업데이트 하지 않음. saveRoute/savePitch에서 개별적으로 처리
                console.log(`Upload to ${filePath} is ${progress.toFixed(0)}% done`);
            },
            (error) => {
                console.error(`이미지 업로드 오류 (${filePath}):`, error);
                // 오류 상태 업데이트는 호출하는 곳에서
                reject(error);
            },
            () => {
                console.log(`이미지 업로드 성공 (${filePath}).`);
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log(`다운로드 URL (${filePath}):`, downloadURL);
                    // 완료 상태 업데이트는 호출하는 곳에서
                    resolve(downloadURL);
                }).catch(e => {
                     console.error(`다운로드 URL 가져오기 오류 (${filePath}):`, e);
                     // 오류 상태 업데이트는 호출하는 곳에서
                     reject(e);
                });
            }
        );
    });
};


// ✅✅✅ 루트 추가/수정 저장 함수 수정 - 새 루트/피치 이미지 업로드 및 피치 함께 저장 로직 강화 ✅✅✅
const saveRoute = async () => {
    console.log("[MapManagement] 루트 '저장' 버튼 클릭. 저장 로직 시작.");
    if (!editingRoute.value.name || editingRoute.value.location.lat === null || editingRoute.value.location.lng === null) {
        alert("이름과 위치(위도, 경도)는 필수입니다.");
        return;
    }

    // 새 루트 추가 시 피치 정보 유효성 검사
    if (!editingRoute.value.id) {
        if (newPitches.value.some(pitch => pitch.number === null || pitch.name === '')) {
             alert("추가된 모든 피치의 번호와 이름을 입력해주세요.");
             return;
        }
         // 피치 이미지 업로드 중인지는 isUploadingAnyImage computed 속성으로 판단
    }


    // 이미지 업로드 중이면 저장 중단 (isUploadingAnyImage computed 속성 사용)
    if (isUploadingAnyImage.value) {
        alert("이미지 업로드가 완료될 때까지 기다려 주세요.");
        return;
    }


    try {
        loading.value = true; // 전체 저장 로딩 시작
        // 이미지 업로드 관련 오류 상태는 개별 업로드 핸들러나 saveRoute/savePitch 내에서 설정


        let routeIdToSave = editingRoute.value.id; // 저장할 루트 ID

        // --- 새 루트 추가 시: 문서를 먼저 생성하여 ID 확보 ---
        if (!routeIdToSave) {
             console.log("새 루트 감지됨. 먼저 문서 추가하여 ID 확보.");
             const routesCollectionRef = collection(db, 'routes');
             const routeToAddTemp = { ...editingRoute.value };
             delete routeToAddTemp.id;
             delete routeToAddTemp.mainImageUrl;
             delete routeToAddTemp.newPitches; // newPitches는 Firestore에 저장하는 필드가 아님

             const tempDocRef = await addDoc(routesCollectionRef, { name: routeToAddTemp.name || '새 루트 (임시)', createdAt: new Date() });
             routeIdToSave = tempDocRef.id;
             console.log("새 문서 ID 확보:", routeIdToSave);
             editingRoute.value.id = routeIdToSave; // 확보한 ID를 편집 중인 객체에 할당 (후속 업로드/저장에 사용)
         }
        // --- ID 확보 로직 끝 ---


        // ✅ 메인 이미지 업로드 (새 루트 또는 기존 루트 수정 시) ✅
        let mainImageUrlToSave = editingRoute.value.mainImageUrl;
        if (selectedImageFile.value) {
             console.log("새 메인 이미지 파일 감지됨. 업로드 시작.");
             uploadingImage.value = true; // 메인 이미지 업로드 상태 활성화
             uploadError.value = null; // 오류 상태 초기화
             try {
                // 경로 접두사 전달
                mainImageUrlToSave = await uploadImage(selectedImageFile.value, `routes/${routeIdToSave}`);
                 console.log("메인 이미지 업로드 완료. URL:", mainImageUrlToSave);
             } catch (e) {
                 uploadError.value = `메인 이미지 업로드 실패: ${e.message}`;
                 console.error("[MapManagement] 메인 이미지 업로드 오류:", e);
                 // 이미지 업로드 실패 시 전체 저장 취소
                 alert(`메인 이미지 업로드 실패: ${e.message}\n루트 저장을 취소합니다.`);
                 return; // 저장 프로세스 중단
             } finally {
                 uploadingImage.value = false; // Ensure state is always reset
                 uploadProgress.value = 100; // Indicate completion (whether success or failure captured above)
             }
        }


        // ✅✅✅ 새 루트 추가 시 피치 이미지들 업로드 ✅✅✅
        if (!editingRoute.value?.originalId && newPitches.value.length > 0) {
             console.log(`새 루트(${routeIdToSave})의 피치 이미지 ${newPitches.value.filter(p => p.selectedFile).length}개 업로드 시작.`);

             const pitchUploadPromises = newPitches.value.map(async (pitch, index) => {
                 if (pitch.selectedFile) {
                     // 피치별 업로드 상태 활성화
                     newPitches.value[index].uploading = true;
                     newPitches.value[index].uploadProgress = 0;
                     newPitches.value[index].uploadError = null;
                     try {
                         // 피치 이미지 업로드 경로 접두사: routes/{routeId}/pitch_images
                         const pitchImageUrl = await uploadImage(pitch.selectedFile, `routes/${routeIdToSave}/pitch_images`); // 경로 접두사 전달
                         newPitches.value[index].imagePath = pitchImageUrl; // 업로드 성공 시 imagePath 업데이트
                         newPitches.value[index].uploadProgress = 100;
                         console.log(`피치 ${index + 1} 이미지 업로드 완료. URL: ${pitchImageUrl}`);
                     } catch (e) {
                         newPitches.value[index].uploadError = `이미지 업로드 실패: ${e.message}`;
                         console.error(`[MapManagement] 피치 ${index + 1} 이미지 업로드 오류:`, e);
                         throw e; // Promise.all에서 오류를 잡도록 예외 발생
                     } finally {
                         newPitches.value[index].uploading = false; // 피치별 업로드 상태 해제
                     }
                 }
                 return pitch; // 파일이 없거나 업로드된 피치 객체 반환
             }).filter(Boolean); // null 또는 undefined가 아닌 Promise만 필터링 (파일 없는 피치는 Promise를 반환하지 않음)

             try {
                 // 모든 피치 이미지 업로드가 완료될 때까지 대기
                 await Promise.all(pitchUploadPromises);
                 console.log("모든 피치 이미지 업로드 완료.");
             } catch (e) {
                 // 하나라도 업로드 실패 시 전체 저장 취소
                 // loading.value = false; // 전체 로딩 해제는 finally에서
                 alert(`피치 이미지 업로드 중 오류 발생: ${e.message}\n루트 및 피치 저장을 취소합니다.`);
                 return; // 저장 프로세스 중단
             }
        }

        // ✅✅✅ 기존 피치 수정 시 피치 이미지 업로드 ✅✅✅
         // 이 로직은 savePitch 함수로 이동되었습니다. saveRoute에서는 루트 정보만 업데이트합니다.
         // editingRoute.value?.originalId가 true인 경우는 기존 루트 수정이므로,
         // 피치 수정/추가는 pitchList 뷰와 savePitch 함수에서 별도로 처리됩니다.


        // ✅✅✅ 루트 문서 최종 업데이트 ✅✅✅
        console.log(`[MapManagement] 루트 문서 "${routeIdToSave}" 최종 데이터 업데이트 시작.`);
        const routeRef = doc(db, 'routes', routeIdToSave);
        const finalRouteDataToUpdate = { ...editingRoute.value };
        delete finalRouteDataToUpdate.id;
        delete finalRouteDataToUpdate.newPitches; // 피치 데이터는 서브컬렉션에 저장

        // 메인 이미지 URL 최종 반영
        finalRouteDataToUpdate.mainImageUrl = mainImageUrlToSave;

        await updateDoc(routeRef, finalRouteDataToUpdate);
        console.log(`[MapManagement] 루트 문서 "${routeIdToSave}" 최종 업데이트 완료.`);


        // ✅✅✅ 새 루트 추가 시에만 피치 서브컬렉션에 피치 문서들 추가 (이미지 URL 포함) ✅✅✅
        if (!editingRoute.value?.originalId && newPitches.value.length > 0) {
            console.log(`[MapManagement] 새 루트 (${routeIdToSave})에 피치 ${newPitches.value.length}개 문서 추가 시작 (배치).`);
            const batch = writeBatch(db); // 배치 쓰기 시작

            newPitches.value.forEach(pitch => {
                 const pitchData = { ...pitch };
                 delete pitchData.id; // Firestore ID는 자동 생성
                 // 업로드 관련 임시 상태는 저장 안 함
                 delete pitchData.selectedFile;
                 delete pitchData.uploading;
                 delete pitchData.uploadProgress;
                 delete pitchData.uploadError;

                 // number, bolts 필드 숫자 형변환 확인
                 pitchData.number = Number(pitchData.number);
                 if (pitchData.bolts !== null && pitchData.bolts !== undefined) {
                    // ✅ Fix: Changed dataToUpdate.bolts to pitchData.bolts
                    pitchData.bolts = Number(pitchData.bolts);
                 } else {
                    delete pitchData.bolts;
                 }
                 // imagePath 필드에는 업로드된 이미지 URL이 이미 담겨있습니다.

                 const pitchDocRef = doc(collection(db, 'routes', routeIdToSave, 'pitches')); // 새 피치 문서 참조 (ID 자동 생성)
                 batch.set(pitchDocRef, pitchData); // set 사용 (addDoc은 배치에서 직접 사용 불가)
            });

            await batch.commit(); // 배치 실행
            console.log(`[MapManagement] 새 루트 (${routeIdToSave})에 피치 ${newPitches.value.length}개 문서 추가 완료 (배치).`);
             alert(`새 루트 및 피치 ${newPitches.value.length}개가 추가되었습니다.`);

        } else if (editingRoute.value?.originalId) { // 기존 루트 수정 완료 시 (루트 정보만 업데이트)
             // 피치 수정은 savePitch 함수에서 별도로 처리됨
             alert("루트 정보가 수정되었습니다.");
        }


        // 저장 후 루트 목록 새로고침 및 목록 뷰로 전환
        await fetchRoutes(); // 루트 목록 새로고침
        currentView.value = 'routeList'; // 루트 목록 뷰로 전환

        // 상태 초기화
        selectedImageFile.value = null;
        editingRoute.value = null;
        newPitches.value = []; // 새 루트 피치 목록 초기화 (이미지 관련 상태 포함)
        selectedExistingPitchImageFile.value = null; // 기존 피치 이미지 파일 상태 초기화


    } catch (e) {
        console.error("[MapManagement] 저장 작업 중 최종 오류:", e);
         alert(`저장 중 오류 발생: ${e.message}`);
         error.value = e;
         // Ensure all uploading flags are false on global error catch as well
         uploadingImage.value = false; // Redundant if finally is always hit, but safe
         uploadingExistingPitchImage.value = false; // Should already be false for new route
         newPitches.value.forEach(p => p.uploading = false); // Ensure individual flags are off
    } finally {
         loading.value = false; // 전체 로딩 완료
         // 개별 업로드 상태는 해당 로직에서 이미 해제됨
    }
};

// 피치 관리 시작 함수 (동일)
const managePitches = (routeId) => {
    console.log(`[MapManagement] 루트 "${routeId}" 피치 관리 버튼 클릭. 피치 목록 뷰로 이동.`);
    selectedRouteId.value = routeId;
    const route = routes.value.find(r => r.id === routeId);
    selectedRoute.value = route ? { ...route } : null;

    // 피치 관리 뷰로 이동할 때 기존 피치 이미지 업로드 상태 초기화
    selectedExistingPitchImageFile.value = null;
    uploadingExistingPitchImage.value = false;
    uploadExistingPitchProgress.value = 0;
    uploadExistingPitchError.value = null;

    currentView.value = 'pitchList';
};


// 특정 루트의 피치 목록 가져오기 - selectedRouteId 변경 감지 (동일)
watch(selectedRouteId, (newRouteId) => {
    console.log(`[MapManagement] selectedRouteId 변경 감지: ${newRouteId}`);
    fetchPitchesForRoute(newRouteId);
}, { immediate: false });


// ✅✅✅ 새 피치 추가 함수 (새 루트 폼에서 사용) - 이미지 업로드 관련 상태 추가 ✅✅✅
const addPitchToNewRoute = () => {
    console.log("[MapManagement] '피치 추가' 버튼 클릭 (새 루트 폼).");
     // newPitches 배열에 빈 피치 객체 추가
     newPitches.value.push({
        // id는 Firestore 저장 시 자동 생성되므로 여기서 임시 id는 필요 없습니다.
        number: null, // 피치 번호
        name: '', // 피치 이름
        length: '', // 길이
        difficulty: '', // 난이도
        climbingStyle: '', // 형태
        bolts: null, // 볼트 개수
        imagePath: '', // 이미지 URL (업로드 성공 후 채워짐)
        // ✅ 새로 추가된 이미지 업로드 관련 상태 ✅
        selectedFile: null, // 사용자가 선택한 이미지 파일 객체
        uploading: false, // 이미지 업로드 중 상태
        uploadProgress: 0, // 이미지 업로드 진행률
        uploadError: null // 이미지 업로드 오류 메시지
        // TODO: 필요한 다른 피치 필드 추가
     });
     // 추가 후 자동으로 스크롤 이동 등을 구현하여 사용자 편의성을 높일 수 있습니다.
};

// ✅✅✅ 피치 삭제 함수 (새 루트 폼에서 사용) (동일) ✅✅✅
const removePitchFromNewRoute = (index) => {
    console.log(`[MapManagement] 피치 ${index + 1} 삭제 버튼 클릭 (새 루트 폼).`);
     // newPitches 배열에서 해당 인덱스의 피치 제거
     if (confirm(`${index + 1}번째 피치를 삭제하시겠습니까?`)) {
         newPitches.value.splice(index, 1);
         console.log(`[MapManagement] ${index + 1}번째 피치 삭제됨.`);
     }
};


// 새 피치 추가 시작 함수 - 피치 폼 뷰로 전환 (기존 피치 관리에서 사용) (동일)
const addNewPitch = () => {
    console.log("[MapManagement] 새 피치 추가 버튼 클릭 (피치 관리).");
    if (!selectedRouteId.value) {
        alert("피치를 추가할 루트가 선택되지 않았습니다.");
        return;
    }
     editingPitch.value = { // 새 피치 기본 데이터
        number: null,
        name: '',
        length: '',
        difficulty: '',
        climbingStyle: '',
        bolts: null,
        imagePath: null, // 새 피치 이미지 경로
         // 피치 관리에서 새 피치 추가 시 이미지 업로드 필드 활성화를 위해 상태 초기화
         // savePitch 함수에서 이 경로의 이미지 업로드 로직 구현 필요
         selectedFile: null, // 새 피치 추가 폼에서는 사용자가 파일을 선택하므로 필요
         uploading: false,
         uploadProgress: 0,
         uploadError: null,
     };
    // 기존 피치 수정 관련 상태도 초기화 (새 피치 추가 폼에서 사용되지 않도록)
    selectedExistingPitchImageFile.value = null;
    uploadingExistingPitchImage.value = false;
    uploadExistingPitchProgress.value = 0;
    uploadExistingPitchError.value = null;

     currentView.value = 'pitchForm';
};

// 피치 수정 시작 함수 - 피치 폼 뷰로 전환 (기존 피치 관리에서 사용) (동일)
const editPitch = (pitch) => {
    console.log(`[MapManagement] 피치 "${pitch.id}" 수정 버튼 클릭 (피치 관리).`);
    editingPitch.value = { ...pitch };
     // 기존 피치 수정 시 이미지 업로드 관련 상태 초기화
     selectedExistingPitchImageFile.value = null;
     uploadingExistingPitchImage.value = false;
     uploadExistingPitchProgress.value = 0;
     uploadExistingPitchError.value = null;
     // editingPitch에 선택된 파일 정보는 필요 없으므로 null로 초기화
     editingPitch.value.selectedFile = null;
     editingPitch.value.uploading = false;
     editingPitch.value.uploadProgress = 0;
     editingPitch.value.uploadError = null;


     currentView.value = 'pitchForm';
};

// ✅✅✅ 피치 추가/수정 저장 함수 수정 - 이미지 업로드 로직 추가 ✅✅✅
const savePitch = async () => {
    console.log("[MapManagement] 피치 '저장' 버튼 클릭.");
     if (!selectedRouteId.value) {
         console.error("[MapManagement] 오류: 피치를 저장할 루트가 선택되지 않았습니다.");
         alert("피치를 저장할 루트 정보를 찾을 수 없습니다.");
         return;
     }
    if (editingPitch.value.number === null || editingPitch.value.name === '') {
        alert("피치 번호와 이름은 필수입니다.");
        return;
    }

     // 이미지 업로드 중이면 저장 중단 (isUploadingAnyImage computed 속성 사용)
     if (isUploadingAnyImage.value) {
         alert("이미지 업로드가 완료될 때까지 기다려 주세요.");
         return;
     }


    try {
         loadingPitches.value = true; // 피치 저장 로딩 시작
         // 이미지 업로드 관련 오류 상태는 여기서 초기화하거나 savePitch 내에서 관리


         if (editingPitch.value.id) {
             // ✅ 기존 피치 수정 로직 ✅

             // ✅✅✅ 기존 피치 수정 시 이미지 업로드 로직 ✅✅✅
              if (selectedExistingPitchImageFile.value) {
                   console.log(`기존 피치(${editingPitch.value.id}) 새 이미지 업로드 시작.`);
                   uploadingExistingPitchImage.value = true; // 업로드 상태 활성화
                   uploadExistingPitchProgress.value = 0;
                   uploadExistingPitchError.value = null; // 오류 상태 초기화
                   try {
                      // 피치 이미지 업로드 경로 접두사: routes/{routeId}/pitch_images
                      const existingPitchImageUrl = await uploadImage(selectedExistingPitchImageFile.value, `routes/${selectedRouteId.value}/pitch_images`); // 경로 접두사 전달
                      editingPitch.value.imagePath = existingPitchImageUrl; // editingPitch 객체의 imagePath 업데이트
                      uploadExistingPitchProgress.value = 100;
                      console.log(`기존 피치(${editingPitch.value.id}) 이미지 업로드 완료. URL: ${existingPitchImageUrl}`);
                   } catch (e) {
                       uploadExistingPitchError.value = `이미지 업로드 실패: ${e.message}`;
                       console.error(`[MapManagement] 기존 피치(${editingPitch.value.id}) 이미지 업로드 오류:`, e);
                       // Image upload failed, stop saving the pitch
                       alert(`기존 피치 이미지 업로드 실패: ${e.message}\n피치 저장을 취소합니다.`);
                       return; // 저장 프로세스 중단
                   } finally {
                       uploadingExistingPitchImage.value = false; // Ensure state is always reset
                       uploadExistingPitchProgress.value = 100; // Indicate completion
                   }
              }

             // ✅ 기존 피치 문서 업데이트 (이미지 URL 업데이트 포함) ✅
             const pitchRef = doc(db, 'routes', selectedRouteId.value, 'pitches', editingPitch.value.id);
             const dataToUpdate = { ...editingPitch.value };
             delete dataToUpdate.id;
             // 업로드 관련 임시 상태는 저장 안 함
             delete dataToUpdate.selectedFile;
             delete dataToUpdate.uploading;
             delete dataToUpdate.uploadProgress;
             delete dataToUpdate.uploadError;


             dataToUpdate.number = Number(dataToUpdate.number);
             if (dataToUpdate.bolts !== null && dataToUpdate.bolts !== undefined) {
                 dataToUpdate.bolts = Number(dataToUpdate.bolts);
             } else {
                 delete dataToUpdate.bolts;
             }
             // imagePath 필드에는 업로드된 이미지 URL이 이미 담겨있습니다.

             await updateDoc(pitchRef, dataToUpdate);
             console.log(`[MapManagement] 라우트 "${selectedRouteId.value}" 의 피치 "${editingPitch.value.id}" 수정 완료 (이미지 업데이트 포함).`);
             alert("피치가 수정되었습니다.");
         } else {
             // ✅ 새 피치 추가 (피치 관리 페이지에서) 로직 ✅
             // 이 경로는 새 루트 추가 시 피치 동시 등록 기능 때문에 잘 사용되지 않을 수 있습니다.
             // 여기서 피치 이미지 업로드 기능은 현재 구현되지 않았습니다.
             // 만약 여기서도 이미지 업로드를 원하시면 별도의 로직 구현이 필요합니다.
             // (새 피치 추가 폼의 이미지 필드는 현재는 텍스트 입력 필드입니다)

             console.log(`[MapManagement] 라우트 "${selectedRouteId.value}"에 새 피치 추가 (피치 관리). 이미지 업로드는 미지원.`);
             const pitchesCollectionRef = collection(db, 'routes', selectedRouteId.value, 'pitches');
             const pitchToAdd = { ...editingPitch.value };
             delete pitchToAdd.id; // Firestore ID는 자동 생성
             // 업로드 관련 임시 상태는 저장 안 함 (이 경로에서는 해당 필드가 없을 것으로 예상되나 안전하게 삭제)
             delete pitchToAdd.selectedFile;
             delete pitchToAdd.uploading;
             delete pitchToAdd.uploadProgress;
             delete pitchToAdd.uploadError;

             pitchToAdd.number = Number(pitchToAdd.number);
             if (pitchToAdd.bolts !== null && pitchToAdd.bolts !== undefined) {
                 pitchToAdd.bolts = Number(pitchToAdd.bolts);
             } else {
                 delete pitchToAdd.bolts;
             }
             // imagePath 필드는 여기서 직접 입력받거나 (현재 폼처럼) 아니면 업로드 로직 추가 필요

             const docRef = await addDoc(pitchesCollectionRef, pitchToAdd);
             console.log(`[MapManagement] 라우트 "${selectedRouteId.value}"에 새 피치 추가 완료. ID: ${docRef.id}`);
             alert("새 피치가 추가되었습니다.");
         }

         await fetchPitchesForRoute(selectedRouteId.value);
         currentView.value = 'pitchList';
         editingPitch.value = null; // 수정 중 피치 초기화
         selectedExistingPitchImageFile.value = null; // 파일 상태 초기화 (수정 시)


    } catch (e) {
        console.error("[MapManagement] 피치 저장 오류:", e);
        alert(`피치 저장 중 오류 발생: ${e.message}`);
        pitchError.value = e;
    } finally {
         loadingPitches.value = false; // 피치 저장 로딩 완료
         // 업로드 상태는 해당 로직에서 해제됨
    }
};


// 피치 폼에서 취소 함수 (동일)
const cancelPitchEdit = () => {
    console.log("[MapManagement] 피치 폼에서 '취소' 버튼 클릭.");
    editingPitch.value = null;
    selectedExistingPitchImageFile.value = null; // 파일 상태 초기화
    uploadingExistingPitchImage.value = false;
    uploadExistingPitchProgress.value = 0;
    uploadExistingPitchError.value = null;
    currentView.value = 'pitchList';
};

// 피치 삭제 함수 구현 (동일)
const deletePitch = async (routeId, pitchId) => { /* ... 동일 ... */ };


// 컴포넌트 마운트 시 루트 목록 가져오기 (동일)
onMounted(() => {
  fetchRoutes();
});
</script>

<style scoped>
/* ✅✅✅ Admin 지도 관리 페이지 스타일 - 피치 정보 입력 섹션 관련 스타일 추가 ✅✅✅ */
.admin-map-management {
    padding: 20px;
    max-width: 900px;
    margin: 20px auto;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: relative; /* 로딩 오버레이 기준점 */
}

.admin-map-management h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
}

.add-button {
    display: block;
    margin: 0 auto 20px;
    padding: 10px 20px;
    background-color: #28a745;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease;
}
.add-button:hover {
    background-color: #218838;
}

/* -------------- 목록 스타일 (루트/피치 공통) -------------- */
.route-list, .pitch-list {
    margin-top: 20px;
    border-top: 1px solid #eee;
    padding-top: 20px;
}

.route-list h3, .pitch-list h3 {
    font-size: 1.3em;
    margin-bottom: 15px;
    color: #555;
}

.route-list ul, .pitch-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.route-item, .pitch-item {
    border: 1px solid #ddd;
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #f9f9f9;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.route-info p, .pitch-info p {
    margin: 0 0 5px 0;
    color: #333;
    font-size: 0.95em;
}
.route-info p:last-child, .pitch-info p:last-child {
    margin-bottom: 0;
}
.route-info strong, .pitch-info strong {
    color: #555;
    margin-right: 5px;
}

.route-actions, .pitch-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.action-button {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.2s ease;
    background-color: #007bff;
    color: white;
}
.action-button:hover {
    background-color: #0056b3;
}

.action-button.delete {
    background-color: #dc3545;
}
.action-button.delete:hover {
    background-color: #c82333;
}
/* 작은 삭제 버튼 스타일 */
.action-button.delete.small {
    padding: 4px 8px; /* 크기 줄임 */
    font-size: 0.8em; /* 글자 크기 줄임 */
    align-self: flex-end; /* 오른쪽 정렬 */
}


/* -------------- 폼 스타일 (루트/피치 공통) -------------- */
.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    font-size: 1em;
}

.form-group textarea {
    resize: vertical;
    min-height: 80px;
}

.form-actions {
    margin-top: 20px;
    text-align: right;
}

.form-actions .action-button {
    margin-left: 10px;
}

/* -------------- 새 루트 폼의 피치 정보 입력 섹션 스타일 -------------- */
.new-pitches-section {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px dashed #ccc; /* 점선 구분선 */
}

.new-pitches-section h3 {
    font-size: 1.4em;
    margin-bottom: 15px;
    color: #333;
}

.section-description {
    font-size: 0.9em;
    color: #666;
    margin-bottom: 15px;
}

.add-pitch-button {
    display: inline-block; /* 블록 대신 인라인 블록 */
    margin-bottom: 20px;
    padding: 8px 15px;
    background-color: #17a2b8; /* Info 색상 */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.2s ease;
}
.add-pitch-button:hover {
    background-color: #138496;
}

.pitch-forms-list {
    margin-top: 15px;
}

.pitch-form-item {
    border: 1px solid #b3e5fc; /* 연한 파랑 테두리 */
    border-radius: 5px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #e1f5fe; /* 연한 파랑 배경 */
    position: relative; /* 삭제 버튼 위치 조정을 위해 */
}

.pitch-form-item h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #0277bd; /* 진한 파랑 */
    font-size: 1.1em;
    border-bottom: 1px solid #b3e5fc;
    padding-bottom: 5px;
}

.pitch-form-item .action-button.delete {
    position: absolute;
    top: 10px;
    right: 10px;
}

/* ✅✅✅ 로딩 오버레이 스타일 ✅✅✅ */
.loading-overlay {
    position: fixed; /* 전체 화면 고정 */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* 반투명 검정 배경 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* 다른 요소들 위에 표시 */
    color: white;
    font-size: 1.2em;
}

.loading-content {
    text-align: center;
    background: #333;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.spinner {
  border: 4px solid #f3f3f3; /* Light grey */
  border-top: 4px solid #3498db; /* Blue */
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 10px auto; /* 로딩 메시지 아래 중앙에 위치 */
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}


/* 로딩/오류 메시지 스타일 */
.loading-message, .error-message {
    text-align: center;
    margin-top: 20px;
    font-style: italic;
}
.error-message {
    color: red;
}
</style>