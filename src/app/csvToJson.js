import fs from "fs";
import Papa from "papaparse";
import {useState} from "react";
import ShowImage from "./showImage";

// export default function CsvToJson() {
//   const [info, setInfo] = useState();
//   const data = fs.readFileSync("src/data/openaccess/MetObjects.csv", "utf8");
//   const results = Papa.parse(data, {
//     header: true,
//     dynamicTyping: true,
//     skipEmptyLines: true,
//   });

//   setInfo(results.data);
//   return <ShowImage info={info} />;
// }
