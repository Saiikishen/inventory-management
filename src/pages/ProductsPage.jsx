import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './ProductsPage.css';

const ProductsPage = () => {
    return (
        <div className="products-page">
            <nav className="products-nav">
                <NavLink to="/products" end className={({ isActive }) => isActive ? 'products-nav-link active' : 'products-nav-link'}>
                    All Devices
                </NavLink>
                <NavLink to="/products/add" className={({ isActive }) => isActive ? 'products-nav-link active' : 'products-nav-link'}>
                    Add Device
                </NavLink>
                <NavLink to="/products/orders" className={({ isActive }) => isActive ? 'products-nav-link active' : 'products-nav-link'}>
                    Orders
                </NavLink>
                <NavLink to="/products/list" className={({ isActive }) => isActive ? 'products-nav-link active' : 'products-nav-link'}>
                    Orders List
                </NavLink>
            </nav>
            <Outlet />
        </div>
    );
};

export default ProductsPage;
