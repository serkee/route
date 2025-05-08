<template>
  <div class="container">
    <div class="header">
      <button class="back-button" @click="goBack">←</button>
      <!-- ✅ 헤더 텍스트 업데이트 -->
      <h1>{{ headerText }}</h1>
      <div class="header__right"></div>
    </div>
    <div v-if="loading" class="loading-message">
      <p>{{ loadingMessage }}</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>데이터를 불러오는데 오류가 발생했습니다: {{ error.message }}</p>
    </div>

    <!-- ✅ searchResults 대신 routes 사용 -->
    <div v-else class="search-results-list">
      <div v-if="routes.length === 0" class="no-results">
        <!-- ✅ 메시지 업데이트 -->
        <p>{{ noResultsText }}</p>
      </div>
      <ul v-else>
        <!-- ✅ searchResults 대신 routes 사용 -->
        <li v-for="route in routes" :key="route.id">
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
import { ref, onMounted, watch, computed } from "vue"; // computed 임포트 추가
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"; // where, orderBy 임포트 추가
import { db } from "@/firebase";
import { useRouter, useRoute } from "vue-router"; // useRoute 임포트

const router = useRouter();
const route = useRoute(); // 현재 루트 정보 가져오기

// ✅ searchResults 대신 routes만 사용
const routes = ref([]); // Firestore에서 가져온 데이터 (검색 결과 또는 전체 목록)
const loading = ref(true); // 데이터 로딩 상태
const error = ref(null); // 오류 상태

// ✅ 화면 표시에 사용할 computed 속성
const headerText = computed(() => {
    if (route.query.show === 'all') {
        return '모든 루트 목록';
    } else if (route.query.q) {
        return `검색 결과: "${route.query.q}"`;
    } else {
        return '루트 검색'; // 기본 상태
    }
});

const loadingMessage = computed(() => {
    if (route.query.show === 'all') {
        return '모든 루트 목록을 불러오는 중입니다...';
    } else if (route.query.q) {
        return `"${route.query.q}"에 대한 검색 결과를 불러오는 중입니다...`;
    } else {
        return '데이터를 불러오는 중입니다...'; // 기본 상태
    }
});

const noResultsText = computed(() => {
     if (route.query.show === 'all') {
        return '등록된 루트가 없습니다.';
    } else if (route.query.q) {
        return `"${route.query.q}"에 대한 검색 결과가 없습니다.`;
    } else {
         return '검색어를 입력하거나 모든 루트 보기를 선택하세요.';
    }
});


// ✅ Firestore에서 데이터를 가져오는 통합 함수
const fetchData = async () => {
    console.log("[MapSearchView] Fetching data based on route query:", route.query);
    loading.value = true; // 로딩 시작
    error.value = null; // 오류 초기화
    routes.value = []; // 결과 목록 초기화

    const searchQuery = route.query.q || '';
    const showAll = route.query.show === 'all';
    const sortBy = route.query.sort;

    try {
        const routesCollectionRef = collection(db, "routes");
        let q = query(routesCollectionRef);

        // ✅ 쿼리 파라미터에 따라 Firestore 쿼리 구성
        if (showAll) {
            // 'show=all'일 경우 모든 루트 가져오기
            console.log("[MapSearchView] Query: Fetch all routes.");
            // ✅ 정렬 조건 적용 (sort=name_asc 일 경우)
            if (sortBy === 'name_asc') {
                q = query(routesCollectionRef, orderBy('name', 'asc')); // 'name' 필드로 오름차순 정렬 (가나다 순)
                 console.log("[MapSearchView] Query: Ordering by name ascending.");
            }
            // TODO: 다른 정렬 조건이 있다면 여기에 else if로 추가

        } else if (searchQuery) {
            // 'show=all'이 아니고 검색어(q)가 있을 경우 검색 실행
            console.log(`[MapSearchView] Query: Searching for "${searchQuery}".`);
            // Firestore에서 이름으로 'starts-with' 검색 (대소문자 구분 없음)
            // 주의: Firestore는 강력한 텍스트 검색 기능을 제공하지 않습니다.
            // 이 방법은 '검색어'로 시작하는 문서를 찾는데 적합하며, 부분 문자열 검색에는 한계가 있습니다.
            // 전체 텍스트 검색이 필요하면 Algolia 등 외부 서비스를 고려해야 합니다.
            const lowerCaseQuery = searchQuery.toLowerCase();
            q = query(
                routesCollectionRef,
                orderBy('name', 'asc'), // 검색 결과도 이름 순으로 정렬 (선택 사항)
                where('name', '>=', lowerCaseQuery),
                where('name', '<=', lowerCaseQuery + '\uf8ff') // '\uf8ff'는 유니코드의 큰 값
            );
             // TODO: 다른 필드 (climbingOverview 등)로 검색을 확장하려면 복합 쿼리 또는 다른 전략 필요

        } else {
            // 'show=all'도 아니고 검색어도 없는 경우
            console.log("[MapSearchView] Query: No search criteria. Returning empty.");
            loading.value = false; // 로딩 해제
            return; // 데이터 가져올 것이 없으므로 함수 종료
        }

        // 쿼리 실행 및 데이터 가져오기
        const querySnapshot = await getDocs(q);
        const fetchedRoutesList = [];
         querySnapshot.forEach((doc) => {
            const routeData = doc.data();
            // 유효한 위치 정보가 있는 루트만 포함 (필요에 따라 조건 수정)
            if (
                routeData.location &&
                routeData.location.lat !== undefined &&
                routeData.location.lng !== undefined
            ) {
                 fetchedRoutesList.push({
                    id: doc.id, // 루트 문서 ID
                    ...routeData, // 모든 필드 포함
                 });
            } else {
                 console.warn(
                    `[MapSearchView] 루트 문서 ${doc.id}에 유효한 위치 정보가 없습니다.`,
                    routeData
                 );
            }
        });
        routes.value = fetchedRoutesList; // 가져온 데이터로 routes 업데이트

        console.log(`[MapSearchView] Fetched ${routes.value.length} routes based on query.`);

    } catch (err) {
        console.error("[MapSearchView] Error fetching data:", err);
        error.value = err; // 오류 상태 업데이트
    } finally {
        loading.value = false; // 로딩 해제
    }
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
  // 컴포넌트 마운트 시 현재 쿼리 파라미터에 따라 데이터 가져오기 시작
  fetchData();
});

// URL의 쿼리 파라미터가 변경될 때마다 데이터 다시 가져오기
watch(
  () => route.query,
  (newQuery, oldQuery) => {
      // 쿼리 객체 자체가 변경되었을 때만 fetchData 실행
      // 예: /mapSearch?q=abc 에서 /mapSearch?show=all 로 변경될 때
      // 또는 /mapSearch?q=abc 에서 /mapSearch?q=def 로 변경될 때
      console.log("[MapSearchView] Route query changed.", { oldQuery, newQuery });
      // 깊은 비교는 필요 없을 수도 있지만, 쿼리 객체 내용 변경을 감지하기 위해 watch의 기본 동작에 의존
      fetchData(); // 쿼리 변경 시 데이터 가져오기 함수 재실행
  },
  { deep: true } // 쿼리 객체 내부의 속성 변화도 감지
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