import {useEffect, useState} from "react";
import Popup from "reactjs-popup";
import style from "./showImage.module.css";
import "reactjs-popup/dist/index.css";
import infomation from "@/db/fetchedData";
import {Swiper, SwiperSlide} from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import {Autoplay, Pagination, Navigation} from "swiper/modules";
import {onSnapshot, colRef, addDoc, q, getDoc, doc, db} from "../db/firebase";
import ShareIds from "./shareIds";

export default function ShowImage({
  data,
  setData,
  isFrag,
  setFrag,
  targetId,
  dataCount,
  setId,
}) {
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
  }, [isFrag]);
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

  return data ? (
    <>
      <Swiper
        slidesPerView={1}
        style={{
          "--swiper-navigation-color": "#fff",
        }}
        lazy="true"
        spaceBetween={30}
        centeredSlides={true}
        centeredSlidesBounds={true}
        updateOnWindowResize={true}
        autoplay={{
          delay: 10000,
          disableOnInteraction: false,
        }}
        loop={true}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper"
      >
        {data.map(obj => {
          return (
            <>
              <SwiperSlide style={{margin: "0 auto"}}>
                <Popup
                  trigger={
                    <img
                      src={obj.primaryImageSmall}
                      alt={obj.title}
                      className={style.img}
                    />
                  }
                  position="canter center"
                >
                  <div className={style.text}>{obj.title}</div>
                  <div className={style.text}>{obj.artistDisplayName}</div>
                  <div className={style.text}>{obj.artistDisplayBio}</div>
                  <div className={style.url}>
                    <a href={obj.objectURL}>The Met page</a>
                  </div>
                </Popup>
              </SwiperSlide>
            </>
          );
        })}
      </Swiper>
      <div
        className={style.description}
        onClick={() => {
          let nextFrag = !isFrag;
          setFrag(nextFrag);
        }}
      >
        Show more arts.
      </div>
      <ShareIds targetId={targetId} />
    </>
  ) : (
    <div>Now Loading...</div>
  );
}
