import React, { useState, useEffect } from "react";
import { Typography } from "@mui/material";

const SystemMetrics = () => {
    const [metrics, setMetrics] = useState({
        cpu_percent: 0,
        memory: { total: 0, used: 0, percent: 0 },
        disk: { total: 0, used: 0, percent: 0 },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                setError(null);
                const response = await fetch(
                    `${process.env.REACT_APP_BACKEND_URL}/metrics`
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch metrics");
                }
                const data = await response.json();
                setMetrics(data);
            } catch (error) {
                console.error("Failed to fetch metrics:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Loading metrics...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="space-y-4">
            <div>
                <Typography variant="subtitle1">CPU Usage</Typography>
                <Typography variant="h6">{metrics.cpu_percent}%</Typography>
            </div>
            <div>
                <Typography variant="subtitle1">Memory</Typography>
                <Typography variant="h6">
                    {Math.round(metrics.memory.used / (1024 * 1024 * 1024))}GB /
                    {Math.round(metrics.memory.total / (1024 * 1024 * 1024))}GB
                    ({metrics.memory.percent}%)
                </Typography>
            </div>
            <div>
                <Typography variant="subtitle1">Disk</Typography>
                <Typography variant="h6">
                    {Math.round(metrics.disk.used / (1024 * 1024 * 1024))}GB /
                    {Math.round(metrics.disk.total / (1024 * 1024 * 1024))}GB (
                    {metrics.disk.percent}%)
                </Typography>
            </div>
        </div>
    );
};

export default SystemMetrics;
