<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <h1>검색 결과: "{{ currentSearchQuery }}"</h1>
      <div class="header__right"></div>
    </div>
    <div v-if="loading" class="loading-message">
      <p>검색 결과를 불러오는 중입니다...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>검색 결과를 불러오는데 오류가 발생했습니다: {{ error.message }}</p>
    </div>

    <div v-else class="search-results-list">
      <div v-if="searchResults.length === 0" class="no-results">
        <p>"{{ currentSearchQuery }}"에 대한 검색 결과가 없습니다.</p>
      </div>
      <ul v-else>
        <li v-for="route in searchResults" :key="route.id">
          <div class="result-info">
            <span class="result-name">{{ route.name || "이름 없음" }}</span>
            <span class="result-meta"
              >등반형태: <strong>{{ route.climbingStyle || "정보 없음" }}</strong></span
            >
            <span class="result-meta"
              >위치: <strong>{{ route.location?.lat?.toFixed(6) || "정보 없음" }} /
              {{ route.location?.lng?.toFixed(6) || "정보 없음" }}</strong></span
            >
          </div>
          <button class="detail-button" @click="viewRouteDetail(route.id)">
            상세정보
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"; // watch 임포트하여 쿼리 변경 감지
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase";
import { useRouter, useRoute } from "vue-router"; // useRoute 임포트

const router = useRouter();
const route = useRoute(); // 현재 루트 정보 가져오기

const routes = ref([]); // 전체 루트 목록 (검색 및 필터링에 사용)
const searchResults = ref([]); // 필터링된 검색 결과
const loading = ref(true); // 데이터 로딩 상태
const error = ref(null); // 오류 상태

const currentSearchQuery = ref(""); // 현재 검색어 (화면 표시에 사용)

// Firestore에서 전체 루트 목록을 가져오는 함수
const fetchRoutes = async () => {
  console.log("[MapSearchView] 전체 루트 목록 가져오기 시작 (Firestore).");
  loading.value = true; // 로딩 시작
  error.value = null; // 오류 초기화
  try {
    const routesCollectionRef = collection(db, "routes"); // 'routes' 컬렉션 참조
    const q = query(routesCollectionRef); // 필요한 경우 정렬, 필터링 추가

    const routesList = [];
    const querySnapshot = await getDocs(q); // 문서 목록 가져오기

    querySnapshot.forEach((doc) => {
      const routeData = doc.data();
      // 각 루트 문서에서 ID, 위치, 이름, 등반 개요, 등반 형태 등을 가져옵니다.
      if (
        routeData.location &&
        routeData.location.lat !== undefined &&
        routeData.location.lng !== undefined
      ) {
        const route = {
          id: doc.id, // 루트 문서 ID
          location: routeData.location, // 위치 ({lat, lng})
          name: routeData.name || "이름 없음", // 루트 이름
          climbingOverview: routeData.climbingOverview || "", // 검색 필터링에 사용
          climbingStyle: routeData.climbingStyle || "", // 검색 결과 표시에 사용
          // 필요한 다른 필드 추가
        };
        routesList.push(route);
      } else {
        console.warn(
          `[MapSearchView] 루트 문서 ${doc.id}에 유효한 위치 정보가 없습니다.`,
          routeData
        );
      }
    });
    routes.value = routesList; // 가져온 전체 루트 목록 업데이트
    console.log(
      `[MapSearchView] 전체 루트 ${routes.value.length}개 가져옴.`,
      routes.value
    );

    // 루트 목록을 가져온 후 검색 실행
    performSearch(currentSearchQuery.value);
  } catch (err) {
    console.error("[MapSearchView] 루트 목록 가져오기 오류:", err);
    error.value = err; // 오류 상태 업데이트
    loading.value = false; // 오류 발생 시 로딩 해제
  }
};

