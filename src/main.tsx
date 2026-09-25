import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import { AppFrame } from './layouts/Shell';
import { RouteError } from './components/ErrorBoundary';
import Landing from './pages/Landing';
import CommandCenter from './pages/CommandCenter';
import Ask from './pages/Ask';
import Scenarios from './pages/Scenarios';
import Fx from './pages/Fx';
import Approvals from './pages/Approvals';
import { AgentDetail, Marketplace } from './pages/Marketplace';
import Trust from './pages/Trust';
import DevHome from './pages/DevHome';
import DevStart from './pages/DevStart';
import { DevApi } from './pages/DevApi';
import DevBuild from './pages/DevBuild';
import DevPublish from './pages/DevPublish';
import Advisor from './pages/Advisor';
import Strategy from './pages/Strategy';
import Research from './pages/Research';
import AiProcess from './pages/AiProcess';
import About from './pages/About';
import NotFound from './pages/NotFound';

const router = createBrowserRouter([
  {
    element: <AppFrame />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Landing /> },
      { path: '/app', element: <CommandCenter /> },
      { path: '/app/ask', element: <Ask /> },
      { path: '/app/scenarios', element: <Scenarios /> },
      { path: '/app/fx', element: <Fx /> },
      { path: '/app/approvals', element: <Approvals /> },
      { path: '/app/marketplace', element: <Marketplace /> },
      { path: '/app/marketplace/:agentId', element: <AgentDetail /> },
      { path: '/app/trust', element: <Trust /> },
      { path: '/dev', element: <DevHome /> },
      { path: '/dev/start', element: <DevStart /> },
      { path: '/dev/api', element: <DevApi /> },
      { path: '/dev/api/:endpointId', element: <DevApi /> },
      { path: '/dev/build', element: <DevBuild /> },
      { path: '/dev/publish', element: <DevPublish /> },
      { path: '/advisor', element: <Advisor /> },
      { path: '/strategy', element: <Strategy /> },
      { path: '/research', element: <Research /> },
      { path: '/ai-process', element: <AiProcess /> },
      { path: '/about', element: <About /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
