<template>
  <div class="route-form-section">
    <h2>{{ isEditing ? "루트 수정" : "새 루트 추가" }}</h2>

    <!-- ⭐⭐ 루트 기본 정보 폼 ⭐⭐ -->
    <div class="route-base-form">
      <div class="route-base-row">
        <label for="">루트 이름</label>
        <input type="text" v-model="routeName" placeholder="루트 이름" />
      </div>
      <div class="route-base-row">
        <label for="">위도</label>
        <input type="text" v-model="routeLocationLat" placeholder="위도" />
      </div>
      <div class="route-base-row">
        <label for="">경도</label>
        <input type="text" v-model="routeLocationLng" placeholder="경도" />
      </div>
      <div class="route-base-row">
        <label for="">등반 개요</label>
        <input type="text" v-model="climbingOverview" placeholder="등반 개요" />
      </div>
      <div class="route-base-row">
        <label for="">등반 형태</label>
        <input type="text" v-model="climbingStyle" placeholder="등반 형태" />
      </div>
      <div class="route-base-row">
        <label for="">등반 장비</label>
        <input type="text" v-model="climbingGear" placeholder="등반 장비" />
      </div>
      <div class="route-base-row">
        <label for="">평균 난이도</label>
        <input
          type="text"
          v-model="averageDifficulty"
          placeholder="평균 난이도"
        />
      </div>
      <div class="route-base-row">
        <label for="">개척자</label>
        <input type="text" v-model="developer" placeholder="개척자" />
      </div>
      <div class="route-base-row">
        <label for="">이미지 첨부</label>
        <input type="file" @change="handleImageChange" accept="image/*" />
      </div>

      <!-- 이미지 미리보기 -->
      <div v-if="selectedImageUrl" class="image-preview">
        <p>현재 이미지:</p>
        <div v-if="
            isEditing &&
            selectedImageUrl &&
            !selectedImageUrl.startsWith('blob:')
          ">
        <button @click="removeExistingImage">기존 이미지를 삭제</button>
        </div>
        <button
          v-else-if="selectedImageUrl && selectedImageUrl.startsWith('blob:')"
          @click="cancelSelectedImage"
        >
          선택한 이미지를 취소
        </button>
        <img
          :src="selectedImageUrl"
          :alt="isEditing ? '기존 이미지' : '선택된 이미지'"
        />
        
        
      </div>

      <!-- 액션 버튼 (루트 저장/취소) -->
      <div class="route-form-actions">
        <button @click="cancelEdit" :disabled="isSaving" class="outline">취소</button>
        <!-- ✅ 취소 버튼 비활성화 추가 -->
        <button @click="saveForm" :disabled="!isFormValid || isSaving">
          {{ isSaving ? "저장 중..." : isEditing ? "루트 수정" : "루트 추가" }}
        </button>
      </div>
    </div>

    <!-- ⭐⭐ 피치 관리 섹션 (수정 모드에서만 표시) ⭐⭐ -->
    <div v-if="isEditing" class="pitch-management-section">
      <div class="pitch-management-tit">
        <h3>피치 관리</h3>
        <button class="add-pitch-button" @click="openAddPitchForm">
          피치 추가
        </button>
      </div>
      <!-- 피치 추가 버튼 -->

      <!-- 피치 목록 -->
      <div v-if="pitches.length > 0" class="pitch-list">
        <h4>등록된 피치 (총 {{ pitches.length }}개)</h4>
        <ul>
          <li v-for="pitch in pitches" :key="pitch.id">
            <span>
            {{ pitch.number }}피치 - {{ pitch.name || "이름 없음" }} ({{
              pitch.difficulty || "정보 없음"
            }})
            </span>
            <!-- 피치 액션 버튼 -->
            <button @click="editPitch(pitch)">수정</button>
            <button @click="confirmDeletePitch(pitch.id)">삭제</button>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>등록된 피치가 없습니다.</p>
      </div>

      <!-- ⭐⭐ 피치 추가/수정 폼 (버튼 클릭 시 표시) ⭐⭐ -->
      <div v-if="showPitchForm" class="pitch-form-container">
        <h4>{{ isEditingPitch ? "피치 수정" : "새 피치 추가" }}</h4>

        <!-- 수정 모드일 때 피치 ID 표시 -->
        <div v-if="isEditingPitch && currentPitchId" class="pitch-id-display">
          <p><strong>피치 ID:</strong> {{ currentPitchId }}</p>
        </div>

        <!-- 피치 입력 필드 -->
        <input
          type="hidden"
          v-model="pitchNumber"
          value="1"
          placeholder="피치 번호 (예: 1, 2)"
        />
        <input
          type="text"
          v-model="pitchName"
          placeholder="피치 이름 (선택 사항)"
        />
        <input type="text" v-model="pitchLength" placeholder="길이 (예: 20m)" />
        <input
          type="text"
          v-model="pitchDifficulty"
          placeholder="난이도 (예: 5.10a)"
        />
        <input
          type="text"
          v-model="pitchClimbingStyle"
          placeholder="등반 형태 (예: 슬랩, 크랙)"
        />
        <input
          type="number"
          v-model="pitchBolts"
          placeholder="볼트 수 (숫자만)"
        />

        <!-- 피치 이미지 업로드 -->
        <input type="file" @change="handlePitchImageChange" accept="image/*" />

        <!-- 피치 이미지 미리보기 -->
        <div v-if="selectedPitchImageUrl" class="image-preview">
          <p>현재 피치 이미지:</p>
          <img :src="selectedPitchImageUrl" alt="피치 이미지" />
          <!-- 수정 모드에서 기존 이미지거나, 추가 모드에서 선택한 이미지 취소 -->
          <button
            v-if="
              isEditingPitch &&
              selectedPitchImageUrl &&
              !selectedPitchImageUrl.startsWith('blob:')
            "
            @click="removeExistingPitchImage"
          >
            기존 피치 이미지 제거
          </button>
          <button
            v-else-if="
              selectedPitchImageUrl && selectedPitchImageUrl.startsWith('blob:')
            "
            @click="cancelSelectedPitchImage"
          >
            선택한 피치 이미지 취소
          </button>
        </div>

        <!-- ✅ 추가: 피치 저장 중 로딩 메시지 ✅ -->
        <div v-if="isSavingPitch" class="loading-message">피치 저장 중...</div>

        <!-- 피치 폼 액션 버튼 -->
        <button
          @click="savePitch"
          :disabled="!isPitchFormValid || isSavingPitch"
        >
          {{
            isSavingPitch
              ? "저장 중..."
              : isEditingPitch
              ? "피치 수정"
              : "피치 추가"
          }}
        </button>
        <button @click="cancelPitchForm" :disabled="isSavingPitch">취소</button>
        <!-- ✅ 취소 버튼 비활성화 추가 -->

        <div v-if="pitchFormError" class="error-message">
          {{ pitchFormError.message }}
        </div>
        <!-- 피치 폼 오류 메시지 -->
      </div>
    </div>

    <!-- ✅ 기존: 전체 저장 중 로딩 메시지 ✅ -->
    <div v-if="isSaving" class="loading-message">저장 중...</div>
    <div v-if="formError" class="error-message">{{ formError.message }}</div>
  </div>
