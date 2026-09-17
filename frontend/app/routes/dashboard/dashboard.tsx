import Logo from "~/components/ui/logo";
import { Spinner } from "~/components/ui/spinner";
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

function DashboardLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="flex w-full max-w-xs flex-col items-center gap-6 text-center">
        <div className="relative flex size-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 shadow-lg shadow-primary/10">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-primary/10" />
          <Logo className="relative h-12 w-12 object-cover object-left" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm font-semibold tracking-tight">Preparando seu painel</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner className="size-3.5 text-primary" />
            <span>Sincronizando seus sensores...</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardRoute() {
  const {
    profile,
    devices,
    readings,
    alerts,
    selectedDeviceId,
    setSelectedDeviceId,
    activePage,
    setActivePage,
    isAuthenticated,
    isLoading,
    dataSource,
    setDataSource,
    createDevice,
    updateDevice,
    deleteDevice,
  } = useDashboard();

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthenticated || !profile) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <Header
          profile={profile}
          alerts={alerts}
          dataSource={dataSource}
          onToggleDataSource={setDataSource}
        />

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
          {activePage === "devices" && (
            <DevicesPage
              devices={devices}
              onCreateDevice={createDevice}
              onUpdateDevice={updateDevice}
              onDeleteDevice={deleteDevice}
            />
          )}
          {activePage === "history" && <HistoryPage devices={devices} readings={readings} />}
          {activePage === "agent" && <EarthAgentPage />}
        </main>
      </div>
    </div>
  );
}
