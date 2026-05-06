import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ConstructionDashboard.css';

const ConstructionDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        projectsAnalyzed: 0,
        materialsGenerated: 0,
        totalEstimated: 0,
        phasesTracked: 0,
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        setUser(JSON.parse(storedUser));

        // Load any persisted stats from localStorage
        const ps = localStorage.getItem('bmp_dashboard_stats');
        if (ps) {
            try { setStats(JSON.parse(ps)); } catch { }
        } else {
            // Demo stats
            const demo = { projectsAnalyzed: 12, materialsGenerated: 247, totalEstimated: 1842500, phasesTracked: 48 };
            setStats(demo);
            localStorage.setItem('bmp_dashboard_stats', JSON.stringify(demo));
        }
    }, [navigate]);

    const features = [
        {
            id: 'plan-analysis',
            icon: '📐',
            color: 'blue',
            title: 'Plan Analysis',
            subtitle: 'Step 1',
            desc: 'Upload an architectural plan (PDF / Image / CAD). AI extracts surface, rooms, walls and structural data.',
            path: '/ai-features/plan-analysis',
            badge: 'Computer Vision',
        },
        {
            id: 'materials',
            icon: '🧱',
            color: 'orange',
            title: 'Planning & Materials',
            subtitle: 'Step 2',
            desc: 'AI generates the full material list by category — Structure, Plumbing, Electrical, Finishing, Kitchen.',
            path: '/ai-features/recommend-materials-bmp',
            badge: 'AI Recommendation',
        },
        {
            id: 'progress',
            icon: '📸',
            color: 'green',
            title: 'Progress Monitoring',
            subtitle: 'Step 3',
            desc: 'Upload site photos. AI detects construction phases, estimates completion % and compares to schedule.',
            path: '/ai-features/progress-monitoring',
            badge: 'Vision AI',
        },
        {
            id: 'clustering',
            icon: '📊',
            color: 'purple',
            title: 'Project Clustering',
            subtitle: 'Analytics',
            desc: 'ML clustering of projects by type, cost and duration. Identifies profitable clusters and anomalies.',
            path: '/ai-features/clustering',
            badge: 'Machine Learning',
        },
        {
            id: 'assistant',
            icon: '🤖',
            color: 'amber',
            title: 'AI Assistant',
            subtitle: 'Chat',
            desc: 'Conversational AI for material recommendations, quote generation and price trend predictions.',
            path: '/ai-features/assistant',
            badge: 'GPT-Powered',
        },
        {
            id: 'reports',
            icon: '📑',
            color: 'teal',
            title: 'Auto Reports',
            subtitle: 'Export',
            desc: 'Generate PDF or Excel construction reports instantly with full cost breakdown and project summary.',
            path: '/ai-features/reports',
            badge: 'PDF / Excel',
        },
    ];

    const statCards = [
        { label: 'Plans Analyzed', value: stats.projectsAnalyzed, icon: '📐', suffix: '' },
        { label: 'Materials Generated', value: stats.materialsGenerated, icon: '🧱', suffix: '' },
        { label: 'Total Estimated', value: (stats.totalEstimated / 1000).toFixed(0), icon: '💰', suffix: 'k DT' },
        { label: 'Phases Tracked', value: stats.phasesTracked, icon: '📊', suffix: '' },
    ];

    return (
        <div className="cbd-page">
            {/* Ambient blobs */}
            <div className="cbd-blob cbd-blob-1" />
            <div className="cbd-blob cbd-blob-2" />
            <div className="cbd-blob cbd-blob-3" />

            <div className="cbd-container">
                {/* Hero */}
                <header className="cbd-hero">
                    <span className="cbd-hero-badge">🏗 BMP Construction AI — Intelligence Platform</span>
                    <h1 className="cbd-hero-title">
                        Smart Construction <br />
                        <span className="cbd-hero-accent">Planning Assistant</span>
                    </h1>
                    <p className="cbd-hero-sub">
                        From architectural plan to site progress tracking — AI-powered tools for smarter, faster, and more cost-efficient construction projects.
                    </p>
                    <div className="cbd-hero-actions">
                        <Link to="/ai-features/plan-analysis" className="cbd-btn cbd-btn-primary">
                            ✨ Start — Analyze a Plan
                        </Link>
                        <Link to="/ai-features/recommend-materials-bmp" className="cbd-btn cbd-btn-ghost">
                            🧱 Materials &amp; Estimate
                        </Link>
                    </div>
                </header>

                {/* Stats bar */}
                <div className="cbd-stats-bar">
                    {statCards.map((s, i) => (
                        <div key={i} className="cbd-stat-card">
                            <span className="cbd-stat-icon">{s.icon}</span>
                            <div className="cbd-stat-body">
                                <span className="cbd-stat-value">{s.value}{s.suffix}</span>
                                <span className="cbd-stat-label">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Workflow steps visual */}
                <div className="cbd-workflow">
                    <div className="cbd-workflow-step">
                        <div className="cbd-workflow-num">1</div>
                        <span>Upload Plan</span>
                    </div>
                    <div className="cbd-workflow-line" />
                    <div className="cbd-workflow-step">
                        <div className="cbd-workflow-num">2</div>
                        <span>AI Extracts Data</span>
                    </div>
                    <div className="cbd-workflow-line" />
                    <div className="cbd-workflow-step">
                        <div className="cbd-workflow-num">3</div>
                        <span>Generate Materials</span>
                    </div>
                    <div className="cbd-workflow-line" />
                    <div className="cbd-workflow-step">
                        <div className="cbd-workflow-num">4</div>
                        <span>Cost &amp; Timeline</span>
                    </div>
                    <div className="cbd-workflow-line" />
                    <div className="cbd-workflow-step">
                        <div className="cbd-workflow-num">5</div>
                        <span>Track Progress</span>
                    </div>
                </div>

                {/* Feature cards grid */}
                <div className="cbd-features-grid">
                    {features.map((f) => (
                        <Link key={f.id} to={f.path} className={`cbd-feature-card cbd-feat-${f.color}`}>
                            <div className="cbd-feat-header">
                                <div className={`cbd-feat-icon-wrap cbd-feat-icon-${f.color}`}>
                                    <span>{f.icon}</span>
                                </div>
                                <div>
                                    <span className="cbd-feat-subtitle">{f.subtitle}</span>
                                    <h3 className="cbd-feat-title">{f.title}</h3>
                                </div>
                                <span className="cbd-feat-badge">{f.badge}</span>
                            </div>
                            <p className="cbd-feat-desc">{f.desc}</p>
                            <span className="cbd-feat-arrow">Open →</span>
                        </Link>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default ConstructionDashboard;