</template>
  
  <script setup>
/* eslint-disable no-undef */

import { ref, watch, computed, toRefs, onUnmounted } from "vue";

// Props 정의
const props = defineProps({
  initialRouteData: {
    // 수정할 루트 데이터 객체 (추가 모드에서는 null)
    type: Object,
    default: null,
  },
  isEditing: {
    // 수정 모드인지 여부
    type: Boolean,
    default: false,
  },
  pitches: {
    // 현재 루트의 피치 목록 Prop 추가
    type: Array,
    default: () => [],
  },
});

// props를 분할하여 직접 액세스 가능하게 (toRefs 사용으로 반응성을 유지)
const { initialRouteData, isEditing, pitches } = toRefs(props);

// Emits 정의
const emit = defineEmits([
  "save",
  "cancel",
  "add-pitch",
  "edit-pitch",
  "delete-pitch",
]); // 피치 관련 이벤트는 MapManagement로 보냄

// 폼 상태 변수 (루트 정보)
const routeName = ref("");
const routeLocationLat = ref("");
const routeLocationLng = ref("");
// Added new state variables for route
const climbingOverview = ref("");
const climbingStyle = ref("");
const climbingGear = ref("");
const averageDifficulty = ref(""); // Renamed from routeDifficulty
const developer = ref("");

const selectedImageFile = ref(null); // 선택된 루트 이미지 파일 객체
const selectedImageUrl = ref(""); // 루트 이미지 미리보기를 위한 URL (blob URL 또는 Storage URL)
const isSaving = ref(false); // ✅ 루트 저장 중 상태 (이 컴포넌트 내에서만 사용, 이미지 포함 전체 저장 과정)
const formError = ref(null); // 루트 폼 관련 오류 상태

// 피치 폼 관련 상태 변수
const showPitchForm = ref(false); // 피치 추가/수정 폼 표시 상태
const isEditingPitch = ref(false); // 피치 수정 모드 상태
const currentPitchId = ref(null); // 수정 중인 피치 ID

// 피치 입력 필드 상태
const pitchNumber = ref(null); // 피치 번호 (숫자)
const pitchName = ref(""); // 피치 이름 (선택 사항)
const pitchLength = ref(""); // 길이
const pitchDifficulty = ref(""); // 난이도
const pitchClimbingStyle = ref(""); // 등반 형태
const pitchBolts = ref(null); // 볼트 수 (숫자)
const selectedPitchImageFile = ref(null); // 선택된 피치 이미지 파일 객체
const selectedPitchImageUrl = ref(""); // 피치 이미지 미리보기를 위한 URL
const originalPitchImageUrl = ref(""); // 수정 시 기존 피치 이미지 URL 저장
const pitchFormError = ref(null); // 피치 폼 관련 오류 상태
const isSavingPitch = ref(false); // ✅ 피치 저장 중 상태 (피치 이미지 포함 피치 저장 과정)

