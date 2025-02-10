import Sidebar from '@/components/members/ui/sidebar';
import Header from '@/components/members/ui/header';

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden ">
      <Sidebar />
      <div className="relative flex flex-col flex-1 overflow-y-auto">
        <Header />
        <main className="grow [&>*:first-child]:scroll-mt-16 ">
          <div className="min-h-[101vh]">{children}</div>
        </main>
      </div>
    </div>
  );
}
