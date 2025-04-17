<template>
    <div class="user-view">
      <h1>사용자 정보</h1>
  
      <div class="profile-info">
        <h2>프로필 정보</h2>
        <p><strong>이름:</strong> {{ user.name }}</p>
        <p><strong>이메일:</strong> {{ user.email }}</p>
        <button @click="editProfile">프로필 수정</button>
      </div>
  
      <div class="settings">
        <h2>설정</h2>
        <ul>
          <li><button @click="goToNotifications">알림 설정</button></li>
          <li><button @click="goToPrivacy">개인 정보 설정</button></li>
          </ul>
      </div>
  
      <div class="logout">
        <button @click="logout">로그아웃</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  const user = ref({
    name: '',
    email: '',
    // 추가적인 사용자 정보
  });
  
  onMounted(() => {
    // 실제 앱에서는 API 호출 또는 스토어에서 사용자 정보를 가져와야 합니다.
    // 예시:
    // fetch('/api/user/profile')
    //   .then(response => response.json())
    //   .then(data => {
    //     user.value = data;
    //   });
  
    // 임시 사용자 정보
    user.value = { name: '홍길동', email: 'hong@example.com' };
  });
  
  const editProfile = () => {
    // 프로필 수정 페이지로 이동하는 로직 (아직 경로가 정의되지 않았을 수 있습니다.)
    router.push('/user/edit');
  };
  
  const goToNotifications = () => {
    // 알림 설정 페이지로 이동하는 로직
    router.push('/user/notifications');
  };
  
  const goToPrivacy = () => {
    // 개인 정보 설정 페이지로 이동하는 로직
    router.push('/user/privacy');
  };
  
  const logout = () => {
    // 실제 로그아웃 로직 (API 호출, 토큰 제거 등)을 구현해야 합니다.
    localStorage.removeItem('authToken'); // 예시: 로컬 스토리지에서 토큰 제거
    router.push('/'); // 스플래시 화면으로 이동
  };
  </script>
  
  <style scoped>
  .user-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
  .profile-info,
  .settings,
  .logout {
    width: 80%;
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    text-align: left;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 10px;
  }
  
  .settings ul {
    list-style: none;
    padding: 0;
  }
  
  .settings li {
    margin-bottom: 8px;
  }
  
  button {
    padding: 10px 15px;
    font-size: 16px;
    border: 1px solid #ccc;
    border-radius: 5px;
    cursor: pointer;
    background-color: #f8f8f8;
  }
  
  button:hover {
    background-color: #eee;
  }
  
  .logout button {
    background-color: #dc3545;
    color: white;
    border: none;
  }
  
  .logout button:hover {
    background-color: #c82333;
  }
  </style>