// 피치 폼 초기화 함수 (내부 헬퍼)
const resetPitchForm = () => {
  showPitchForm.value = false;
  isEditingPitch.value = false;
  currentPitchId.value = null; // Reset pitch ID when form is reset
  pitchNumber.value = null; // 숫자는 null로 초기화
  pitchName.value = "";
  pitchLength.value = "";
  pitchDifficulty.value = "";
  pitchClimbingStyle.value = "";
  pitchBolts.value = null; // 숫자는 null로 초기화
  selectedPitchImageFile.value = null;
  selectedPitchImageUrl.value = "";
  originalPitchImageUrl.value = "";
  pitchFormError.value = null;
  isSavingPitch.value = false; // 피치 저장 상태도 초기화
  const pitchFileInput = document.querySelector(
    '.pitch-form-container input[type="file"]'
  );
  if (pitchFileInput) pitchFileInput.value = "";
  console.log("[RouteFormView] 피치 폼이 초기화되었습니다.");
};

// 폼 전체 초기화 함수 (내부 헬퍼 - 현재 사용되지 않지만 유지)
// 이 함수는 MapManagement에서 직접 호출될 수 있습니다.
const resetForm = () => {
  routeName.value = "";
  routeLocationLat.value = "";
  routeLocationLng.value = "";
  climbingOverview.value = "";
  climbingStyle.value = "";
  climbingGear.value = "";
  averageDifficulty.value = "";
  developer.value = "";
  selectedImageFile.value = null;
  selectedImageUrl.value = "";
  isSaving.value = false; // 루트 저장 상태도 초기화
  formError.value = null;
  const fileInput = document.querySelector(
    '.route-form-section input[type="file"]'
  );
  if (fileInput) fileInput.value = "";

  // resetForm이 호출될 때는 피치 폼도 함께 초기화
  resetPitchForm(); // Use the helper function
  console.log("[RouteFormView] 루트 및 피치 폼 전체가 초기화되었습니다.");
};

// initialRouteData Prop 변경 감지 및 폼 데이터 초기화
watch(
  initialRouteData,
  (newVal) => {
    console.log("[RouteFormView] initialRouteData 변경 감지:", newVal);
    if (newVal) {
      // 수정 모드일 때 루트 폼을 채움
      routeName.value = newVal.name || "";
      routeLocationLat.value = newVal.location
        ? String(newVal.location.lat)
        : "";
      routeLocationLng.value = newVal.location
        ? String(newVal.location.lng)
        : "";
      climbingOverview.value = newVal.climbingOverview || "";
      climbingStyle.value = newVal.climbingStyle || "";
      climbingGear.value = newVal.climbingGear || "";
      averageDifficulty.value = newVal.averageDifficulty || "";
      developer.value = newVal.developer || "";
      selectedImageUrl.value = newVal.imageUrl || "";
      selectedImageFile.value = null;
      formError.value = null;
      const fileInput = document.querySelector(
        '.route-form-section input[type="file"]'
      );
      if (fileInput) fileInput.value = "";

      // initialRouteData가 변경(수정 모드 진입)될 때 피치 폼 상태 초기화
      resetPitchForm(); // Use the helper function

      console.log(
        "[RouteFormView] 루트 폼 채움 및 피치 폼 초기화 (수정 모드 진입)."
      );
    } else {
      // 추가 모드 또는 수정 취소 시 폼 상태 전체를 직접 초기화
      routeName.value = "";
      routeLocationLat.value = "";
      routeLocationLng.value = "";
      climbingOverview.value = "";
      climbingStyle.value = "";
      climbingGear.value = "";
      averageDifficulty.value = "";
      developer.value = "";
      selectedImageFile.value = null;
      selectedImageUrl.value = "";
      isSaving.value = false; // 루트 저장 상태 초기화
      formError.value = null;
      const fileInput = document.querySelector(
        '.route-form-section input[type="file"]'
      );
      if (fileInput) fileInput.value = "";

      // 피치 폼 상태도 직접 초기화
      resetPitchForm(); // Use the helper function

      console.log(
        "[RouteFormView] 루트 및 피치 폼 상태가 직접 초기화되었습니다 (추가 모드/취소)."
      );
    }
  },
  { immediate: true, deep: true }
);

// 폼 유효성 검사 (간단 예시) - 루트 폼 유효성
const isFormValid = computed(() => {
  const latString = String(routeLocationLat.value);
  const lngString = String(routeLocationLng.value);

  const lat = parseFloat(latString);
  const lng = parseFloat(lngString);

  return (
    routeName.value.trim() !== "" &&
    latString.trim() !== "" &&
    lngString.trim() !== "" &&
    String(averageDifficulty.value).trim() !== "" && // averageDifficulty도 비어있지 않아야 함
    !isNaN(lat) && // 위도가 유효한 숫자인지
    !isNaN(lng)
  ); // 경도가 유효한 숫자인지
});

