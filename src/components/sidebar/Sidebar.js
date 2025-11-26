import React from "react";
import { NavLink } from "react-router-dom";
import { getConfig } from "@edx/frontend-platform";
import "./Sidebar.css";

const Sidebar = () => {
  const handleBackToStudio = () => {
    const redirectBackStudio = `${
      getConfig().COURSE_AUTHORING_MICROFRONTEND_URL
    }/home`;
    if (redirectBackStudio) {
      window.location.href = redirectBackStudio;
    }
  };

  return (
    <aside className="app-sidebar" aria-label="Sidebar">
      <div className="sidebar-header">Menu</div>
      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon" role="img" aria-label="home">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-home"
              aria-hidden="true"
            >
              <path d="M3 10.5 12 3l9 7.5"></path>
              <path d="M19 10.5V21H5V10.5"></path>
              <path d="M9 21V14h6v7"></path>
            </svg>
          </span>
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
        >
          <span className="nav-icon" role="img" aria-label="profile">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-user"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </span>
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-item back-link"
          onClick={() => handleBackToStudio()}
        >
          <span className="nav-icon" role="img" aria-label="back">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-log-in"
              aria-hidden="true"
            >
              <path d="m8 17-5-5 5-5"></path>
              <path d="M3 12h12"></path>
              <path d="M21 21V3a2 2 0 0 0-2-2H10"></path>
            </svg>
          </span>
          <span className="nav-label">Back to Studio</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
