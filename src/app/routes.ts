import { createBrowserRouter } from "react-router";
import { AdminPage } from "./pages/AdminPage";
import { MobileInputPage } from "./pages/MobileInputPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AdminPage,
  },
  {
    path: "/mobile",
    Component: MobileInputPage,
  },
]);
