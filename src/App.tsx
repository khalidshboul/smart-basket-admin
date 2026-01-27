import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CategoriesPage } from './pages/CategoriesPage';
import { ItemsPage } from './pages/ItemsPage';
import { StoresPage } from './pages/StoresPage';
import { PricesPage } from './pages/PricesPage';
import { PreviewPage } from './pages/PreviewPage';
import { BarcodeSearchPage } from './pages/BarcodeSearchPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/prices" element={<PricesPage />} />
            <Route path="/barcode-search" element={<BarcodeSearchPage />} />
            <Route path="/preview" element={<PreviewPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
