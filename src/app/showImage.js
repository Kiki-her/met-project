import Image from "next/image";
import {useEffect, useState} from "react";

export default function ShowImage() {
  const [data, setData] = useState("");
  useEffect(() => {
    const getData = async () => {
      const res = await fetch(
        "https://collectionapi.metmuseum.org/public/collection/v1/objects/10524"
      );
      const infoObj = await res.json();
      console.log("URL:", infoObj.primaryImageSmall);
      setData(infoObj.primaryImageSmall);
    };
    getData();
  }, []);

  return <Image src={data} width={500} height={500} alt="ak" />;
}