// 이미지 파일 변경 핸들러 (루트 이미지)
const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedImageFile.value = file;
    selectedImageUrl.value = URL.createObjectURL(file); // 미리보기 URL 생성
    console.log(
      `[RouteFormView] 루트 이미지 파일이 선택되었습니다: ${file.name}`
    );
    formError.value = null; // 오류 초기화
  } else {
    selectedImageFile.value = null;
    // 파일 선택 취소 시, 수정 모드에서 기존 이미지가 없었다면 미리보기 URL 비움
    if (!isEditing.value && !initialRouteData.value?.imageUrl) {
      selectedImageUrl.value = "";
    }
    console.log("[RouteFormView] 루트 이미지 파일 선택이 취소되었습니다.");
  }
};

// 선택한 새 이미지 취소 핸들러 (루트 이미지)
const cancelSelectedImage = () => {
  selectedImageFile.value = null;
  // 취소 시, 수정 모드면 기존 이미지 URL 복원, 추가 모드면 빈 문자열
  selectedImageUrl.value = isEditing.value
    ? initialRouteData.value?.imageUrl || ""
    : "";
  // 파일 입력 필드 초기화 (동일 파일 다시 선택 가능하게)
  const fileInput = document.querySelector(
    '.route-form-section input[type="file"]'
  );
  if (fileInput) fileInput.value = "";
  console.log("[RouteFormView] 선택한 루트 이미지가 취소되었습니다.");
};

// 기존 이미지 제거 핸들러 (루트 이미지 - 수정 모드)
const removeExistingImage = () => {
  selectedImageUrl.value = null; // 미리보기 URL 제거
  selectedImageFile.value = null; // 새 파일 선택 상태 제거
  const fileInput = document.querySelector(
    '.route-form-section input[type="file"]'
  );
  if (fileInput) fileInput.value = ""; // 파일 입력 필드 초기화
  console.log("[RouteFormView] 기존 루트 이미지 제거 요청이 감지되었습니다.");
};

// 폼 저장 버튼 클릭 핸들러 (루트 저장)
const saveForm = async () => {
  if (!isFormValid.value) {
    formError.value = new Error(
      "루트의 모든 필수 정보를 올바르게 입력해주세요 (이름, 위도, 경도, 평균 난이도)."
    );
    return;
  }

  isSaving.value = true; // ✅ 루트 저장 시작 시 로딩 상태 ON
  formError.value = null;

  const formData = {
    id: initialRouteData.value?.id || null,
    name: routeName.value,
    location: {
      lat: parseFloat(String(routeLocationLat.value)),
      lng: parseFloat(String(routeLocationLng.value)),
    },
    climbingOverview: climbingOverview.value,
    climbingStyle: climbingStyle.value,
    climbingGear: climbingGear.value,
    averageDifficulty: averageDifficulty.value, // Changed from routeDifficulty
    developer: developer.value,

    selectedImageFile: selectedImageFile.value,
    // 기존 이미지 제거 요청 플래그: 수정 모드이고, 새 파일을 선택 안 했으며, URL 미리보기가 없고, 원래 이미지가 있었을 때
    removeExistingImage:
      isEditing.value &&
      !selectedImageFile.value &&
      !selectedImageUrl.value &&
      initialRouteData.value?.imageUrl,
  };

  console.log(
    "[RouteFormView] 'save' 이벤트 발생 예정 (루트). 데이터:",
    formData
  );
  try {
    // 부모 컴포넌트의 save 핸들러 호출 및 완료 대기
    // MapManagement에서 이미지 업로드 및 Firestore 저장이 모두 완료될 때까지 기다립니다.
    await emit("save", formData);
    console.log("[RouteFormView] 'save' 이벤트 처리 완료 (MapManagement에서).");
    // MapManagement에서 저장이 성공하면 모달을 닫고 리스트를 새로고침합니다.
  } catch (e) {
    console.error("[RouteFormView] 'save' 이벤트 처리 중 오류 발생:", e);
    // MapManagement에서 오류를 throw하면 여기서 잡아서 메시지 표시
    formError.value = new Error(
      `저장 처리 중 오류가 발생했습니다: ${e.message}`
    );
  } finally {
    isSaving.value = false; // ✅ 루트 저장 완료 시 로딩 상태 OFF
  }
};

// 폼 취소 버튼 클릭 핸들러 (루트 취소)
const cancelEdit = () => {
  console.log("[RouteFormView] 'cancel' 이벤트 발생 (루트).");
  emit("cancel");
};

