import fs from "fs";
import {useState} from "react";
import ShowImage from "./showImage";
import CsvToJson from "./csvToJson";

export default function ReadCsv() {
  const [data, setData] = useState([]);

  //   fs.createReadStream("src/data/openaccess/MetObjects.csv")
  //     .pipe(parse({delimiter: ",", from_line: 2}))
  //     .on("data", function (row) {
  //       setData([...data, row]);
  //     })
  //     .on("end", function () {
  //       console.log("finished");
  //     })
  //     .on("error", function (error) {
  //       console.log(error.message);
  //     });
  /*
  fs.createReadStream("src/data/openaccess/MetObjects.txt")
    .pipe(
      parse({
        delimiter: ",",
        columns: true,
        trim: true,
      })
    )
    .on("data", row => {
      setData([...data, row]);
    })
    .on("end", () => {
      console.log("CSV file successfully processed");
    });
    */
  //   setData(CsvToJson({path: "src/data/openaccess/MetObjects.csv"}));
  return <ShowImage />;
}
