import ROUTERS_PATHS from "consts/router-paths";
import React, { Suspense, Fragment, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from "components/LoadingScreen/index";

import AuthGuard from "components/AuthGuard";
import GuestGuard from "components/GuestGuard";
import MainLayout from "layouts/MainLayout";

interface IAuthGuardProps {
  children: React.ReactNode;
}

interface IGuestGuardProps {
  children: React.ReactNode;
}

interface IRoutesState {
  exact?: boolean;
  path?: string;
  guard?: React.FC<IAuthGuardProps | IGuestGuardProps>;
  layout?: any;
  component?: any;
  routes?: IRoutesState[];
}

export const renderRoutes = (routes: IRoutesState[]) => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {routes.map((route, i) => {
        const Guard = route.guard || Fragment;
        const Layout = route.layout || Fragment;
        const Component = route.component;
        return (
          <Route
            key={i}
            path={route.path}
            element={
              <Guard>
                <Layout>{route.routes ? renderRoutes(route.routes) : <Component />}</Layout>
              </Guard>
            }
          />
        );
      })}
    </Routes>
  </Suspense>
);

const RedirectToDashboardView = () => <Navigate to={ROUTERS_PATHS.DASHBOARD} replace />;

const routes: IRoutesState[] = [
  {
    path: ROUTERS_PATHS.NOT_FOUND,
    component: lazy(() => import("pages/NotFoundView")),
  },
  {
    guard: GuestGuard,
    path: ROUTERS_PATHS.LOGIN,
    component: lazy(() => import("pages/Login")),
  },
  {
    path: ROUTERS_PATHS.ALL,
    guard: AuthGuard,
    layout: MainLayout,
    routes: [
      {
        path: ROUTERS_PATHS.DASHBOARD,
        component: lazy(() => import("pages/Dashboard")),
      },

      {
        path: "/*",
        component: RedirectToDashboardView,
      },
    ],
  },
];

export default routes;