// 피치 추가 폼 열기 핸들러
const openAddPitchForm = () => {
  resetPitchForm(); // 피치 폼 상태 초기화
  showPitchForm.value = true;
  isEditingPitch.value = false; // 추가 모드로 설정
  console.log("[RouteFormView] 피치 추가 폼 열기.");
};

// 피치 수정 폼 열기 핸들러
const editPitch = (pitch) => {
  resetPitchForm(); // 피치 폼 상태 초기화
  showPitchForm.value = true;
  isEditingPitch.value = true; // 수정 모드로 설정
  currentPitchId.value = pitch.id; // 수정할 피치 ID 설정

  // 피치 폼 필드 채우기 (불러온 데이터 사용)
  pitchNumber.value = pitch.number || null;
  pitchName.value = pitch.name || "";
  pitchLength.value = pitch.length || "";
  pitchDifficulty.value = pitch.difficulty || "";
  pitchClimbingStyle.value = pitch.climbingStyle || "";
  pitchBolts.value = pitch.bolts === undefined ? null : pitch.bolts; // undefined일 경우 null로 처리
  selectedPitchImageUrl.value = pitch.imagePath || ""; // 기존 이미지 URL 미리보기
  originalPitchImageUrl.value = pitch.imagePath || ""; // 기존 이미지 URL 저장 (제거 판단용)
  selectedPitchImageFile.value = null; // 새 파일 선택 시 덮어쓰기 위해 null로 시작

  console.log(
    `[RouteFormView] 피치 수정 폼 열기 (ID: ${pitch.id})。 데이터:`,
    pitch
  );
};

// 피치 폼 취소 핸들러
const cancelPitchForm = () => {
  resetPitchForm();
  console.log("[RouteFormView] 피치 폼이 취소되었습니다.");
};

// 피치 이미지 파일 변경 핸들러
const handlePitchImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedPitchImageFile.value = file;
    selectedPitchImageUrl.value = URL.createObjectURL(file); // 미리보기 URL 생성
    console.log(`[RouteFormView] 피치 이미지 파일 선택됨: ${file.name}`);
    pitchFormError.value = null; // 오류 초기화
  } else {
    selectedPitchImageFile.value = null;
    // 파일 선택 취소 시, 수정 모드면 기존 이미지 URL 유지, 추가 모드면 빈 문자열
    selectedPitchImageUrl.value = isEditingPitch.value
      ? originalPitchImageUrl.value || ""
      : "";
    console.log("[RouteFormView] 피치 이미지 파일 선택 취소됨.");
  }
};

// 선택한 새 피치 이미지 취소 핸들러
const cancelSelectedPitchImage = () => {
  selectedPitchImageFile.value = null;
  // 취소 시, 수정 모드면 기존 이미지 URL 복원, 추가 모드면 빈 문자열
  selectedPitchImageUrl.value = isEditingPitch.value
    ? originalPitchImageUrl.value || ""
    : "";
  // 파일 입력 필드 초기화 (동일 파일 다시 선택 가능하게)
  const pitchFileInput = document.querySelector(
    '.pitch-form-container input[type="file"]'
  );
  if (pitchFileInput) pitchFileInput.value = "";
  console.log("[RouteFormView] 선택한 새 피치 이미지 취소됨.");
};

// 기존 피치 이미지 제거 핸들러 (수정 모드)
const removeExistingPitchImage = () => {
  selectedPitchImageUrl.value = null; // 미리보기 URL 제거
  // originalPitchImageUrl.value는 제거 요청 플래그 판단을 위해 유지
  selectedPitchImageFile.value = null; // 새 파일 선택 상태 제거
  const pitchFileInput = document.querySelector(
    '.pitch-form-container input[type="file"]'
  );
  if (pitchFileInput) pitchFileInput.value = ""; // 파일 입력 필드 초기화
  console.log("[RouteFormView] 기존 피치 이미지 제거 요청됨.");
};

// 피치 폼 유효성 검사 - numberValid 제거
const isPitchFormValid = computed(() => {
  // numberValid 부분을 제거합니다. 피치 번호는 더 이상 필수가 아님.

  const lengthValid = pitchLength.value.trim() !== "";
  const difficultyValid = pitchDifficulty.value.trim() !== "";
  const styleValid = pitchClimbingStyle.value.trim() !== "";
  // 볼트 수는 선택 사항이거나 0 이상의 유효한 숫자
  const boltsValid =
    pitchBolts.value === null ||
    pitchBolts.value === "" ||
    (!isNaN(Number(pitchBolts.value)) && Number(pitchBolts.value) >= 0);

  // length, difficulty, style이 비어있지 않고 boltsValid가 true인지 검사합니다.
  return lengthValid && difficultyValid && styleValid && boltsValid;
});

