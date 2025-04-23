// src/firebase.js - Firebase 초기화 및 서비스 인스턴스 내보내기 파일 (단일 초기화 지점)

// Firebase v9+ 모듈 API 사용에 필요한 함수들을 import 합니다.
import { initializeApp, getApps, getApp } from 'firebase/app'; // getApps, getApp import
import { getAuth } from 'firebase/auth'; // getAuth 함수 import
import { getFirestore } from 'firebase/firestore'; // getFirestore 함수 import
import { getStorage } from 'firebase/storage'; // getStorage 함수 import

// Firebase 프로젝트 설정 정보
// const firebaseConfig = {
//     apiKey: "AIzaSyCsmoAvhD3IHD0ZD_-VKvRuDtACF4SD0B4",
//     authDomain: "route-39ef2.firebaseapp.com",
//     projectId: "route-39ef2",
//     storageBucket: "route-39ef2.firebasestorage.com",
//     messagingSenderId: "1069984410299",
//     appId: "1:1069984410299:web:c7c480f00df44b0a90979e",
//     measurementId: "G-XFSMVS2B6B"
// };
// const firebaseConfig = {
//     apiKey: "AIzaSyCqiiEx1YdpEP0uxsVfYD_F-g1sSy_MOdU",
//     authDomain: "newroute-b400d.firebaseapp.com",
//     projectId: "newroute-b400d",
//     storageBucket: "newroute-b400d.firebasestorage.app",
//     messagingSenderId: "265327452698",
//     appId: "1:265327452698:web:80d1c7660b753fea7067a3",
//     measurementId: "G-F2HFZWMJ7V"
//   };
const firebaseConfig = {
    apiKey: "AIzaSyCfMQetpmVgH8A4kVF9hudkSmdvLPNgEtk",
    authDomain: "routefinding-c7cfa.firebaseapp.com",
    projectId: "routefinding-c7cfa",
    storageBucket: "routefinding-c7cfa.firebasestorage.app",
    messagingSenderId: "688715781960",
    appId: "1:688715781960:web:b0627bc9b89d1ebd42057d",
    measurementId: "G-EWE5380J78"
  };

// Firebase 앱 초기화 (애플리케이션 전체에서 단 한 번만 호출되도록 getApps() 확인)
// 이미 초기화된 앱이 있다면 해당 인스턴스를 가져옵니다.
const apps = getApps();
const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();

// console.log("Firebase 앱 인스턴스 가져옴/초기화 완료", firebaseApp);


// Firebase 서비스 인스턴스 가져오기 (초기화된 앱 사용)
// getFirestore() 호출 시 인자 없이 호출하면 (default) 기본 데이터베이스 인스턴스를 가져옵니다.
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp); // <-- 기본 데이터베이스 인스턴스 가져오기 (인자 없음)
const storage = getStorage(firebaseApp);

// console.log("Firestore 인스턴스 가져옴 ((default))", db);
// console.log("Auth 인스턴스 가져옴", auth);
// console.log("Storage 인스턴스 가져옴", storage);


// 다른 파일에서 Firebase 서비스 인스턴스 (auth, db, storage)를 사용하려면 export 합니다.
// 개별 함수들 (collection, addDoc 등)은 사용하는 파일에서 해당 서비스 모듈에서 직접 import 합니다.
export { auth, db, storage };