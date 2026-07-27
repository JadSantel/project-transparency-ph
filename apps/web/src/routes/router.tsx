import { createBrowserRouter } from 'react-router-dom';
import { MapPage } from '../pages/MapPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

export const router = createBrowserRouter([
  { path: '/', element: <MapPage /> },
  { path: '/projects/:idOrSlug', element: <ProjectDetailPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
]);
