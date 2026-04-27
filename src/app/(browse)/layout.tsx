import { BrowseSidebar } from "@/components/layout/browse-sidebar";

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <BrowseSidebar />
      <main className="flex-1 overflow-y-auto p-6 pt-14 lg:pt-6">
        {children}
      </main>
    </div>
  );
}
