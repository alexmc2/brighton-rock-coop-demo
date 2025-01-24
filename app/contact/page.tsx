// src/app/vacancies/page.tsx
import React from 'react';
import Hero from '@/components/Hero';
import Contact from '@/components/ContactPage';
import Header from '@/components/Header';
import SiteFooter from '@/components/SiteFooter';

export default function ContactPage() {
  return (
    <div>
      <Header />
      <Contact />
      <SiteFooter />
    </div>
  );
}
