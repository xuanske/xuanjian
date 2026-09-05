import { createFileRoute } from "@tanstack/react-router";
import { App } from "@/components/xuan/app";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <App />;
}
