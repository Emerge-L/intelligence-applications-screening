import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Home } from "./components/Home";
import { VacancyList } from "./components/VacancyList";
import { ApplyForm } from "./components/ApplyForm";
import { Dashboard } from "./components/Dashboard";
import { BulkUpload } from "./components/BulkUpload";
import { ApplicationDetails } from "./components/ApplicationDetails";
import { Analytics } from "./components/Analytics";
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "vacancies", Component: VacancyList },
      { path: "apply/:vacancyId", Component: ApplyForm },
      { path: "dashboard", Component: Dashboard },
      { path: "bulk-upload", Component: BulkUpload },
      { path: "applications/:id", Component: ApplicationDetails },
      { path: "analytics/:vacancyId", Component: Analytics },
      { path: "*", Component: NotFound },
    ],
  },
]);