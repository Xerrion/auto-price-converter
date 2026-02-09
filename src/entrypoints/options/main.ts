import "../../app.css";
import App from "./App.svelte";
import { mount } from "svelte";
import { initializeTheme } from "$lib/theme";

initializeTheme();

const app = mount(App, {
  target: document.getElementById("app")!,
});

export default app;