// 피치 저장 핸들러
const savePitch = async () => {
  // 유효성 검사 수행 (numberValid 제외)
  if (!isPitchFormValid.value) {
    // 피치 번호가 필수가 아니므로 메시지 수정
    pitchFormError.value = new Error(
      "피치 정보를 올바르게 입력해주세요 (길이, 난이도, 등반 형태 필수)."
    );
    return;
  }

  pitchFormError.value = null; // 오류 초기화
  isSavingPitch.value = true; // ✅ 피치 저장 시작 시 로딩 상태 ON

  // 피치 번호는 비어있을 경우 null 또는 0으로 처리 (데이터 스키마에 따라 결정)
  const pitchNumberValue =
    pitchNumber.value === null || pitchNumber.value === ""
      ? null
      : parseInt(String(pitchNumber.value));
  // 유효한 숫자가 아닌 경우도 null로 처리할 수 있습니다.
  // const pitchNumberValue = isNaN(Number(pitchNumber.value)) || pitchNumber.value === null || pitchNumber.value === '' ? null : parseInt(String(pitchNumber.value));

  const pitchData = {
    id: currentPitchId.value, // 수정 시 ID 포함 (추가 시에는 null)
    number: pitchNumberValue, // 처리된 피치 번호 값
    name: pitchName.value.trim(),
    length: pitchLength.value.trim(),
    difficulty: pitchDifficulty.value.trim(),
    climbingStyle: pitchClimbingStyle.value.trim(),
    bolts:
      pitchBolts.value === null || pitchBolts.value === ""
        ? null
        : parseInt(String(pitchBolts.value)), // 숫자로 변환, 비어있으면 null
    selectedPitchImageFile: selectedPitchImageFile.value, // 파일 객체 (Firestore에 저장 안 함)
    // 기존 피치 이미지 제거 요청 플래그: 수정 모드이고, 원래 이미지가 있었으며, 새 파일 없고, 미리보기도 없을 때
    removeExistingImage:
      isEditingPitch.value &&
      originalPitchImageUrl.value &&
      !selectedPitchImageFile.value &&
      !selectedPitchImageUrl.value,
  };

  console.log("[RouteFormView] 피치 저장 이벤트 발생 예정. 데이터:", pitchData);

  try {
    if (isEditingPitch.value) {
      // 수정 모드: 'edit-pitch' 이벤트 발생
      if (initialRouteData.value?.id) {
        // 부모 컴포넌트의 edit-pitch 핸들러 호출 및 완료 대기
        // MapManagement에서 이미지 업로드 및 Firestore 저장이 모두 완료될 때까지 기다립니다.
        await emit("edit-pitch", {
          routeId: initialRouteData.value.id,
          pitchData: pitchData,
        });
        console.log(
          "[RouteFormView] 피치 수정 이벤트 처리 완료 (MapManagement에서)."
        );
      } else {
        console.error(
          "[RouteFormView] 피치 수정 오류: 부모 루트 ID를 찾을 수 없습니다."
        );
        pitchFormError.value = new Error(
          "루트 정보를 찾을 수 없어 피치를 수정할 수 없습니다."
        );
        // 오류 발생 시 isSavingPitch 상태를 해제해야 합니다.
        isSavingPitch.value = false;
        return; // 오류 발생 시 함수 종료
      }
    } else {
      // 추가 모드: 'add-pitch' 이벤트 발생
      if (initialRouteData.value?.id) {
        // 부모 컴포넌트의 add-pitch 핸들러 호출 및 완료 대기
        // MapManagement에서 이미지 업로드 및 Firestore 저장이 모두 완료될 때까지 기다립니다.
        await emit("add-pitch", {
          routeId: initialRouteData.value.id,
          pitchData: pitchData,
        });
        console.log(
          "[RouteFormView] 피치 추가 이벤트 처리 완료 (MapManagement에서)."
        );
      } else {
        console.error(
          "[RouteFormView] 피치 추가 오류: 부모 루트 ID를 찾을 수 없습니다."
        );
        pitchFormError.value = new Error(
          "루트 정보를 찾을 수 없어 피치를 추가할 수 없습니다."
        );
        // 오류 발생 시 isSavingPitch 상태를 해제해야 합니다.
        isSavingPitch.value = false;
        return; // 오류 발생 시 함수 종료
      }
    }

    // 저장이 성공하면 피치 폼 닫기 및 초기화
    cancelPitchForm(); // cancelPitchForm 내부에서 isSavingPitch를 false로 설정
    console.log("[RouteFormView] 피치 폼 닫기 (저장 완료).");
  } catch (e) {
    console.error(
      "[RouteFormView] 피치 저장 중 오류 발생 (MapManagement에서 전달):",
      e
    );
    // MapManagement에서 오류를 throw하면 여기서 잡아서 메시지 표시
    pitchFormError.value = new Error(
      `피치 저장 중 오류가 발생했습니다: ${e.message}`
    );
    isSavingPitch.value = false; // ✅ 피치 저장 완료 시 로딩 상태 OFF (오류 발생 시)
  }
  // finally 블록은 emit이 성공적으로 완료되었을 때도 실행되어 isSavingPitch가 false가 됨
  // cancelPitchForm() 내부에서 isSavingPitch.value = false; 가 이미 처리됩니다.
  // 따라서 finally 블록은 필요 없습니다.
  // finally {
  //     isSavingPitch.value = false; // 저장 중 상태 종료
  // }
};

