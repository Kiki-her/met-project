import {useEffect, useState} from "react";
import ShowImage from "./showImage";
import {getDoc, doc, db} from "../db/firebase";
import style from "./getIds.module.css";

export default function GetIds({targetId, setId, setData}) {
  const [toImages, setImages] = useState(false);
  useEffect(() => {
    console.log("GOT ID");
  }, [targetId]);
  useEffect(() => {
    console.log("GO GARARYS");
  }, [toImages]);

  return toImages ? (
    <ShowImage targetId={targetId} />
  ) : (
    <>
      <label className={style.inputLabel} htmlFor="targetId">
        招待されたID
      </label>
      <input
        type="text"
        id="targetId"
        name="targetId"
        required
        value={targetId}
        onChange={e => {
          setId(e.target.value);
        }}
      />
      <button
        onClick={() => {
          setImages(true);
          const docRef = doc(db, "arts", targetId);
          getDoc(docRef).then(() => {
            const targetData = doc.data();
            const obj = JSON.parse(targetData.groups);
            console.log(obj, "PAERSED");
            setData(obj);
          });
        }}
      >
        Submit
      </button>
    </>
  );
}
