import infomation from "@/db/fetchedData";
import {useEffect, useState} from "react";
import {addGroupData} from "../db/firebase";
export default function CreateGroups() {
  const [data, setData] = useState([]);
  const dataCount = infomation.length;
  const [isShare, setIsShare] = useState(false);
  const [id, setId] = useState(-1);

  useEffect(() => {
    const idsArr = getRandomNumbersArr(20);
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
  }, []);
  useEffect(() => {
    const id = createId();
    setId(id);
    addGroupData(id, stock);
  }, [isShare]);

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
  function createId() {
    const id = Math.fwloor(Math.random() * 100000);
    return id;
  }

  return (
    <div>
      <button
        onClick={() => {
          setIsShare(true);
        }}
      >
        番号をシェア
      </button>
      <button>番号を入力する</button>
      {isShare ? (
        <>
          <div>id: {id}</div>
          <button>入館する</button>
        </>
      ) : (
        <>
          <label for="inputId">受け取ったId:</label>
          <input type="text" id="inputId" name="inputId" required />
          <button>入館する</button>
        </>
      )}
    </div>
  );
}
