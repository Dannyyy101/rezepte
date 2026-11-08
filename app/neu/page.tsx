import RezeptFormular from "@/components/rezept-formular";
import { erstelleRezept } from "./actions";

export default function NeuesRezeptSeite() {
  return <RezeptFormular action={erstelleRezept} />;
}
