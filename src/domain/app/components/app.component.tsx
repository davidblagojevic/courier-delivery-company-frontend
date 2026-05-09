import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from './layout';

export const App: React.FC = () => (
  <Layout>
    <Outlet />
  </Layout>
);
