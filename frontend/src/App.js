import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LogIn from './Authentication/Login';
import Layout from './Layout';
import PageNotFound from './Pages/PageNotFound';
import { routes } from './Routes';
import Qrgenerator from './Authentication/Qrgenerator';
import EmployeeLogIn from './Pages/userpages/Emplogin';
import './Assets/css/style.css';
import './Assets/css/responsive.css';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* adf */}
        <Route path="/" index element={<EmployeeLogIn />} />
        <Route path="/admin-login" index element={<LogIn />} />
        <Route path="/qrgenerator" index element={<Qrgenerator />} />
        <Route path="*" element={<PageNotFound />} />

        {routes.map((route) => {
          return (
            <Route
              key={route.id}
              path={route.path}
              element={
                <Layout
                  id={route.id}
                  navLink={route.path}
                  navItem={route.navItem}
                  component={route.component}
                />
              }
            />
          );
        })}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
