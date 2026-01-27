import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import './Navbar.css';

const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
      <nav className="navbar">
        {user && (
          <div className="navbar-links">
            {user.email === 'user@example.com' ? (
              <>
                <NavLink to="/products/orders" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Orders</NavLink>
                <NavLink to="/products/list" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Orders List</NavLink>
                <button onClick={handleLogout} className="navbar-logout-button">Logout</button>
              </>
            ) : (
              <>
                <NavLink to="/" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Home</NavLink>
                <NavLink to="/projects" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Projects</NavLink>
                <NavLink to="/transactions" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Transactions</NavLink>
                <NavLink to="/circulation" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Circulation</NavLink>
                <NavLink to="/products" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Products</NavLink>
                {isAdmin && (
                  <NavLink to="/components" className={({ isActive }) => "navbar-link" + (isActive ? " active" : "")}>Component Catalog</NavLink>
                )}
                <button onClick={handleLogout} className="navbar-logout-button">Logout</button>
              </>
            )}
          </div>
        )}
      </nav>
  );
};

export default Navbar;
