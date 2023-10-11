import Image from "next/image";
import {useEffect, useState} from "react";
import ids from "@/data/openIds";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";

export default function ShowImage() {
  const [data, setData] = useState("");
  let id = Math.floor(Math.random() * ids.length);
  useEffect(() => {
    const getData = async () => {
      const res = await fetch(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
      );
      const infoObj = await res.json();
      if (infoObj.primaryImageSmall !== undefined) {
        setData(infoObj);
      } else {
        id = Math.floor(Math.random() * ids.length);
        getData();
      }
    };
    getData();
  }, []);

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
