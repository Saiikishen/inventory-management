import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './SpecialNavbar.css';

const SpecialNavbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
      <nav className="special-navbar">
        {user && (
          <div className="special-navbar-links">
            <NavLink to="/products/orders" className={({ isActive }) => "special-navbar-link" + (isActive ? " active" : "")}>Orders</NavLink>
            <NavLink to="/products/list" className={({ isActive }) => "special-navbar-link" + (isActive ? " active" : "")}>Orders List</NavLink>
            <button onClick={handleLogout} className="special-navbar-logout-button">Logout</button>
          </div>
        )}
      </nav>
  );
};

export default SpecialNavbar;
