import Popup from "reactjs-popup";

export default function GetIds({targetId}) {
  return (
    <Popup
      trigger={
        <>
          <button>IDを発行</button>
        </>
      }
      position="canter center"
    >
      <>
        <div>ギャラリーのID</div>
        <div>{targetId}</div>
      </>
    </Popup>
  );
}
