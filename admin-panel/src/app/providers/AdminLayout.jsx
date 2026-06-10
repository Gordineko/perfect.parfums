import "../style/globals.scss";

import { Outlet } from "react-router-dom";

import SideBar from "../../widgets/sidebar";


export default function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <SideBar />

      <main style={{ flex: 1, padding: 24}}>
        <Outlet />
      </main>
    </div>
  );
}
