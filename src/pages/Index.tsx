
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/components/dashboard/Dashboard';

const Index = () => {
  return (
    <Layout>
      <Dashboard activeTable="countries" openEditSidebar={() => {}} />
    </Layout>
  );
};

export default Index;
