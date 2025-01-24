// src/app/vacancies/page.tsx
import React from 'react';
import Hero from '@/components/Hero';
import VacanciesSection from '@/components/VacanciesSection';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';

export default function VacanciesPage() {
  return (
    <div>
      <Header />
      <VacanciesSection />
      <SiteFooter />
    </div>
  );
}
