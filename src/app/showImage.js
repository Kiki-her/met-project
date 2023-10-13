import Image from "next/image";
import {useEffect, useState} from "react";
import ids from "@/data/openIds";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import {
  query,
  where,
  getDocsdoc,
  getDocs,
  addDoc,
  collection,
  setDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";
import {db, colRef} from "@/db/fbdbinit";

/*
 Internal error: FirebaseError: Expected type 'DocumentReference', but it was: a custom CollectionReference object
*/

export default function ShowImage() {
  const [data, setData] = useState("");
  const [target, setTarget] = useState([]);
  let id = Math.floor(Math.random() * ids.length);

  useEffect(() => {
    const getData = async () => {
      // fetchでデータをとって、DBに保存する
      const res = await fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
      );
      const infoObj = await res.json();
      if (infoObj.primaryImageSmall !== "") {
        setData(infoObj);
        await addDoc(collection(db, "info"), {
          artId: id,
          src: infoObj.primaryImageSmall,
          title: infoObj.title,
          artist: infoObj.artistDisplayName,
          bio: infoObj.artistDisplayBio,
        });
        console.log("THER");
      } else {
        id = Math.floor(Math.random() * ids.length);
        getData();
      }
    };
    const searchData = async function () {
      // すでにDBに入ったデータかどうか調べる
      const q = query(collection(db, "info"), where("artId", "==", id));
      onSnapshot(q, snapshot => {
        snapshot.docs.forEach(doc => {
          setTarget([{...doc.data(), id: doc.id}]);
        });
      });
    };
    const targetData = async function () {
      // すでにDBにあったデータを持ってきてsetDataする
      const q = query(collection(db, "info"), where("artId", "==", id));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(doc => {
        setData({...doc.data()});
      });
      onSnapshot(q, snapshot => {
        snapshot.docs.forEach(doc => {
          setData({...doc.data()});
        });
      }).catch(err => {
        console.log(err.message);
      });
    };
    searchData(); // DBにあるか？返り値がわからん
    console.log(target);
    if (target.length === 0) {
      // DBになかったからAPIから取得;
      getData();
    } else {
      // DBにあったからDBから取得
      targetData();
    }
  }, []);
  console.log(data);

  return (
    <>
      <Popup
        trigger={
          <Image
            src={data.primaryImageSmall}
            width={500}
            height={500}
            alt={data.title}
          />
        }
        position="canter center"
      >
        <div style={{color: "black"}}>{data.title}</div>
        <div style={{color: "black"}}>{data.artistDisplayName}</div>
        <div style={{color: "black"}}>{data.artistDisplayBio}</div>
      </Popup>
    </>
  );
}
