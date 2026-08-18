import { Navigate, Route, Routes } from 'react-router-dom';

import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import AlunoDetailPage from '../pages/AlunoDetailPage';
import AlunosPage from '../pages/AlunosPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ControloAulaDetailPage from '../pages/ControloAulaDetailPage';
import ControloAulasPage from '../pages/ControloAulasPage';
import DashboardPage from '../pages/DashboardPage';
import DisciplinaDetailPage from '../pages/DisciplinaDetailPage';
import DisciplinasPage from '../pages/DisciplinasPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import LecionacaoDetailPage from '../pages/LecionacaoDetailPage';
import LecionacoesPage from '../pages/LecionacoesPage';
import LoginPage from '../pages/LoginPage';
import OcorrenciaDetailPage from '../pages/OcorrenciaDetailPage';
import OcorrenciasPage from '../pages/OcorrenciasPage';
import PlanificacaoDetailPage from '../pages/PlanificacaoDetailPage';
import PlanificacoesPage from '../pages/PlanificacoesPage';
import PctAnalysisPage from '../pages/PctAnalysisPage';
import PctDetailPage from '../pages/PctDetailPage';
import PctPage from '../pages/PctPage';
import ProfessorDetailPage from '../pages/ProfessorDetailPage';
import ProfessoresPage from '../pages/ProfessoresPage';
import ProfilePage from '../pages/ProfilePage';
import RelatoriosPage from '../pages/RelatoriosPage';
import ReuniaoDetailPage from '../pages/ReuniaoDetailPage';
import ReunioesPage from '../pages/ReunioesPage';
import SettingsPage from '../pages/SettingsPage';
import TiposOcorrenciaPage from '../pages/TiposOcorrenciaPage';
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
          <Route path="/disciplinas" element={<DisciplinasPage />} />
          <Route path="/disciplinas/:id" element={<DisciplinaDetailPage />} />
          <Route path="/turmas" element={<TurmasPage />} />
          <Route path="/turmas/:id" element={<TurmaDetailPage />} />
          <Route path="/alunos" element={<AlunosPage />} />
          <Route path="/alunos/:id" element={<AlunoDetailPage />} />
          <Route path="/leccionacoes" element={<LecionacoesPage />} />
          <Route path="/leccionacoes/:id" element={<LecionacaoDetailPage />} />
          <Route path="/lecionacoes" element={<LecionacoesPage />} />
          <Route path="/lecionacoes/:id" element={<LecionacaoDetailPage />} />
          <Route path="/planificacoes" element={<PlanificacoesPage />} />
          <Route path="/planificacoes/:id" element={<PlanificacaoDetailPage />} />
          <Route path="/controlo-aulas" element={<ControloAulasPage />} />
          <Route path="/controlo-aulas/:id" element={<ControloAulaDetailPage />} />
          <Route path="/pct" element={<PctPage />} />
          <Route path="/pct/:id" element={<PctDetailPage />} />
          <Route path="/analise-pct" element={<PctAnalysisPage />} />
          <Route path="/ocorrencias" element={<OcorrenciasPage />} />
          <Route path="/ocorrencias/:id" element={<OcorrenciaDetailPage />} />
          <Route path="/tipos-ocorrencias" element={<TiposOcorrenciaPage />} />
          <Route path="/reunioes" element={<ReunioesPage />} />
          <Route path="/reunioes/:id" element={<ReuniaoDetailPage />} />
          <Route path="/relatorios" element={<RelatoriosPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
