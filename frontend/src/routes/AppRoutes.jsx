import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import { detailConfigs, pageConfigs } from '../config/pageConfigs';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AlunoDetailPage from '../pages/AlunoDetailPage';
import AlunosPage from '../pages/AlunosPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ControloAulaDetailPage from '../pages/ControloAulaDetailPage';
import ControloAulasPage from '../pages/ControloAulasPage';
import DashboardPage from '../pages/DashboardPage';
import DetailPage from '../pages/DetailPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import LoginPage from '../pages/LoginPage';
import ManagementPage from '../pages/ManagementPage';
import MeetingsPage from '../pages/MeetingsPage';
import PlanificacaoDetailPage from '../pages/PlanificacaoDetailPage';
import PlanificacoesPage from '../pages/PlanificacoesPage';
import ProfessorDetailPage from '../pages/ProfessorDetailPage';
import ProfessoresPage from '../pages/ProfessoresPage';
import ProfilePage from '../pages/ProfilePage';
import ReportsPage from '../pages/ReportsPage';
import SettingsPage from '../pages/SettingsPage';
import TurmaDetailPage from '../pages/TurmaDetailPage';
import TurmasPage from '../pages/TurmasPage';

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
          <Route path="/professores" element={<ProfessoresPage />} />
          <Route path="/professores/:id" element={<ProfessorDetailPage />} />
          <Route path="/turmas" element={<TurmasPage />} />
          <Route path="/turmas/:id" element={<TurmaDetailPage />} />
          <Route path="/alunos" element={<AlunosPage />} />
          <Route path="/alunos/:id" element={<AlunoDetailPage />} />
          <Route path="/planificacoes" element={<PlanificacoesPage />} />
          <Route path="/planificacoes/:id" element={<PlanificacaoDetailPage />} />
          <Route path="/controlo-aulas" element={<ControloAulasPage />} />
          <Route path="/controlo-aulas/:id" element={<ControloAulaDetailPage />} />
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
