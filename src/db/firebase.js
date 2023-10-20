import {initializeApp} from "firebase/app";
import {getDatabase, ref, set, push} from "firebase/database";
require("dotenv").config();

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  databaseURL: `https://${DATABASE_NAME}.firebaseio.com`,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);
const dbRef = ref(db, "groupInfos");

function addGroupData(groupId, imagesInfo) {
  // idはランダム生成、imagesInfoは配列
  const newGroupRef = push(dbRef);
  const groupInfo = {
    groupId,
    imagesInfo,
  };
  set(newGroupRef, groupInfo);
}

module.exports = {addGroupData};
