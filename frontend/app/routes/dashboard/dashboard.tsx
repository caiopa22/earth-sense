import { Header } from "~/routes/dashboard/components/Header";
import { Sidebar } from "~/routes/dashboard/components/Sidebar";
import { useDashboard } from "~/routes/dashboard/hooks/useDashboard";
import { DevicesPage } from "~/routes/dashboard/pages/DevicesPage";
import { EarthAgentPage } from "~/routes/dashboard/pages/EarthAgentPage";
import { HistoryPage } from "~/routes/dashboard/pages/HistoryPage";
import { OverviewPage } from "~/routes/dashboard/pages/OverviewPage";

export function meta() {
  return [
    { title: "Dashboard — EarthSense" },
    {
      name: "description",
      content: "Painel de monitoramento de umidade do solo em tempo real da plataforma EarthSense.",
    },
  ];
}

export default function DashboardRoute() {
  const dashboard = useDashboard();
  const {
    profile,
    devices,
    readings,
    alerts,
    selectedDeviceId,
    setSelectedDeviceId,
    activePage,
    setActivePage,
  } = dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header profile={profile} alerts={alerts} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {activePage === "overview" && (
            <OverviewPage
              profile={profile}
              devices={devices}
              readings={readings}
              alerts={alerts}
              isLoading={false}
              selectedDeviceId={selectedDeviceId}
              setSelectedDeviceId={setSelectedDeviceId}
            />
          )}
          {activePage === "devices" && <DevicesPage devices={devices} />}
          {activePage === "history" && <HistoryPage devices={devices} readings={readings} />}
          {activePage === "agent" && <EarthAgentPage />}
        </main>
      </div>
    </div>
  );
}
