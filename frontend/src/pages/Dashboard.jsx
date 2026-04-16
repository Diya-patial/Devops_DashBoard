import { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { getDeployments, getHealthMetrics, getLogs } from "../services/api";

const chartDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusClasses = {
  success: "statusSuccess",
  failed: "statusFailed",
  pending: "statusPending",
  "in-progress": "statusProgress",
};

function Badge({ status }) {
  const statusClass = statusClasses[status] || "statusPending";
  return (
    <span className={`${styles.statusBadge} ${styles[statusClass]}`}>
      <span className={styles.statusDot} />
      {status}
    </span>
  );
}

export default function Dashboard() {
  const [deployments, setDeployments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [latestHealth, setLatestHealth] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const deploymentsRes = await getDeployments();
        const healthRes = await getHealthMetrics();
        const logsRes = await getLogs();

        const deploymentData = deploymentsRes.data;
        const healthData = healthRes.data;
        const logData = logsRes.data;

        setDeployments(deploymentData);
        setLogs(logData);

        const latestMetric =
          Array.isArray(healthData) && healthData.length > 0
            ? healthData[0]
            : null;
        setLatestHealth(latestMetric);

        const countsByDay = [0, 0, 0, 0, 0, 0, 0];
        deploymentData.forEach((item) => {
          const date = new Date(item.createdAt || item.deployedAt);
          countsByDay[date.getDay()] += 1;
        });

        const maxCount = Math.max(...countsByDay, 1);
        const weeklyData = chartDays.map((day, index) => ({
          day,
          count: countsByDay[index],
          height: `${Math.max((countsByDay[index] / maxCount) * 100, 8)}%`,
        }));

        setChartData(weeklyData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
    const interval = setInterval(() => {
    loadDashboard(); // refresh every 5 sec
  }, 5000);

  return () => clearInterval(interval); 
  }, []);

  const successCount = deployments.filter((item) => item.status === "success").length;
  const successRate = deployments.length
    ? `${((successCount / deployments.length) * 100).toFixed(1)}%`
    : "0%";

  const avgDuration = deployments.length
    ? `${Math.round(
        deployments.reduce((sum, item) => sum + (item.duration || 0), 0) /
          deployments.length,
      )} sec`
    : "0 sec";

  const activeServices = new Set(deployments.map((item) => item.serviceName)).size;

  const stats = [
    { label: "Total Deployments", value: String(deployments.length) },
    { label: "Success Rate", value: successRate },
    { label: "Avg Deploy Time", value: avgDuration },
    { label: "Active Services", value: String(activeServices) },
  ];

  const healthItems = latestHealth
    ? [
        { name: "CPU Usage",      value: latestHealth.cpuUsage || 0,      width: `${Math.min(latestHealth.cpuUsage || 0, 100)}%` },
        { name: "Memory Usage",   value: latestHealth.memoryUsage || 0,   width: `${Math.min(latestHealth.memoryUsage || 0, 100)}%` },
        { name: "Active Deploys", value: latestHealth.activeDeploys || 0, width: `${Math.min((latestHealth.activeDeploys || 0) * 10, 100)}%` },
        { name: "Critical Errors",value: latestHealth.criticalErrors || 0,width: `${Math.min((latestHealth.criticalErrors || 0) * 10, 100)}%` },
      ]
    : [];

  const recentActivity = deployments.slice(0, 5);

  if (loading) return <div className={styles.page}><p>Loading dashboard...</p></div>;
  if (error)   return <div className={styles.page}><p>Error: {error}</p></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.liveRow}>
            <span className={styles.liveDot} />
            <span className={styles.liveText}>LIVE</span>
            <span className={styles.headerSub}>System Overview</span>
          </div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>All systems monitored</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats.map((item) => (
          <div key={item.label} className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{item.label}</span>
            </div>
            <div className={styles.statValue}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className={styles.midGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Deployments</h2>
            <p className={styles.panelSub}>Last 7 days</p>
          </div>
          <div className={styles.chartWrap}>
            <div className={styles.chartBars}>
              {chartData.map((item) => (
                <div key={item.day} className={styles.barCol}>
                  <div className={styles.barTrack}>
                    <div className={styles.bar} style={{ height: item.height }} />
                  </div>
                  <span className={styles.barLabel}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Server Health</h2>
            <p className={styles.panelSub}>Live metrics</p>
          </div>
          <div className={styles.healthList}>
            {healthItems.map((item) => (
              <div key={item.name} className={styles.healthRow}>
                <div className={styles.healthMeta}>
                  <span className={styles.healthName}>{item.name}</span>
                  <span className={styles.healthVal}>{item.value}</span>
                </div>
                <div className={styles.healthTrack}>
                  <div className={styles.healthFill} style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Recent Activity</h2>
            <p className={styles.panelSub}>Latest pipeline runs</p>
          </div>
        </div>

        {/* tableWrapper enables horizontal scroll on mobile */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Service</th>
                <th>Environment</th>
                <th>Status</th>
                <th>Commit</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((row) => (
                <tr key={row._id} className={styles.tableRow}>
                  <td className={styles.tdService}>{row.serviceName}</td>
                  <td className={styles.tdMuted}>{row.environment}</td>
                  <td><Badge status={row.status} /></td>
                  <td className={styles.tdCommit}>{row.commitId || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.panelSub}>Total logs: {logs.length}</p>
      </div>
    </div>
  );
}
