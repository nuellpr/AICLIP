"use client";

import dynamic from 'next/dynamic';

const DashboardNewClient = dynamic(() => import('./DashboardNewClient'), { 
  ssr: false,
});

export default function NewProjectPage() {
  return <DashboardNewClient />;
}
