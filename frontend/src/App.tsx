import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import EventTypeListPage from "@/pages/EventTypeListPage";
import BookingPage from "@/pages/BookingPage";
import CreateEventTypePage from "@/pages/admin/CreateEventTypePage";
import UpcomingBookingsPage from "@/pages/admin/UpcomingBookingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<EventTypeListPage />} />
          <Route path="/book/:eventTypeId" element={<BookingPage />} />
          <Route
            path="/admin/event-types/new"
            element={<CreateEventTypePage />}
          />
          <Route
            path="/admin/bookings"
            element={<UpcomingBookingsPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
