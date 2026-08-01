import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const RootLayout = () => {
  const { checkAuth } = useAuthStore();

  //this needs to NOT run on pages that don't require authentication
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <div className="p-2 flex gap-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/signin" className="[&.active]:font-bold">
          Sign In
        </Link>{" "}
        <Link to="/signup" className="[&.active]:font-bold">
          Sign Up
        </Link>
      </div>
      <hr />
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
    </>
  );
};

export const Route = createRootRoute({ component: RootLayout });
