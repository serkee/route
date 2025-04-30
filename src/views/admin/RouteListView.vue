<template>
    <div class="container">
      <!-- 로딩 중 메시지 -->
      <div v-if="loading" class="loading-message">
        <p>루트 목록을 불러오는 중입니다...</p>
      </div>
  
      <!-- 오류 메시지 -->
      <div v-else-if="error" class="error-message">
        <p>루트 목록을 불러오는데 오류가 발생했습니다: {{ error.message }}</p>
      </div>
  
      <!-- 루트 목록 테이블 -->
      <div v-else>
        <div v-if="routes.length === 0" class="no-routes-message">
          <p>등록된 루트가 없습니다.</p>
        </div>
        <table v-else class="route-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>난이도</th>
              <th>위치 (Lat, Lng)</th>
              <th>등록일</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="route in routes" :key="route.id">
              <td>{{ route.name || '이름 없음' }}</td>
              <td>{{ route.averageDifficulty || '정보 없음' }}</td> <!-- Updated field name -->
              <td>{{ route.location?.lat || '정보 없음' }}, {{ route.location?.lng || '정보 없음' }}</td> <!-- Added null checks -->
              <td>{{ formatDate(route.timestamp) }}</td>
              <td class="actions">
                <!-- 상세 보기 버튼 -->
                <!-- <button @click="viewRouteDetail(route.id)" class="action-button view-button">상세</button> -->
                <!-- 수정 버튼 -->
                <button @click="editRoute(route)" class="action-button edit-button">수정</button>
                <!-- 삭제 버튼 -->
                <button @click="confirmDelete(route.id)" class="action-button delete-button">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  import { useRouter } from 'vue-router'; // useRouter 임포트
  
  // Define props received from parent (MapManagement.vue)
  const props = defineProps({
    routes: {
      type: Array,
      required: true,
      default: () => []
    },
    loading: {
      type: Boolean,
      required: true,
      default: false
    },
    error: {
      type: Error,
      default: null
    },
    formatDate: { // 날짜 포맷팅 함수를 props로 받음
      type: Function,
      required: true
    }
  });
  
  // Define emits to send events to parent (MapManagement.vue)
  const emit = defineEmits(['edit', 'delete']);
  
  const router = useRouter(); // useRouter 인스턴스 생성
  
  
  // 수정 버튼 클릭 시 부모 컴포넌트에 이벤트 발생
  const editRoute = (route) => {
    console.log("[RouteListView] 'edit' 이벤트 발생. 루트:", route);
    emit('edit', route);
  };
  
  // 삭제 버튼 클릭 시 부모 컴포넌트에 이벤트 발생 (삭제 확인 모달 트리거)
  const confirmDelete = (routeId) => {
    console.log(`[RouteListView] 'delete' 이벤트 발생. 루트 ID: ${routeId}`);
    emit('delete', routeId);
  };
  
  // ✅✅✅ 상세 보기 버튼 클릭 시 라우트 상세 페이지로 이동 ✅✅✅
  const viewRouteDetail = (routeId) => {
    console.log(`[RouteListView] 상세 보기 클릭. 루트 ID: ${routeId}`);
    // 'admin-route-detail' 라우트 이름과 파라미터(id)를 사용하여 이동
    router.push({ name: 'admin-route-detail', params: { id: routeId } });
  };
  
  
  </script>
  
  <style scoped>
    .container,
    .container > div{width: 100%;}
  /* 기존 MapManagement.vue의 table 및 list 관련 스타일을 가져옵니다. */
  .route-list-section {
      margin-top: 40px; /* 폼 섹션과 구분 */
  }
  
  h2 {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
  }
  .route-table {
  width: 100%;
  border-collapse: collapse; /* 테이블 셀 경계선 합침 */
  min-width: 600px; /* 테이블의 최소 너비 설정 */
}

.route-table th,
.route-table td {
  border: 1px solid #ddd; /* 셀 경계선 스타일 */
  padding: 10px;
  text-align: left; /* 기본 텍스트 왼쪽 정렬 */
}

.route-table th {
  background-color: #f2f2f2; /* 헤더 배경색 */
  font-weight: bold;
}

.route-table tbody tr:nth-child(even) {
  background-color: #f9f9f9; /* 짝수 행 배경색 */
}

.route-table tbody tr:hover {
  background-color: #e9e9e9; /* 호버 시 배경색 */
}

/* 액션 버튼 스타일 */
.actions {
  text-align: center; /* 액션 버튼 가운데 정렬 */
  white-space: nowrap; /* 버튼이 줄바꿈되지 않도록 */
}

.action-button {
  padding: 5px 10px;
  margin: 0 2px; /* 버튼 간 간격 */
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
}

.view-button {
  background-color: #007bff;
  color: white;
}
.view-button:hover {
  background-color: #0056b3;
}

.edit-button {
  background-color: #ffc107;
  color: #212529;
}
.edit-button:hover {
  background-color: #e0a800;
}

.delete-button {
  background-color: #dc3545;
  color: white;
}
.delete-button:hover {
  background-color: #c82333;
}
  
  /* 로딩 및 오류 메시지 스타일은 필요시 추가 */
  /*
  .loading-message, .error-message {
    text-align: center;
    margin-top: 20px;
    font-style: italic;
  }
  .error-message {
    color: red;
  }
  */
  
  </style>