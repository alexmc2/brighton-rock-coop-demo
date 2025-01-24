import React from 'react';
import Hero from '@/components/Hero';
import FadeWrapper from './FadeWrapper';

const MeetingsPage: React.FC = () => {
  const meetingDates = [
    { date: 'Tue, Jan 14th', time: '7:30pm', location: '395' },
    { date: 'Wed, Feb 12th', time: '7:30pm', location: '397' },
    { date: 'Thur, Mar 13th', time: '7:30pm', location: '399' },
    { date: 'Tue, Apr 15th', time: '7:30pm', location: '395 (AGM)' },
    { date: 'Wed, May 14th', time: '7:30pm', location: '397' },
    { date: 'Thur, Jun 12th', time: '7:30pm', location: '399' },
    { date: 'Tue, Jul 15th', time: '7:30pm', location: '395' },
    { date: 'Wed, Aug 13th', time: '7:30pm', location: '397' },
    { date: 'Thur, Sept 18th', time: '7:30pm', location: '399' },
    { date: 'Tue, Oct 14th', time: '7:30pm', location: '395' },
    { date: 'Wed, Nov 12th', time: '7:30pm', location: '397' },
    { date: 'Thur, Dec 12th', time: '7:30pm', location: '399' },
  ];

  return (
    <div>
      <Hero title="Meeting Dates" useSlideEffect={false} />

      <section className="bg-background py-16">
        <FadeWrapper useCustomAnimation delay={0}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card rounded-2xl shadow-lg p-8">
              <h2 className="md:text-3xl text-2xl font-bold mb-6 text-foreground text-center">
                Meeting Dates - 2025
              </h2>
              <p className="mb-8 md:text-xl text-lg text-foreground text-center">
                Meetings are held monthly. Visitors are welcome to attend if
                they contact the secretary in advance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {meetingDates.map((meeting, index) => (
                  <FadeWrapper
                    key={index}
                    useCustomAnimation
                    delay={index * 25}
                  >
                    <div className="bg-background p-4 rounded-md shadow-sm">
                      <p className="text-lg font-semibold text-foreground">
                        {meeting.date}
                      </p>
                      <p className="text-md text-foreground">{meeting.time}</p>
                      <p className="text-md text-primary dark:text-sky-500">
                        Location: {meeting.location}
                      </p>
                    </div>
                  </FadeWrapper>
                ))}
              </div>
              <FadeWrapper useCustomAnimation delay={meetingDates.length * 25}>
                <p className="mt-10 text-xl text-foreground text-center">
                  To attend a meeting, please email the secretary at <br />
                  <a
                    href="mailto:brightonrockhousingco-op@outlook.com"
                    className="text-primary dark:text-sky-500 hover:underline font-semibold"
                  >
                    brightonrockhousingco-op@outlook.com
                  </a>
                </p>
              </FadeWrapper>
            </div>
          </div>
        </FadeWrapper>
      </section>
    </div>
  );
};

export default MeetingsPage;
