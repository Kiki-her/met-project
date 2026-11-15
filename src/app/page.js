import { exhibitions } from "@/content/registry";
import Entry from "@/components/Entry";

export default function Home() {
  return <Entry exhibitions={exhibitions} />;
}
