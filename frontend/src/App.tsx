import { Route, Routes } from 'react-router';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { FeedPage } from '@/features/posts/FeedPage';

const App = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<FeedPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
    </Routes>
  );
};

export default App;
