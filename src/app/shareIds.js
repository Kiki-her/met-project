import Popup from "reactjs-popup";

export default function GetIds({targetId}) {
  return (
    <Popup
      trigger={
        <>
          <div>IDを発行</div>
        </>
      }
    >
      <>
        <div>ギャラリーのID</div>
        <div>{targetId}</div>
      </>
    </Popup>
  );
}
