import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import Projects from './pages/Projects';
import ProjectBOM from './pages/ProjectBOM';
import ComponentCatalogPage from './pages/ComponentCatalogPage';
import TransactionLogPage from './pages/TransactionLogPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import Circulation from './pages/Circulation';

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    return (
        <Router>
            {user ? (
                <>
                    <Navbar />
                    <main>
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/project/:projectId" element={<ProjectBOM />} />
                            <Route path="/components" element={<ComponentCatalogPage />} />
                            <Route path="/transactions" element={<TransactionLogPage />} />
                            <Route path="/circulation" element={<Circulation />} />
                            <Route path="*" element={<Navigate to="/" />} />
                        </Routes>
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
