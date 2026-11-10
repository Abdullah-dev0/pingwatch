import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { NotFound } from "./components/NotFound";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// the dashboard is the only page (tab and page live in ?query), so any other path is a 404
const isDashboard = window.location.pathname === "/";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>{isDashboard ? <App /> : <NotFound />}</QueryClientProvider>
	</StrictMode>,
);
