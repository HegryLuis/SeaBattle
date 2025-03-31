import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { context } from "../context";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useContext(context);
  return isAuthenticated ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
