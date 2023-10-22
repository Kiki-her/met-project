import styles from "./page.module.css";
import {useState, useEffect} from "react";
import {onSnapshot, colRef, addDoc, q} from "../db/firebase";
import infomation from "@/db/fetchedData";
import ShowImage from "./showImage";
import GetIds from "./getIds";

export default function Top() {
  const [data, setData] = useState([]);
  const [isFrag, setFrag] = useState(false);

  const [taegetId, setId] = useState(-1);
  const [isSolo, setSolo] = useState(false);

  const dataCount = infomation.length;

  useEffect(() => {
    const idsArr = getRandomNumbersArr(15);

    const stock = [];
    for (const i of idsArr) {
      const obj = {
        accessionYear: infomation[i].accessionYear,
        primaryImageSmall: infomation[i].primaryImageSmall,
        title: infomation[i].title,
        artistDisplayName: infomation[i].artistDisplayName,
        artistDisplayBio: infomation[i].artistDisplayBio,
        objectURL: infomation[i].objectURL,
      };
      stock.push(obj);
    }
    setData(stock);

    addDoc(colRef, {
      groups: JSON.stringify(stock),
      createdAt: new Date(),
    });

    onSnapshot(q, snapshot => {
      let arts = [];
      snapshot.docs.forEach(doc => {
        arts.push({...doc.data(), id: doc.id});
      });

      setId(arts.at(-1)["id"]);
    });
  }, []);
  function getRandomNumbersArr(num) {
    const uniqueArray = [];
    while (uniqueArray.length < num) {
      const randomNum = Math.floor(Math.random() * dataCount);
      if (!uniqueArray.includes(randomNum)) {
        uniqueArray.push(randomNum);
      }
    }
    return uniqueArray;
  }
  return isSolo ? (
    <ShowImage
      data={data}
      setData={setData}
      isFrag={isFrag}
      setFrag={setFrag}
      dataCount={dataCount}
      setId={setId}
    />
  ) : (
    <>
      <button
        onClick={() => {
          setSolo(true);
        }}
      >
        ひとりで楽しむ
      </button>
      <GetIds taegetId={taegetId} setId={setId} />
    </>
  );
}