// 피치 삭제 확인 핸들러
const confirmDeletePitch = (pitchId) => {
  console.log(`[RouteFormView] 피치 삭제 요청 (ID: ${pitchId}).`);
  // 피치 삭제 중에는 삭제 버튼 비활성화는 필요 없지만, 루트나 피치 저장 중에는 비활성화 가능
  if (isSaving.value || isSavingPitch.value) {
    console.log("[RouteFormView] 현재 저장 중이므로 피치 삭제 불가.");
    return;
  }
  if (initialRouteData.value?.id) {
    // 부모 컴포넌트의 delete-pitch 핸들러 호출
    // 피치 삭제 자체 로딩 상태는 MapManagement에서 관리하는 것이 더 적합할 수 있습니다.
    // 여기서는 별도 로딩 상태를 추가하지 않습니다.
    emit("delete-pitch", {
      routeId: initialRouteData.value.id,
      pitchId: pitchId,
    });
  } else {
    console.error(
      "[RouteFormView] 피치 삭제 오류: 부모 루트 ID를 찾을 수 없습니다."
    );
    alert("루트 정보를 찾을 수 없어 피치를 삭제할 수 없습니다.");
  }
};

// 컴포넌트 언마운트 시 Blob URL 해제
watch(
  [selectedImageUrl, selectedPitchImageUrl],
  ([newRouteUrl, newPitchUrl], [oldRouteUrl, oldPitchUrl]) => {
    if (
      oldRouteUrl &&
      oldRouteUrl.startsWith("blob:") &&
      oldRouteUrl !== newRouteUrl
    ) {
      URL.revokeObjectURL(oldRouteUrl);
      console.log("[RouteFormView] 이전 루트 Blob URL 해제됨:", oldRouteUrl);
    }
    if (
      oldPitchUrl &&
      oldPitchUrl.startsWith("blob:") &&
      oldPitchUrl !== newPitchUrl
    ) {
      URL.revokeObjectURL(oldPitchUrl);
      console.log("[RouteFormView] 이전 피치 Blob URL 해제됨:", oldPitchUrl);
    }
  },
  { immediate: true }
);

// 컴포넌트가 사라질 때 현재 Blob URL이 있다면 해제
onUnmounted(() => {
  if (selectedImageUrl.value && selectedImageUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(selectedImageUrl.value);
    console.log(
      "[RouteFormView] 컴포넌트 언마운트 시 루트 Blob URL 해제됨:",
      selectedImageUrl.value
    );
  }
  if (
    selectedPitchImageUrl.value &&
    selectedPitchImageUrl.value.startsWith("blob:")
  ) {
    URL.revokeObjectURL(selectedPitchImageUrl.value);
    console.log(
      "[RouteFormView] 컴포넌트 언마운트 시 피치 Blob URL 해제됨:",
      selectedPitchImageUrl.value
    );
  }
});

// MapManagement에서 cancelPitchForm 함수에 접근하기 위해 노출 (expose)
defineExpose({
  cancelPitchForm,
  resetForm, // MapManagement에서 루트 폼 전체 초기화 필요 시 사용
});
</script>
  
  <style scoped>
/* 기존 폼 스타일 유지 */
.route-form-section {
  margin-bottom: 0; /* 모달 내 하단 마진 불필요 */
  padding: 0; /* 모달 콘텐츠 영역 패딩 사용 */
  background-color: transparent; /* 모달 배경 사용 */
  border: none; /* 모달 보더 사용 */
  box-shadow: none; /* 모달 섀도우 사용 */
}

/* 폼 섹션 타이틀 */
h2 {
  text-align: left;
  font-weight: bold;
  color: #007bff;
  margin-bottom: 20px; /* 버튼과의 간격 */
  padding-bottom: 10px;
  border-bottom: 1px solid #eee; /* 타이틀 아래 구분선 */
}

/* 루트 기본 정보 폼 섹션 */
.route-base-form {
}

.route-base-form h3 {
  text-align: center;
  color: #555;
  margin-bottom: 15px;
}

