// src/firebase.js - Firebase 초기화 및 서비스 인스턴스 내보내기 파일 (단일 초기화 지점)

import { initializeApp, getApps, getApp } from 'firebase/app'; // getApps, getApp import
import { getAuth } from 'firebase/auth'; // getAuth 함수 import
import { getFirestore } from 'firebase/firestore'; // getFirestore 함수 import
import { getStorage } from 'firebase/storage'; // getStorage 함수 import

const firebaseConfig = {
    apiKey: "AIzaSyCfMQetpmVgH8A4kVF9hudkSmdvLPNgEtk",
    authDomain: "routefinding-c7cfa.firebaseapp.com",
    projectId: "routefinding-c7cfa",
    storageBucket: "routefinding-c7cfa.firebasestorage.app",
    messagingSenderId: "688715781960",
    appId: "1:688715781960:web:b0627bc9b89d1ebd42057d",
    measurementId: "G-EWE5380J78"
  };

const apps = getApps();
const firebaseApp = !apps.length ? initializeApp(firebaseConfig) : getApp();


const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp); // <-- 기본 데이터베이스 인스턴스 가져오기 (인자 없음)
const storage = getStorage(firebaseApp);


export { auth, db, storage };