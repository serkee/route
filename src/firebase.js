// src/firebase.js - Firebase 초기화 및 서비스 인스턴스 내보내기

// Firebase v9+ 모듈 API 사용
import { initializeApp, getApps, getApp } from 'firebase/app'; // getApps, getApp import
import { getAuth } from 'firebase/auth'; // getAuth 함수 import
import { getFirestore } from 'firebase/firestore'; // getFirestore 함수 import
import { getStorage } from 'firebase/storage'; // getStorage 함수 import

// Firebase 프로젝트 설정 정보
const firebaseConfig = {
    apiKey: "AIzaSyCsmoAvhD3IHD0ZD_-VKvRuDtACF4SD0B4",
    authDomain: "route-39ef2.firebaseapp.com",
    projectId: "route-39ef2",
    storageBucket: "route-39ef2.firebasestorage.com",
    messagingSenderId: "1069984410299",
    appId: "1:1069984410299:web:c7c480f00df44b0a90979e",
    measurementId: "G-XFSMVS2B6B"
};

// Firebase 앱 초기화 (앱 전체에서 단 한 번만 호출되도록 getApps() 확인)
// 이미 초기화된 앱이 있다면 해당 인스턴스를 가져옵니다.
const apps = getApps();
const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();

// console.log("Firebase 앱 인스턴스 가져옴/초기화 완료", firebaseApp);


// Firebase 서비스 인스턴스 가져오기 (초기화된 앱 사용)
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// console.log("Firestore 인스턴스 가져옴", db);
// console.log("Auth 인스턴스 가져옴", auth);
// console.log("Storage 인스턴스 가져옴", storage);


// 다른 파일에서 Firebase 서비스 인스턴스 (auth, db, storage)를 사용하려면 export 합니다.
// 개별 함수들 (collection, addDoc 등)은 사용하는 파일에서 해당 서비스 모듈에서 직접 import 합니다.
export { auth, db, storage };