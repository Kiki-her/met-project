// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {
  getFirestore,
  collection,
  getDoc,
  doc,
  onSnapshot,
  addDoc,
  query,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqL0QUGtOQPWSz2u8tV-fh1lBeTp2Opdc",
  authDomain: "my-met-project.firebaseapp.com",
  databaseURL: "https://my-met-project-default-rtdb.firebaseio.com",
  projectId: "my-met-project",
  storageBucket: "my-met-project.appspot.com",
  messagingSenderId: "876826584299",
  appId: "1:876826584299:web:ce05dd2aeb7ae27039caae",
  measurementId: "G-SXLYV7Z8YW",
};

// Initialize Firebase
initializeApp(firebaseConfig);

// init servises
const db = getFirestore();

// collection ref
const colRef = collection(db, "arts");

// queries
const q = query(colRef, orderBy("createdAt"));

onSnapshot(colRef, snapshot => {
  let arts = [];
  snapshot.docs.forEach(doc => {
    arts.push({...doc.data(), id: doc.id});
  });
  console.log(arts);
});
// Initialize Realtime Database and get a reference to the service

// get a single document

module.exports = {
  onSnapshot,
  colRef,
  addDoc,
  serverTimestamp,
  q,
  db,
  getDoc,
  doc,
};
