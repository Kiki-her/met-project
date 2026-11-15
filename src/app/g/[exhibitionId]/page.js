import { exhibitionIds, getRoom, getExhibition, getNeighbours } from "@/content/registry";
import RoomShell from "@/components/RoomShell";

export function generateStaticParams() {
  return exhibitionIds.map(id => ({ exhibitionId: id }));
}

export function generateMetadata({ params }) {
  const ex = getExhibition(params.exhibitionId);
  if (!ex) return { title: "Not found" };
  return {
    title: `${ex.title.ja} / ${ex.title.en}`,
    description: `${ex.subtitle.ja} — ${ex.subtitle.en}`,
  };
}

export default function ExhibitionRoom({ params }) {
  const room = getRoom(params.exhibitionId);
  if (!room) {
    return (
      <main style={{ padding: "24vh 8vw", textAlign: "center" }}>
        <p>この展示室は存在しません。 / This gallery does not exist.</p>
      </main>
    );
  }
  return <RoomShell room={room} neighbours={getNeighbours(room.id)} />;
}
