<template>
  <div>
    <div class="search-bar">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="닉네임 또는 이메일로 검색..."
        class="search-input"
      />
    </div>
    <div v-if="loading">회원 목록 로딩 중...</div>
    <div v-else-if="error">
      회원 목록을 불러오는 데 오류가 발생했습니다: {{ error.message }}
    </div>
    <div v-else>
      <p>
        총 <strong class="txt-red">{{ filteredUsers.length }}</strong> 명의 회원이
        있습니다.
        <span v-if="searchQuery"> (검색 결과)</span>
      </p>
      <table class="user-table">
        <thead>
          <tr>
            <th>닉네임/이름</th>
            <th>이메일</th>
            <th>가입일</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.uid">
            <td>{{ user.username || user.name || "이름 없음" }}</td>
            <td>{{ user.email }}</td>
            <td>
              {{
                user.createdAt
                  ? formatDate(user.createdAt.toDate())
                  : "날짜 없음"
              }}
            </td>
            <td>
              <button v-if="!user.isAdmin" @click="deleteUser(user.uid)">
                삭제
              </button>
            </td>
          </tr>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="4" class="no-users-message">
              {{ searchQuery ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
// ✅ computed 함수 import 추가
import { ref, onMounted, computed } from "vue";
// where 함수는 이 버전의 코드에서는 사용되지 않습니다.
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";

// deleteUserAccount 함수는 이 버전의 코드에서는 사용되지 않습니다.
// import { deleteUserAccount } from '@/services/adminService';

const users = ref([]); // Firestore에서 가져온 전체 회원 목록 (필터링 전)
const loading = ref(true);
const error = ref(null);
// ✅ 검색어 입력을 위한 반응형 변수
const searchQuery = ref("");

const fetchUsers = async () => {
  console.log("[UserManagement] 회원 목록 가져오기 시작");
  loading.value = true;
  error.value = null;
  try {
    const usersCollectionRef = collection(db, "users");
    // ✅ 이 쿼리는 관리자를 제외하지 않고 모든 회원을 가져옵니다.
    const q = query(usersCollectionRef, orderBy("createdAt", "asc"));

    const querySnapshot = await getDocs(q);

    const usersList = [];
    querySnapshot.forEach((doc) => {
      usersList.push({
        uid: doc.id, // uid는 내부 필터링/삭제에 사용될 수 있으므로 유지
        ...doc.data(),
      });
    });

    users.value = usersList; // 가져온 전체 목록을 users에 저장
    console.log(`[UserManagement] 회원 목록 ${usersList.length}명 가져옴.`);
  } catch (e) {
    console.error("[UserManagement] 회원 목록 가져오기 오류:", e);
    error.value = e;
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "날짜 없음";
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("ko-KR", options);
};

// ✅✅✅ 검색어에 따라 users 배열을 필터링하는 computed 속성 ✅✅✅
const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase(); // 검색어를 소문자로 변환
  if (!query) {
    // 검색어가 없으면 전체 users 목록 반환
    return users.value;
  }
  // users 배열을 순회하며 필터링
  return users.value.filter((user) => {
    // 닉네임 또는 이메일 필드에서 검색어 포함 여부 확인 (대소문자 구분 없이)
    const username = user.username || user.name || ""; // username이나 name이 없을 경우 빈 문자열 처리
    const email = user.email || "";

    return (
      username.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query)
    );
  });
});

// TODO: 회원 삭제 기능 구현 함수 (Placeholder 유지)
const deleteUser = (uid) => {
  console.log("Delete user:", uid);
  if (
    confirm(
      `정말로 회원 ${uid}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`
    )
  ) {
    alert(
      `회원 삭제 기능은 아직 구현되지 않았습니다. 실제 구현 시에는 신중해야 합니다! (UID: ${uid})`
    );
  }
};

onMounted(() => {
  fetchUsers(); // 컴포넌트 마운트 시 전체 회원 목록 가져오기
});
</script>

<style scoped>
/* ✅✅✅ 검색 바 스타일 추가 ✅✅✅ */
.search-bar {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f8f9fa; /* 배경색 */
  border: 1px solid #e9ecef; /* 테두리 */
  border-radius: 5px; /* 모서리 둥글게 */
}

.search-input {
  width: 100%; /* 너비 전체 사용 */
  padding: 10px; /* 안쪽 여백 */
  border: 1px solid #ccc; /* 테두리 */
  border-radius: 4px; /* 모서리 둥글게 */
  box-sizing: border-box; /* padding과 border를 너비 계산에 포함 */
  font-size: 1em; /* 글자 크기 */
}

/* 기존 테이블 스타일 유지 */
.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  font-size: 0.9em;
}

.user-table th,
.user-table td {
  border: 1px solid #ddd;
  padding: 8px 10px; /* 사용자 제공 스타일 (3px 10px, height: 35px) 대신 조정 */
  text-align: left;
  word-break: break-all;
  vertical-align: middle; /* 세로 중앙 정렬 */
  height: auto; /* 높이 자동 조절 */
}

.user-table th {
  background-color: #e9ecef;
  font-weight: bold;
  color: #333;
}

.user-table tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}

.user-table tbody tr:hover {
  background-color: #e2e6ea;
}

.user-table td button {
  margin-right: 5px;
  padding: 5px 10px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  font-size: 0.8em;
  transition: background-color 0.2s ease;
}

.user-table td button:hover:not(:disabled) {
  background-color: #e9ecef;
}

.user-table .no-users-message {
  text-align: center;
  font-style: italic;
  color: #888;
  padding: 20px;
}
.txt-red {
  color: red;
  font-weight: bold;
}
</style>