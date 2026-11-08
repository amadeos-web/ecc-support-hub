import { useEffect } from 'react';
import { useRoute } from './lib/router';
import { MemberVarsProvider } from './lib/memberVars';
import { Sidebar } from './components/Sidebar';
import { TreatRequestPage } from './pages/TreatRequestPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ResourcesPage } from './pages/ResourcesPage';

export function App() {
  const { page, param } = useRoute();

  useEffect(() => {
    document.querySelector('.content')?.scrollTo({ top: 0 });
  }, [page, param]);

  return (
    <MemberVarsProvider>
      <div className="app">
        <Sidebar current={page} />
        <div className="main">
          <div className="content">
            {page === 'documents' ? <DocumentsPage typeId={param} /> : page === 'ressources' ? <ResourcesPage /> : <TreatRequestPage caseId={page === 'traiter' ? param : undefined} />}
          </div>
        </div>
      </div>
    </MemberVarsProvider>
  );
}
