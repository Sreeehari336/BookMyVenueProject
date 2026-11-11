import { useNavigate } from "react-router-dom";

import { removeToken } from "../utils/token";

import "./LogoutButton.css";

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login", { replace: true });
  };

  return (
    <button
      className="logout-button"
      type="button"
      onClick={handleLogout}
    >
      Sign Out
    </button>
  );
}

export default LogoutButton;
