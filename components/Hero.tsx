'use client';
import React from 'react';
import Image from 'next/image';
import CoOpBuilding from '@/public/co-op-outside.webp';
import { Slide } from 'react-awesome-reveal';

interface HeroProps {
  title: string;
  description?: string;
  showLogo?: boolean;
  useSlideEffect?: boolean;
}

export default function Hero({
  title,
  description,
  showLogo,
  useSlideEffect = true,
}: HeroProps) {
  const ContentWrapper = useSlideEffect ? Slide : React.Fragment;

  const getWrapperProps = (direction: 'left' | 'up') => {
    return useSlideEffect ? { direction, triggerOnce: true } : {};
  };

  return (
    <section className="relative bg-primary overflow-hidden">
      <div className="pt-12 sm:pt-14 md:pt-16">
        <div className="py-12 sm:py-16 sm:mb-28 mb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              {showLogo && (
                <div className="relative z-10 w-full lg:w-1/2 mb-8 lg:mb-0 lg:mr-0">
                  <ContentWrapper {...getWrapperProps('left')}>
                    <div className="flex justify-center lg:justify-start">
                      <Image
                        src={CoOpBuilding}
                        alt="Brighton Rock Housing Co-op Building"
                        width={500}
                        height={500}
                        className="rounded-2xl"
                        priority
                      />
                    </div>
                  </ContentWrapper>
                </div>
              )}
              <div
                className={`${
                  showLogo
                    ? 'text-center lg:text-left lg:w-1/2'
                    : 'text-center lg:text-left w-full'
                }`}
              >
                <ContentWrapper {...getWrapperProps('up')}>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl text-white dark:text-foreground font-bold mb-4 sm:mb-6">
                    {title}
                  </h1>
                  {description && (
                    <p className="text-xl sm:text-2xl text-white dark:text-foreground">
                      {description}
                    </p>
                  )}
                </ContentWrapper>
              </div>
            </div>
          </div>
        </div>
      </div>
      <svg
        className="absolute bottom-0 left-0 w-full h-auto"
        viewBox="0 0 1920 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="fill-background"
          d="M0,158.755s63.9,52.163,179.472,50.736c121.494-1.5,185.839-49.738,305.984-49.733,109.21,0,181.491,51.733,300.537,50.233,123.941-1.562,225.214-50.126,390.43-50.374,123.821-.185,353.982,58.374,458.976,56.373,217.907-4.153,284.6-57.236,284.6-57.236V351.03H0V158.755Z"
          transform="translate(0 -158.755)"
        />
      </svg>
    </section>
  );
}
