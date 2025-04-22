<template>
    <div class="test-container">
      <h1>Firestore 쓰기 테스트</h1>
      <p>이 페이지는 Firestore 쓰기 기능만 간단히 테스트합니다.</p>
      <button @click="addTestData">Firestore에 테스트 데이터 추가</button>
      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  // Firebase Firestore SDK에서 필요한 함수들을 import 합니다.
  import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
  // main.js 등에서 초기화하고 export 한 Firestore 인스턴스를 import 합니다.
  // @/main.js 경로는 프로젝트 설정에 따라 다를 수 있습니다.
  import { db } from '@/main.js';
  
  // Firebase Auth SDK (로그인 사용자 테스트 시 필요)
  import { getAuth } from 'firebase/auth';
  
  
  const message = ref(''); // 테스트 결과를 표시할 메시지 변수
  
  const addTestData = async () => {
      message.value = '데이터 추가 시도 중...';
  
      const auth = getAuth();
      const user = auth.currentUser;
  
      // 규칙이 인증된 사용자만 허용하는 경우, 로그인 상태를 확인
      // 현재 사용 중인 규칙 (match /{document=**} { allow read, write: if request.auth != null; }) 에서는 인증 필요
      if (!user) {
          message.value = '오류: 로그인이 필요합니다. 규칙이 인증된 사용자만 허용합니다.';
          console.error("Firestore 쓰기 실패: 사용자가 로그인되지 않음");
          return;
      }
  
  
      try {
          // Firestore에 추가할 간단한 테스트 데이터
          const testData = {
              testField1: 'Hello Firestore!',
              testField2: Math.random(),
              userId: user.uid, // 로그인 사용자 ID 포함 (규칙 테스트에 유용)
              timestamp: serverTimestamp() // 서버 타임스탬프
          };
  
          // 'test_collection' 이라는 컬렉션에 데이터 추가
          // 이 컬렉션이 없으면 자동으로 생성됩니다.
          const collectionRef = collection(db, 'test_collection');
  
          // 데이터 추가 시도
          const docRef = await addDoc(collectionRef, testData);
  
          message.value = `데이터 추가 성공! 문서 ID: ${docRef.id}`;
          console.log("Firestore 테스트 데이터 추가 성공:", docRef.id);
  
      } catch (error) {
          // 오류 발생 시 메시지 출력
          message.value = `데이터 추가 오류: ${error.message}`;
          console.error("Firestore 테스트 데이터 추가 오류:", error);
          // 400 Bad Request 오류의 경우, 대부분 보안 규칙 위반입니다.
          if (error.code === 'permission-denied' || (error.message && error.message.includes('400'))) {
               message.value += " (권한 문제 또는 규칙 위반 가능성 높음)";
          }
      }
  };
  
  </script>
  
  <style scoped>
  .test-container {
      padding: 20px;
      text-align: center;
      margin-top: 50px;
  }
  .test-container button {
      margin-top: 20px;
      padding: 10px 15px;
      font-size: 16px;
      cursor: pointer;
  }
  .message {
      margin-top: 20px;
      color: green;
      min-height: 20px; /* 메시지 영역 확보 */
  }
  .message.error {
      color: red;
  }
  </style>