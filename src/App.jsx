import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import SpecialNavbar from './components/SpecialNavbar';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import ProductionRunPage from './pages/ProductionRunPage';
import ComponentCatalogPage from './pages/ComponentCatalogPage';
import TransactionLogPage from './pages/TransactionLogPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Circulation from './pages/Circulation';
import ProductsPage from './pages/ProductsPage';
import DevicesPage from './pages/DevicesPage';
import OrdersPage from './pages/OrdersPage';
import AllDevicesPage from './pages/AllDevicesPage';
import OrdersListPage from './pages/OrdersListPage';

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    return (
        <Router>
            {user ? (
                <>
                    {user.email === 'pvsaikishen@gmail.com' ? <SpecialNavbar /> : <Navbar />}
                    <main>
                        {user.email === 'pvsaikishen@gmail.com' ? (
                            <Routes>
                                <Route path="/products/orders" element={<OrdersPage />} />
                                <Route path="/products/list" element={<OrdersListPage />} />
                                <Route path="*" element={<Navigate to="/products/orders" />} />
                            </Routes>
                        ) : (
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/projects" element={<ProjectPage />} />
                                <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
                                <Route path="/projects/:projectId/production" element={<ProductionRunPage />} />
                                <Route path="/components" element={<ComponentCatalogPage />} />
                                <Route path="/transactions" element={<TransactionLogPage />} />
                                <Route path="/circulation" element={<Circulation />} />
                                <Route path="/products" element={<ProductsPage />}>
                                    <Route index element={<AllDevicesPage />} />
                                    <Route path="add" element={<DevicesPage />} />
                                    <Route path="orders" element={<OrdersPage />} />
                                    <Route path="list" element={<OrdersListPage />} />
                                </Route>
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        )}
                    </main>
                </>
            ) : (
                <Routes>
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="*" element={<Navigate to="/signin" />} />
                </Routes>
            )}
        </Router>
    );
}

export default App;
