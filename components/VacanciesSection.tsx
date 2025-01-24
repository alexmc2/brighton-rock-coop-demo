'use client';

import React, { useState } from 'react';
import Hero from '@/components/Hero';
import Modal from '@/components/Modal';
import { Button } from '@/components/ui/button';
import FadeWrapper from './FadeWrapper';
import { Fade } from 'react-awesome-reveal';

const VacanciesSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-background min-h-screen">
      <Hero title="Current Vacancies" useSlideEffect={false} />
      <section className="pt-12 pb-10">
        <FadeWrapper useCustomAnimation delay={0}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-2xl shadow-sm p-8">
              <h2 className="text-xl md:text-2xl font-semibold mb-4 text-foreground">
                We have no vacancies at the present time
              </h2>
              <p className="mb-4 text-md md:text-lg text-foreground ">
                If you want to be notified of future vacancies, please email{' '}
                <a
                  href="mailto:vacanciesbtnrock@gmail.com"
                  className="text-primary dark:text-sky-500 hover:text-primary/80"
                >
                  vacanciesbtnrock@gmail.com
                </a>
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground dark:text-foreground font-bold py-2 px-4 rounded text-md md:text-lg"
                onClick={() => setIsModalOpen(true)}
              >
                Our Application Process
              </Button>
            </div>
          </div>
        </FadeWrapper>
      </section>

      <Modal
        id="vacanciesModal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Application Process at Brighton Rock"
      >
        <VacanciesModalContent />
      </Modal>
    </div>
  );
};

const VacanciesModalContent: React.FC = () => (
  <ul className="list-disc p-3 text-md md:text-lg text-foreground space-y-4">
    <p>The application process is as follows:</p>
    <p>
      When vacancies arise, we invite those interested in joining us to visit
      the co-op where they can view the properties, meet some of our members,
      and ask any questions they may have. Application forms will be provided at
      the viewing, which should be completed and returned by the specified date.
    </p>
    <p>
      Your attendance at a general meeting would also be advantageous so that
      you can get a better understanding of how the co-op works. Our monthly
      meetings are typically on weekday evenings at 7:30 PM and the dates can be
      found{' '}
      <a
        href="https://brighton-rock.org/meetings"
        className="text-primary dark:text-secondary hover:underline"
      >
        here
      </a>
      .
    </p>
    <p>The shortlisting is based on the following criteria:</p>
    <ul className="list-disc pl-5 space-y-2">
      <li>Housing need</li>
      <li>
        Ability to pay rent (from wages or benefits) and expected duration of
        tenancy
      </li>
      <li>Relevant skills and what you can bring to the co-op</li>
      <li>
        Willingness to share, respect others, and uphold equal opportunities
      </li>
      <li>Ability to actively engage and work within a group</li>
      <li>Compatibility with co-op in terms of lifestyle and work</li>
    </ul>
    <p>
      If you are invited for an interview, our allocations officer will inform
      you of the time and place and at least five day&apos;s notice will be
      given.
    </p>
    <p>
      New members will connect with the secretary and rent officer to sign the
      tenancy agreement and membership forms. You are expected to move in and
      start paying rent within one month, unless other arrangements have been
      agreed.
    </p>
    <p>
      If you want to be notified of future vacancies, please contact our
      allocations officer at: <br />
      <a
        href="mailto: vacanciesbtnrock@gmail.com"
        className="text-primary dark:text-secondary hover:underline"
      >
        vacanciesbtnrock@gmail.com
      </a>
    </p>
  </ul>
);

export default VacanciesSection;
