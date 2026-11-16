import { notFound } from "next/navigation";

// Sends unknown paths under /th or /en to the localized not-found page.
export default function CatchAll() {
  notFound();
}
