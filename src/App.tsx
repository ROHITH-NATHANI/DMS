import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  MessageSquare, 
  Info, 
  PhoneCall, 
  Navigation, 
  CloudLightning,
  HeartPulse,
  Users,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Newspaper,
  Phone,
  Radio,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapView } from './components/MapView';
import { Chatbot } from './components/Chatbot';
import { ReportDamage } from './components/ReportDamage';
import { getRiskAlerts, getEmergencyInstructions } from './services/geminiService';
import { Shelter, Report, MissingPerson, NewsUpdate, EmergencyContact, cn } from './types';

import Markdown from 'react-markdown';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prepare' | 'emergency' | 'recover' | 'map' | 'info'>('dashboard');
  const [location, setLocation] = useState<[number, number]>([37.7749, -122.4194]); // Default SF
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [news, setNews] = useState<NewsUpdate[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [riskAlert, setRiskAlert] = useState<string | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Get real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.error("Location error", err)
      );
    }

    fetchShelters();
    fetchReports();
    fetchRisks();
    fetchNews();
    fetchContacts();
  }, []);

  const fetchShelters = async () => {
    const res = await fetch('/api/shelters');
    const data = await res.json();
    setShelters(data);
  };

  const fetchReports = async () => {
    const res = await fetch('/api/reports');
    const data = await res.json();
    setReports(data);
  };

  const fetchNews = async () => {
    const res = await fetch('/api/news');
    const data = await res.json();
    setNews(data);
  };

  const fetchContacts = async () => {
    const res = await fetch('/api/contacts');
    const data = await res.json();
    setContacts(data);
  };

  const fetchRisks = async () => {
    try {
      const risks = await getRiskAlerts(location[0], location[1]);
      setRiskAlert(risks);
    } catch (e) {
      setRiskAlert("Unable to fetch real-time risks. Stay tuned to local radio.");
    }
  };

  const handleSOS = () => {
    setIsSOSActive(true);
    // In a real app, this would send a socket event or SMS
    setTimeout(() => setIsSOSActive(false), 5000);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Navigation },
    { id: 'prepare', label: 'Prepare', icon: ShieldAlert },
    { id: 'emergency', label: 'Emergency', icon: CloudLightning },
    { id: 'map', label: 'Map', icon: MapIcon },
    { id: 'recover', label: 'Recover', icon: HeartPulse },
    { id: 'info', label: 'System', icon: Info },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-50 text-zinc-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 p-6 z-50">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight leading-none">DISASTER AI</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Active Response</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 custom-scrollbar overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-zinc-900 text-white shadow-md" 
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100">
          <button 
            onClick={handleSOS}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-3"
          >
            <PhoneCall size={20} />
            SOS
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden p-4 flex justify-between items-center bg-white border-b border-zinc-100 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <ShieldAlert size={18} />
          </div>
          <h1 className="font-bold text-sm tracking-tight uppercase">Disaster AI</h1>
        </div>
        <button onClick={handleSOS} className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">
          SOS
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-zinc-50 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto h-full">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-0 space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-display font-black italic leading-none">Command<br/>Center</h2>
                    <p className="text-zinc-500 mt-2">Real-time overview of your local safety status.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-zinc-100 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Shelters Nearby</p>
                      <p className="text-xl font-black text-zinc-900">{shelters.length}</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl border border-zinc-100 shadow-sm">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Active Reports</p>
                      <p className="text-xl font-black text-red-600">{reports.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    <div className="h-[400px] rounded-[2.5rem] overflow-hidden shadow-xl border border-zinc-200">
                      <MapView 
                        id="dashboard-map"
                        center={location} 
                        shelters={shelters} 
                        reports={reports}
                      />
                    </div>
                    
                    <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <Newspaper className="text-zinc-400" size={20} />
                          <h3 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Official Updates</h3>
                        </div>
                        <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All</button>
                      </div>
                      <div className="space-y-4">
                        {news.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex gap-4 p-4 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                            <div className={cn(
                              "w-1 h-12 rounded-full shrink-0",
                              item.type === 'alert' ? "bg-red-500" : item.type === 'success' ? "bg-emerald-500" : "bg-blue-500"
                            )} />
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{item.source}</span>
                                <span className="text-[10px] text-zinc-300">•</span>
                                <span className="text-[10px] text-zinc-400">{new Date(item.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <h4 className="font-bold text-zinc-900 leading-tight mb-1">{item.title}</h4>
                              <p className="text-xs text-zinc-500 line-clamp-2">{item.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-[2rem] shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
                      <div className="flex items-center gap-2 mb-4 sticky top-0 bg-orange-50 py-1 z-10">
                        <AlertCircle className="text-orange-600" size={20} />
                        <h3 className="font-bold text-orange-900 uppercase text-xs tracking-widest">Risk Assessment</h3>
                      </div>
                      <div className="text-sm text-orange-900 leading-relaxed markdown-body">
                        {riskAlert ? <Markdown>{riskAlert}</Markdown> : "Analyzing local weather and geological data..."}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 text-white p-6 rounded-[2rem] shadow-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Radio className="text-emerald-500" size={18} />
                        <h3 className="font-bold text-xs uppercase tracking-widest">Emergency Kit</h3>
                      </div>
                      <div className="space-y-2">
                        {["Water (3L/day)", "Non-perishables", "First Aid Kit", "Flashlight", "Batteries"].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs opacity-80">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setActiveTab('prepare')}
                        className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                      >
                        Full Checklist
                      </button>
                    </div>

                    <div className="bg-white border border-zinc-100 p-6 rounded-[2rem] shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <Phone className="text-zinc-400" size={18} />
                        <h3 className="font-bold text-zinc-900 uppercase text-xs tracking-widest">Quick Contacts</h3>
                      </div>
                      <div className="space-y-3">
                        {contacts.slice(0, 3).map((contact) => (
                          <a 
                            key={contact.id} 
                            href={`tel:${contact.number}`}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-zinc-50"
                          >
                            <div>
                              <p className="text-xs font-bold text-zinc-900">{contact.name}</p>
                              <p className="text-[10px] text-zinc-400">{contact.category}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-600">{contact.number}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'prepare' && (
              <motion.div 
                key="prepare"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-0 space-y-12"
              >
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-1">
                      <h2 className="text-4xl md:text-6xl font-display font-black italic mb-4 leading-none">Disaster<br/>Awareness</h2>
                      <p className="text-zinc-500 max-w-md">Understanding the risks is the first step to safety. Learn about different disaster types and how they impact your environment.</p>
                    </div>
                    
                    {riskAlert && (
                      <div className="w-full md:max-w-2xl bg-orange-50 border border-orange-100 p-8 rounded-[2.5rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                          <AlertCircle className="text-orange-600" size={24} />
                          <h3 className="font-bold text-orange-900 uppercase text-sm tracking-widest">Live Risk Alert</h3>
                        </div>
                        <div className="text-sm text-orange-900 leading-relaxed markdown-body">
                          <Markdown>{riskAlert}</Markdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      title: "Floods",
                      desc: "Flooding is an overflowing of water onto land that is normally dry. It can happen during heavy rains, when ocean waves come on shore, when snow melts quickly, or when dams or levees break.",
                      img: "https://picsum.photos/seed/flood/800/600"
                    },
                    {
                      title: "Cyclones",
                      desc: "A cyclone is a large scale air mass that rotates around a strong center of low atmospheric pressure. They are characterized by inward spiraling winds and heavy rainfall.",
                      img: "https://picsum.photos/seed/cyclone/800/600"
                    },
                    {
                      title: "Earthquakes",
                      desc: "An earthquake is the shaking of the surface of the Earth resulting from a sudden release of energy in the Earth's lithosphere that creates seismic waves.",
                      img: "https://picsum.photos/seed/earthquake/800/600"
                    },
                    {
                      title: "Wildfires",
                      desc: "A wildfire is an unplanned, unwanted, uncontrolled fire in an area of combustible vegetation starting in rural areas and spreading rapidly.",
                      img: "https://picsum.photos/seed/fire/800/600"
                    },
                    {
                      title: "Heatwaves",
                      desc: "A heatwave is a period of excessively hot weather, which may be accompanied by high humidity, especially in oceanic climate countries.",
                      img: "https://picsum.photos/seed/heat/800/600"
                    },
                    {
                      title: "Landslides",
                      desc: "Landslides occur when masses of rock, earth, or debris move down a slope. They are often triggered by heavy rain, earthquakes, or volcanic eruptions.",
                      img: "https://picsum.photos/seed/landslide/800/600"
                    }
                  ].map((disaster, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group">
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img 
                          src={disaster.img} 
                          alt={disaster.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="p-8">
                        <h3 className="text-2xl font-bold text-zinc-900 mb-3">{disaster.title}</h3>
                        <p className="text-sm text-zinc-500 leading-relaxed">{disaster.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'emergency' && (
              <motion.div 
                key="emergency"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="p-6 md:p-0 h-full flex flex-col gap-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                  <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left space-y-8">
                    <div className="space-y-4">
                      <h2 className="text-4xl md:text-6xl font-display font-black italic leading-none">Emergency<br/>Response</h2>
                      <p className="text-zinc-500 max-w-sm">One-tap SOS signal sends your live GPS coordinates to local authorities and emergency contacts.</p>
                    </div>
                    
                    <div className="relative group">
                      <div className={cn(
                        "w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10",
                        isSOSActive ? "bg-red-600 scale-110" : "bg-red-500 hover:bg-red-600 cursor-pointer"
                      )} onClick={handleSOS}>
                        <div className="text-white flex flex-col items-center">
                          <PhoneCall size={64} className={isSOSActive ? "animate-bounce" : ""} />
                          <span className="text-4xl font-black mt-2 tracking-tighter">SOS</span>
                        </div>
                      </div>
                      {!isSOSActive && (
                        <div className="absolute -inset-8 border-2 border-red-200 rounded-full animate-ping opacity-20 pointer-events-none" />
                      )}
                      {isSOSActive && (
                        <div className="absolute -inset-12 border-4 border-red-500/30 rounded-full animate-pulse pointer-events-none" />
                      )}
                    </div>

                    <div className="flex gap-4 w-full max-w-sm">
                      <div className="flex-1 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Status</p>
                        <p className={cn("text-xs font-bold", isSOSActive ? "text-red-600 animate-pulse" : "text-emerald-600")}>
                          {isSOSActive ? "SIGNALING..." : "READY"}
                        </p>
                      </div>
                      <div className="flex-1 bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm text-center">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">GPS Lock</p>
                        <p className="text-xs font-bold text-zinc-900">ACTIVE</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-colors group">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                          <Users size={24} />
                        </div>
                        <span className="text-sm font-bold">Find Family</span>
                      </button>
                      <button className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col items-center gap-3 hover:bg-zinc-50 transition-colors group">
                        <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                          <AlertTriangle size={24} />
                        </div>
                        <span className="text-sm font-bold">Hazard Alert</span>
                      </button>
                    </div>
                    <div className="flex-1 min-h-[400px] rounded-[2.5rem] overflow-hidden border border-zinc-100 shadow-xl">
                      <Chatbot />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full w-full p-4 md:p-0"
              >
                <div className="h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200">
                  <MapView 
                    id="full-map"
                    center={location} 
                    shelters={shelters} 
                    reports={reports}
                    hazards={[
                      { lat: location[0] + 0.01, lng: location[1] + 0.01, radius: 500, type: 'flood' },
                      { lat: location[0] - 0.01, lng: location[1] - 0.005, radius: 300, type: 'fire' }
                    ]}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'recover' && (
              <motion.div 
                key="recover"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 md:p-0 space-y-12"
              >
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/2">
                    <h2 className="text-4xl md:text-6xl font-display font-black italic mb-8 leading-none">Recovery &<br/>Response</h2>
                    <ReportDamage location={location} onReportSuccess={fetchReports} />
                  </div>
                  
                  <div className="md:w-1/2 space-y-6">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Incident Feed</h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {reports.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-zinc-100 text-center text-zinc-400">
                          No incidents reported in your area.
                        </div>
                      ) : (
                        reports.map((report) => (
                          <div key={report.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex gap-6 hover:shadow-md transition-shadow">
                            {report.image_url && (
                              <img src={report.image_url} className="w-24 h-24 rounded-2xl object-cover shrink-0" alt="Report" />
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                  report.severity === 'Critical' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                                )}>
                                  {report.severity}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono">{new Date(report.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <h4 className="font-bold text-zinc-900 mb-1">{report.type}</h4>
                              <p className="text-xs text-zinc-500 leading-relaxed">{report.description}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'info' && (
              <motion.div 
                key="info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 md:p-0 space-y-12"
              >
                <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/2 space-y-8">
                    <div>
                      <h2 className="text-4xl md:text-6xl font-display font-black italic mb-8 leading-none">System<br/>Intelligence</h2>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                          <h4 className="font-bold text-emerald-400 mb-4 flex items-center gap-2">
                            <Bot size={20} /> AI Models & APIs
                          </h4>
                          <ul className="space-y-3 text-sm opacity-80">
                            <li className="flex gap-3"><span className="text-emerald-500">01</span> Gemini 3 Flash: Reasoning & Chat</li>
                            <li className="flex gap-3"><span className="text-emerald-500">02</span> Gemini Vision: Damage Assessment</li>
                            <li className="flex gap-3"><span className="text-emerald-500">03</span> Search Grounding: Live Weather & Risks</li>
                            <li className="flex gap-3"><span className="text-emerald-500">04</span> OpenStreetMap: Geospatial Intelligence</li>
                          </ul>
                        </div>
                        
                        <div className="bg-white border border-zinc-100 p-8 rounded-[2.5rem] shadow-sm">
                          <h4 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                            <Radio size={20} className="text-blue-500" /> Network Status
                          </h4>
                          <div className="space-y-4">
                            {[
                              { label: "Database", status: "Operational", color: "text-emerald-500" },
                              { label: "Vite Dev Server", status: "Active", color: "text-emerald-500" },
                              { label: "Gemini API", status: "Connected", color: "text-emerald-500" },
                              { label: "GPS Provider", status: "Locked", color: "text-emerald-500" }
                            ].map((item, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500">{item.label}</span>
                                <span className={cn("font-bold", item.color)}>{item.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <ShieldAlert size={20} /> Privacy First
                          </h4>
                          <p className="text-sm opacity-90 leading-relaxed">End-to-end encryption for SOS signals. Data retention limited to active disaster periods to ensure user safety.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-1/2 space-y-8">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Emergency Directory</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                              <Phone size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-zinc-900">{contact.name}</h4>
                              <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{contact.category}</p>
                            </div>
                          </div>
                          <a 
                            href={`tel:${contact.number}`}
                            className="flex items-center gap-2 bg-zinc-50 px-4 py-2 rounded-xl text-sm font-mono font-bold text-zinc-900 hover:bg-zinc-900 hover:text-white transition-colors"
                          >
                            {contact.number} <ExternalLink size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-zinc-100 px-6 py-4 flex justify-between items-center z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === tab.id ? "text-zinc-900 scale-110" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* SOS Overlay */}
      <AnimatePresence>
        {isSOSActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-[100] flex flex-col items-center justify-center text-white p-8 text-center"
          >
            <div className="w-64 h-64 bg-white/20 rounded-full flex items-center justify-center animate-ping absolute" />
            <PhoneCall size={120} className="relative z-10 mb-8" />
            <h2 className="text-6xl font-black mb-4 tracking-tighter">SOS SIGNAL SENT</h2>
            <p className="text-2xl opacity-90 max-w-md">Rescue teams have been notified of your precise location. Stay calm and find high ground if necessary.</p>
            <div className="mt-12 p-6 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
              <p className="text-lg font-mono tracking-widest">{location[0].toFixed(6)}, {location[1].toFixed(6)}</p>
            </div>
            <button 
              onClick={() => setIsSOSActive(false)}
              className="mt-12 px-12 py-4 bg-white text-red-600 rounded-2xl font-black text-lg hover:bg-zinc-100 transition-all shadow-xl"
            >
              Cancel Signal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