// 검색 실행 함수 (MapSearchView용)
const performSearch = (queryText) => {
  console.log("[MapSearchView] Searching for:", queryText);
  if (!queryText) {
    searchResults.value = []; // 검색어 없으면 결과 비움
    loading.value = false; // 로딩 해제
    console.log(
      "[MapSearchView] Search query is empty. Clearing search results."
    );
    return;
  }

  const lowerCaseQuery = queryText.toLowerCase().trim(); // 검색어 소문자 변환 및 공백 제거

  // 전체 루트 목록 (routes.value)을 필터링하여 검색 결과 (searchResults.value) 생성
  searchResults.value = routes.value.filter((route) => {
    // 검색 기준: 루트 이름 또는 등반 개요에 검색어가 포함되는지 확인 (대소문자 구분 없이)
    const nameMatch =
      route.name && route.name.toLowerCase().includes(lowerCaseQuery);
    const overviewMatch =
      route.climbingOverview &&
      route.climbingOverview.toLowerCase().includes(lowerCaseQuery);
    // 필요한 경우 다른 필드 (예: 등반 형태, 위치 주소 등)도 검색 기준으로 추가할 수 있습니다.

    return nameMatch || overviewMatch;
  });

  console.log(
    `[MapSearchView] Found ${searchResults.value.length} search results.`
  );
  loading.value = false; // 검색 완료 후 로딩 해제
};

// 상세 페이지 이동 함수 (검색 결과의 '상세정보' 버튼 클릭 시 사용)
const viewRouteDetail = (routeId) => {
  console.log(
    `[MapSearchView] '상세정보' button clicked. Navigating to route detail for ID: ${routeId}`
  );
  // 'admin-route-detail' 루트 이름과 파라미터(id)를 사용하여 상세 페이지로 이동
  // MapView와 동일하게 어드민 상세 페이지로 연결합니다. (필요시 변경)
  router.push({ name: "admin-route-detail", params: { id: routeId } });
};

// 뒤로 가기 함수
const goBack = () => {
  router.go(-1); // 이전 페이지로 이동
};

// 컴포넌트 마운트 시 실행
onMounted(() => {
  console.log("[MapSearchView] Component mounted.");
  // URL에서 검색 쿼리 파라미터 가져오기
  currentSearchQuery.value = route.query.q || "";
  console.log(
    "[MapSearchView] Search query from route:",
    currentSearchQuery.value
  );

  // 컴포넌트 마운트 시 전체 루트 목록 가져오기 및 검색 실행
  fetchRoutes();
});

// URL의 검색 쿼리 파라미터가 변경될 때마다 검색 다시 실행
watch(
  () => route.query.q,
  (newQuery) => {
    console.log("[MapSearchView] Route query changed:", newQuery);
    currentSearchQuery.value = newQuery || "";
    loading.value = true; // 새로운 검색 시작 시 로딩 상태 설정
    // 전체 루트 목록은 이미 fetchedRoutes에 있으므로 다시 가져올 필요 없이 바로 검색 실행
    performSearch(currentSearchQuery.value);
  }
);
</script>

<style scoped>
/* 검색 결과 페이지 전체 컨테이너 스타일 */

.search-page-header h2 {
  font-size: 1.5em;
  margin: 0;
  color: #333;
  flex-grow: 1; /* 제목이 남은 공간 차지 */
}

/* 로딩 및 오류 메시지 스타일 */
.loading-message,
.error-message,
.no-results {
  text-align: center;
  margin-top: 20px;
  font-size: 1.1em;
  color: #555;
}

.error-message {
  color: red;
}

.no-results {
  color: #888;
  font-style: italic;
}

/* 검색 결과 목록 스타일 */
.search-results-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid #eee;
}

.search-results-list li {
  padding: 15px 0; /* 상하 패딩 조정 */
  border-bottom: 1px solid #eee;
  display: flex; /* 내용과 버튼 가로 배치 */
  justify-content: space-between; /* 내용과 버튼 양쪽으로 분산 */
  align-items: center; /* 세로 가운데 정렬 */
}

/* .search-results-list li:last-child {
  border-bottom: none;
} */

.result-info {
  display: flex;
  flex-direction: column; /* 이름, 구분, 위치 세로 배치 */
  flex-grow: 1; /* 남은 공간 모두 차지 */
  margin-right: 15px; /* 버튼과의 간격 */
  text-align: left;
}

.result-name {
  font-weight: bold;
  margin-bottom: 10px; /* 아래 정보와의 간격 */
  color: #000;
  font-size: 1.2em; /* 이름 폰트 크기 */
}

.result-meta {
  font-size: 0.9em; /* 구분, 위치 폰트 크기 */
  color: #555;
  line-height: 1.5; /* 줄 간격 */
  margin-top:-3px;
}

/* 상세정보 버튼 스타일 */
.detail-button {
  flex-shrink: 0; /* 버튼 크기 고정 */
  padding: 8px 15px; /* 패딩 조정 */
  background-color: #28aa45; /* 녹색 */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
}

.detail-button:hover {
  background-color: #218838;
}

.search-results-list{
    width: 100%;
}
</style>