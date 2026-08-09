import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import { detailConfigs, pageConfigs } from '../config/pageConfigs';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import DashboardPage from '../pages/DashboardPage';
import DetailPage from '../pages/DetailPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import LoginPage from '../pages/LoginPage';
import ManagementPage from '../pages/ManagementPage';
import MeetingsPage from '../pages/MeetingsPage';
import ProfilePage from '../pages/ProfilePage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-palavra-passe" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/alterar-palavra-passe" element={<ChangePasswordPage />} />
          <Route path="/professores" element={<ManagementPage config={pageConfigs.professores} />} />
          <Route path="/professores/:id" element={<DetailPage {...detailConfigs.professores} />} />
          <Route path="/turmas" element={<ManagementPage config={pageConfigs.turmas} />} />
          <Route path="/turmas/:id" element={<DetailPage {...detailConfigs.turmas} />} />
          <Route path="/alunos" element={<ManagementPage config={pageConfigs.alunos} />} />
          <Route path="/alunos/:id" element={<DetailPage {...detailConfigs.alunos} />} />
          <Route path="/planificacoes" element={<ManagementPage config={pageConfigs.planificacoes} />} />
          <Route path="/controlo-aulas" element={<ManagementPage config={pageConfigs.aulas} />} />
          <Route path="/pct" element={<ManagementPage config={pageConfigs.pct} />} />
          <Route path="/ocorrencias" element={<ManagementPage config={pageConfigs.ocorrencias} />} />
          <Route path="/tipos-ocorrencias" element={<ManagementPage config={pageConfigs.tiposOcorrencias} />} />
          <Route path="/reunioes" element={<MeetingsPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
