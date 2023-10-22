import {useEffect, useState} from "react";
import ShowImage from "./showImage";

export default function GetIds({targetId, setId}) {
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
      <label for="targetId">招待されたID</label>
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
        }}
      >
        Submit
      </button>
    </>
  );
}