.route-base-form input[type="text"],
.route-base-form input[type="file"] {
  display: block;
  width: calc(100% - 22px);
  padding: 5px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

/* 이미지 미리보기 스타일 */
.image-preview {
  margin-top: 10px;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  text-align: center;
}

.image-preview p {
  margin-top: 0;
  margin-bottom: 10px;
  font-weight: bold;
  color: #555;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  max-height: 200px;
  border-radius: 4px;
}

.image-preview button {
  display: inline-block;
  margin: 10px 5px 0;
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}
.image-preview button:hover {
  background-color: #c82333;
}

/* ⭐⭐ 피치 관리 섹션 스타일 ⭐⭐ */
.pitch-management-section {
  margin-top: 50px;
  padding-top: 20px;
  border-top: 1px solid #e1e1e1;
}
.pitch-management-tit{
    margin-bottom: 15px;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.pitch-management-section h3 {
  color: #007bff;
  font-weight: bold;
  flex: 1;
  
}

.add-pitch-button {
  display: block;
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
}
.add-pitch-button:hover {
  background-color: #0056b3;
}

.pitch-list {
  margin-top: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.pitch-list h4 {
  margin-top: 5px;
  margin-bottom: 10px;
  color: #333;
  font-size: 12px;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 5px;
}

.pitch-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pitch-list li {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
  color: #444;
}
.pitch-list li span{
    flex: 1;
}

.pitch-list li:last-child {
  margin-bottom: 0;
}

.pitch-list li button {
  padding: 3px 8px;
  margin-left: 5px;
  font-size: 0.8em;
  border-radius: 3px;
  cursor: pointer;
}

.pitch-list li button:first-of-type {
  /* 수정 버튼 */
  background-color: #ffc107;
  color: #212529;
  border: none;
}
.pitch-list li button:first-of-type:hover {
  background-color: #e0a800;
}

.pitch-list li button:last-of-type {
  /* 삭제 버튼 */
  background-color: #dc3545;
  color: white;
  border: none;
}
.pitch-list li button:last-of-type:hover {
  background-color: #c82333;
}

/* ⭐⭐ 피치 추가/수정 폼 컨테이너 스타일 ⭐⭐ */
.pitch-form-container {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #007bff;
  border-radius: 8px;
  background-color: #e9f3ff;
}

.pitch-form-container h4 {
  text-align: center;
  color: #0056b3;
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #007bff;
}

/* 피치 입력 필드 스타일 (루트 입력 필드와 유사) */
.pitch-form-container input[type="text"],
.pitch-form-container input[type="number"] {
  /* 숫자 입력 타입 추가 */
  display: block;
  width: calc(100% - 22px);
  margin-bottom: 10px;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
}

/* 피치 이미지 파일 입력 스타일 */
.pitch-form-container input[type="file"] {
  display: block;
  width: calc(100% - 22px);
  margin-bottom: 10px;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
  background-color: #fff; /* 파일 선택 버튼 배경색 */
}

/* 피치 이미지 미리보기 스타일 (루트 이미지와 유사) */
.pitch-form-container .image-preview {
  margin-top: 10px;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  text-align: center;
}

.pitch-form-container .image-preview p {
  margin-top: 0;
  margin-bottom: 10px;
  font-weight: bold;
  color: #555;
  font-size: 0.9em; /* 루트 이미지보다 작게 */
}

.pitch-form-container .image-preview img {
  max-width: 100%;
  height: auto;
  max-height: 150px; /* 루트 이미지보다 작게 */
  border-radius: 4px;
}

.pitch-form-container .image-preview button {
  display: inline-block;
  margin: 10px 5px 0;
  padding: 4px 8px; /* 루트 이미지보다 작게 */
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em; /* 루트 이미지보다 작게 */
}
.pitch-form-container .image-preview button:hover {
  background-color: #c82333;
}

/* 피치 폼 액션 버튼 스타일 */
.pitch-form-container button {
  padding: 8px 15px;
  margin-right: 10px;
  margin-top: 10px; /* 필드とボタン 사이 간격 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.pitch-form-container button:first-of-type {
  /* 피치 저장 버튼 */
  background-color: #28a745;
  color: white;
}
.pitch-form-container button:first-of-type:hover {
  background-color: #218838;
}
.pitch-form-container button:first-of-type:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.pitch-form-container button:last-of-type {
  /* 피치 취소 버튼 */
  background-color: #6c757d;
  color: white;
}
.pitch-form-container button:last-of-type:hover {
  background-color: #5a6268;
}

/* 피치 폼 오류 메시지 */
.pitch-form-container .error-message {
  text-align: center;
  margin-top: 10px;
  font-style: italic;
  color: red;
  font-size: 0.9em;
}

/* 루트 폼 액션 버튼 영역 */
.route-form-actions {
  margin-top: 30px;
  text-align: center;
}

.route-form-actions button {
  padding: 10px 15px;
  margin: 0 3px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}
.route-form-actions button.outline{
    border: 1px solid #e1e1e1;
    background: #fff;
    color: #222;
}

.route-form-actions button:hover {
  background-color: #0056b3;
  color: #fff;
}

.route-form-actions button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading-message,
.error-message {
  text-align: center;
  margin-top: 15px;
  font-style: italic;
}
.error-message {
  color: red;
}
.route-base-row {
  display: flex;
  flex-direction: column;
}
.route-base-row + .route-base-row {
  margin-top: 10px;
}
.route-base-row label {
  text-align: left;
  flex: 1;
  margin-bottom: 3px;
  font-size: 13px;
}
.route-base-row input {
  flex: 1;
}
</style>