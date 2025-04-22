import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Firebase Authentication 사용 시
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore"; // Firestore 사용 시
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // Firebase Storage 사용 시

// 1단계에서 복사한 Firebase 구성 정보를 여기에 붙여넣으세요.
const firebaseConfig = {
    apiKey: "AIzaSyCsmoAvhD3IHD0ZD_-VKvRuDtACF4SD0B4",
    authDomain: "route-39ef2.firebaseapp.com",
    projectId: "route-39ef2",
    storageBucket: "route-39ef2.firebasestorage.com",
    messagingSenderId: "1069984410299",
    appId: "1:1069984410299:web:c7c480f00df44b0a90979e",
    measurementId: "G-XFSMVS2B6B"
};

const app = initializeApp(firebaseConfig);

// 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Storage 초기화

// 필요한 Firebase 서비스 인스턴스를 내보냅니다.
export { auth, db, storage, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, storageRef, uploadBytes, getDownloadURL, deleteObject };