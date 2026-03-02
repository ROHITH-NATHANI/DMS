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
  ExternalLink,
  Zap,
  Eye,
  Heart,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { MapView } from './components/MapView';
import { Chatbot } from './components/Chatbot';
import { ReportDamage } from './components/ReportDamage';
import { getRiskAlerts, getEmergencyInstructions } from './services/geminiService';
import { Shelter, Report, MissingPerson, NewsUpdate, EmergencyContact, cn } from './types';

const socket = io();

import Markdown from 'react-markdown';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prepare' | 'emergency' | 'recover' | 'map' | 'info'>('dashboard');
  const [location, setLocation] = useState<[number, number]>([37.7749, -122.4194]); // Default SF
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [news, setNews] = useState<NewsUpdate[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [presenceCount, setPresenceCount] = useState(0);
  const [riskAlert, setRiskAlert] = useState<string | null>(null);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Socket listeners
    socket.on('presence:update', (count: number) => {
      setPresenceCount(count);
    });

    socket.on('report:new', (report: Report) => {
      setReports(prev => [report, ...prev]);
    });

    socket.on('sos:alert', (data: any) => {
      // Show a temporary alert for other users' SOS
      console.log("Remote SOS Alert:", data);
    });

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

    return () => {
      socket.off('presence:update');
      socket.off('report:new');
      socket.off('sos:alert');
    };
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

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const newLoc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setLocation(newLoc);
        // If we are in the map tab, the MapView will auto-update because of the center prop
      });
    }
  };

  const handleSOS = () => {
    setIsSOSActive(true);
    socket.emit('sos:trigger', {
      location,
      timestamp: new Date().toISOString()
    });
    // In a real app, this would send a socket event or SMS
    setTimeout(() => setIsSOSActive(false), 5000);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Navigation, desc: 'Real-time Overview' },
    { id: 'prepare', label: 'Prepare', icon: ShieldAlert, desc: 'Safety Education' },
    { id: 'emergency', label: 'Emergency', icon: CloudLightning, desc: 'Immediate Response' },
    { id: 'map', label: 'Map', icon: MapIcon, desc: 'GIS Intelligence' },
    { id: 'recover', label: 'Recover', icon: HeartPulse, desc: 'Post-Disaster Aid' },
    { id: 'info', label: 'System', icon: Info, desc: 'Network Status' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-zinc-50 text-zinc-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-80 bg-zinc-950 border-r border-white/5 p-0 z-50 text-white shadow-2xl">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-950 shadow-2xl shadow-white/10 group hover:rotate-12 transition-transform duration-500">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter leading-none">SENTINEL</h1>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1.5">Intelligence Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 custom-scrollbar overflow-y-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                activeTab === tab.id 
                  ? "bg-white text-zinc-950 shadow-2xl shadow-white/10" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                activeTab === tab.id ? "bg-zinc-100 text-zinc-950" : "bg-white/5 text-zinc-500 group-hover:text-white"
              )}>
                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black uppercase tracking-tight leading-none">{tab.label}</p>
                <p className={cn(
                  "text-[10px] font-bold mt-1.5 uppercase tracking-widest opacity-50",
                  activeTab === tab.id ? "text-zinc-500" : "text-zinc-600"
                )}>{tab.desc}</p>
              </div>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-indicator"
                  className="absolute right-0 top-0 bottom-0 w-1.5 bg-zinc-950 rounded-l-full"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-6 bg-zinc-950/50 backdrop-blur-md">
          <div className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Global Status</p>
              </div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Operational</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Rescuers</p>
                <p className="text-lg font-black text-white">{presenceCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Incidents</p>
                <p className="text-lg font-black text-red-500">{reports.length}</p>
              </div>
            </div>
          </div>
          <motion.button 
            onClick={handleSOS}
            whileTap={{ scale: 0.95 }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-red-600/30 transition-all duration-300 flex items-center justify-center gap-4 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <PhoneCall size={24} className="group-hover:animate-bounce relative z-10" />
            <span className="relative z-10">SOS SIGNAL</span>
          </motion.button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden p-5 flex justify-between items-center bg-white/80 backdrop-blur-xl border-b border-zinc-100 z-50 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-950/20">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-tighter uppercase leading-none">SENTINEL</h1>
            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Intelligence Hub</p>
          </div>
        </div>
        <motion.button 
          onClick={handleSOS} 
          whileTap={{ scale: 0.9 }}
          className="bg-red-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase shadow-lg shadow-red-600/20 active:scale-95 transition-transform"
        >
          SOS
        </motion.button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-zinc-50 md:p-8 custom-scrollbar">
        {/* Real-time Ticker */}
        <div className="hidden md:block absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-2xl border-b border-zinc-200/50 px-10 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-12">
            <div className="flex items-center gap-8 overflow-hidden flex-1">
              <div className="flex items-center gap-3 shrink-0 bg-zinc-950 text-white px-4 py-1.5 rounded-full shadow-lg relative z-10">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Intelligence</span>
              </div>
              <div className="flex-1 overflow-hidden relative marquee-mask">
                <div className="flex gap-16 animate-marquee whitespace-nowrap py-1">
                  {news.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-950 font-black uppercase tracking-widest text-[10px] bg-zinc-100 px-2 py-0.5 rounded-md">[{item.source}]</span>
                        <span className="text-[11px] font-bold text-zinc-600">{item.title}</span>
                      </div>
                      <span className="w-1.5 h-1.5 bg-zinc-200 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <Eye size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{presenceCount} Active Rescuers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto h-full pt-20 md:pt-16">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-0 space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                  <div>
                    <h2 className="text-5xl md:text-8xl font-display font-black italic leading-[0.85] tracking-tighter">Command<br/>Center</h2>
                    <p className="text-zinc-500 mt-4 font-medium max-w-sm">Real-time geospatial intelligence and risk assessment for your current coordinates.</p>
                  </div>
                  <div className="flex flex-col md:flex-row items-end gap-6">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLocateMe}
                      className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl border border-zinc-200 shadow-sm text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                    >
                      <Navigation size={16} className="text-emerald-500" />
                      Locate Me
                    </motion.button>
                    <div className="flex gap-4">
                      <div className="bg-white px-8 py-5 rounded-[2rem] border border-zinc-100 shadow-sm">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Shelters Nearby</p>
                        <p className="text-3xl font-black text-zinc-900 tracking-tighter">{shelters.length}</p>
                      </div>
                      <div className="bg-white px-8 py-5 rounded-[2rem] border border-zinc-100 shadow-sm">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Reports</p>
                        <p className="text-3xl font-black text-red-600 tracking-tighter">{reports.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                    <div className="h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-200 ring-8 ring-white">
                      <MapView 
                        id="dashboard-map"
                        center={location} 
                        shelters={shelters} 
                        reports={reports}
                      />
                    </div>
                    
                    <div className="bg-white rounded-[3rem] border border-zinc-100 p-10 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                            <Newspaper size={20} />
                          </div>
                          <h3 className="font-black text-zinc-900 uppercase text-xs tracking-[0.2em]">Official Intelligence</h3>
                        </div>
                        <button className="text-xs font-black text-zinc-900 hover:underline underline-offset-4 transition-all uppercase tracking-widest">View Archives</button>
                      </div>
                      <div className="space-y-6">
                        {news.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex gap-6 p-6 rounded-3xl hover:bg-zinc-50 transition-all duration-300 border border-transparent hover:border-zinc-100 group">
                            <div className={cn(
                              "w-1.5 h-16 rounded-full shrink-0 transition-transform group-hover:scale-y-110",
                              item.type === 'alert' ? "bg-red-500" : item.type === 'success' ? "bg-emerald-500" : "bg-blue-500"
                            )} />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">{item.source}</span>
                                <span className="text-[10px] text-zinc-300">•</span>
                                <div className="flex items-center gap-1 text-zinc-400">
                                  <Clock size={10} />
                                  <span className="text-[10px] font-bold">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                              <h4 className="font-black text-zinc-900 text-lg leading-tight mb-2 group-hover:text-zinc-700 transition-colors">{item.title}</h4>
                              <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{item.content}</p>
                            </div>
                            <ChevronRight className="text-zinc-300 group-hover:text-zinc-900 transition-colors" size={20} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="bg-orange-50 border border-orange-100 p-8 rounded-[3rem] shadow-sm max-h-[500px] overflow-y-auto custom-scrollbar relative">
                      <div className="flex items-center gap-3 mb-6 sticky top-0 bg-orange-50/80 backdrop-blur-md py-2 z-10">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                          <AlertCircle size={18} />
                        </div>
                        <h3 className="font-black text-orange-900 uppercase text-xs tracking-[0.2em]">Risk Analysis</h3>
                      </div>
                      <div className="text-sm text-orange-900/80 leading-relaxed markdown-body">
                        {riskAlert ? <Markdown>{riskAlert}</Markdown> : "Analyzing local weather and geological data..."}
                      </div>
                    </div>
                    
                    <div className="bg-zinc-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400">
                          <Radio size={20} />
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em]">Emergency Kit</h3>
                      </div>
                      <div className="space-y-4">
                        {["Water (3L/day)", "Non-perishables", "First Aid Kit", "Flashlight", "Batteries"].map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                              <CheckCircle2 size={12} />
                            </div>
                            {item}
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setActiveTab('prepare')}
                        className="mt-10 w-full py-4 bg-white text-zinc-950 hover:bg-zinc-100 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-white/5 active:scale-95"
                      >
                        Full Checklist
                      </button>
                    </div>

                    <div className="bg-white border border-zinc-100 p-8 rounded-[3rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400">
                          <Phone size={20} />
                        </div>
                        <h3 className="font-black text-zinc-900 uppercase text-xs tracking-[0.2em]">Hotlines</h3>
                      </div>
                      <div className="space-y-4">
                        {contacts.slice(0, 3).map((contact) => (
                          <a 
                            key={contact.id} 
                            href={`tel:${contact.number}`}
                            className="flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-50 transition-all border border-transparent hover:border-zinc-100 group"
                          >
                            <div>
                              <p className="text-sm font-black text-zinc-900">{contact.name}</p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{contact.category}</p>
                            </div>
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                              <Phone size={16} />
                            </div>
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
                className="p-6 md:p-0 space-y-16"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                  <div className="flex-1">
                    <h2 className="text-5xl md:text-8xl font-display font-black italic mb-6 leading-[0.85] tracking-tighter">Disaster<br/>Awareness</h2>
                    <p className="text-zinc-500 max-w-md font-medium leading-relaxed">Understanding the risks is the first step to safety. Learn about different disaster types and how they impact your environment.</p>
                  </div>
                  
                  {riskAlert && (
                    <div className="w-full md:max-w-2xl bg-orange-50 border border-orange-100 p-10 rounded-[3rem] shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl" />
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                          <AlertCircle size={20} />
                        </div>
                        <h3 className="font-black text-orange-900 uppercase text-xs tracking-[0.2em]">Live Risk Alert</h3>
                      </div>
                      <div className="text-sm text-orange-900/80 leading-relaxed markdown-body relative z-10">
                        <Markdown>{riskAlert}</Markdown>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
                    <div key={i} className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-700 group">
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img 
                          src={disaster.img} 
                          alt={disaster.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="p-10">
                        <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">{disaster.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3">{disaster.desc}</p>
                        <button className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-900 hover:gap-4 transition-all">
                          Safety Protocol <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'emergency' && (
              <motion.div 
                key="emergency"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-0 space-y-12"
              >
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                  <div>
                    <h2 className="text-5xl md:text-8xl font-display font-black italic leading-[0.85] tracking-tighter">Emergency<br/>Response</h2>
                    <p className="text-zinc-500 mt-4 font-medium max-w-md">Immediate actions and reporting tools for active disaster scenarios.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleSOS}
                      className="bg-red-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-95 flex items-center gap-3"
                    >
                      <PhoneCall size={24} />
                      ACTIVATE SOS
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white rounded-[3rem] border border-zinc-100 p-10 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                        <AlertTriangle size={24} />
                      </div>
                      <h3 className="font-black text-zinc-900 uppercase text-xs tracking-[0.2em]">Report Damage</h3>
                    </div>
                    <ReportDamage location={location} onReportSuccess={fetchReports} />
                  </div>
                  
                  <div className="space-y-10">
                    <div className="bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700" />
                      <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-red-400">
                          <Phone size={24} />
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em]">Emergency Directory</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4 relative z-10">
                        {contacts.map((contact) => (
                          <a 
                            key={contact.id} 
                            href={`tel:${contact.number}`}
                            className="flex items-center justify-between p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                          >
                            <div>
                              <p className="text-lg font-black text-white">{contact.name}</p>
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">{contact.category}</p>
                            </div>
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                              <PhoneCall size={20} />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-zinc-100 p-10 rounded-[3rem] shadow-sm">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                          <Users size={24} />
                        </div>
                        <h3 className="font-black text-zinc-900 uppercase text-xs tracking-[0.2em]">Missing Persons</h3>
                      </div>
                      <p className="text-zinc-500 text-sm mb-8 leading-relaxed">If you are looking for someone or want to report a missing person, please use our centralized registry.</p>
                      <button className="w-full py-5 bg-zinc-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95">
                        Open Registry
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'map' && (
              <motion.div 
                key="map"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="h-full w-full p-4 md:p-0 flex flex-col gap-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                  <div>
                    <h2 className="text-5xl md:text-8xl font-display font-black italic leading-[0.85] tracking-tighter">Live Map<br/>Intelligence</h2>
                    <p className="text-zinc-500 mt-4 font-medium max-w-md">Real-time geospatial data showing active hazards, safe zones, and reported incidents.</p>
                  </div>
                  <div className="flex gap-4">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLocateMe}
                      className="flex items-center gap-2 bg-white px-8 py-4 rounded-[2rem] border border-zinc-200 shadow-lg text-xs font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors"
                    >
                      <Navigation size={18} className="text-emerald-500" />
                      Recenter Map
                    </motion.button>
                    <div className="bg-white border border-zinc-100 px-6 py-4 rounded-2xl shadow-sm flex items-center gap-4">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">Live Tracking Active</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-zinc-200 relative group">
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
                  <div className="absolute top-8 right-8 z-[1000] flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-200 shadow-xl space-y-3">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Legend</p>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-900">Safe Shelter</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-900">Active Incident</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500/30 border border-blue-500 rounded-full" />
                        <span className="text-[10px] font-bold text-zinc-900">Flood Zone</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'recover' && (
              <motion.div 
                key="recover"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-0 space-y-16"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                  <div className="flex-1">
                    <h2 className="text-5xl md:text-8xl font-display font-black italic mb-6 leading-[0.85] tracking-tighter">Recovery &<br/>Resources</h2>
                    <p className="text-zinc-500 max-w-md font-medium leading-relaxed">Support systems, resource allocation, and community recovery tools for post-disaster scenarios.</p>
                  </div>
                  
                  <div className="w-full md:max-w-md bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                        <Heart size={24} />
                      </div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em]">Donation Center</h3>
                    </div>
                    <p className="text-sm text-zinc-400 mb-8 leading-relaxed relative z-10">Contribute to relief efforts or request essential supplies for your community.</p>
                    <div className="flex gap-4 relative z-10">
                      <button className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">Donate</button>
                      <button className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95">Request</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Live Incident Feed</h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        UPDATING LIVE
                      </div>
                    </div>
                    <div className="space-y-6 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                      {reports.length === 0 ? (
                        <div className="bg-white p-16 rounded-[3rem] border border-zinc-100 text-center text-zinc-400 shadow-sm italic">
                          No incidents reported in your area.
                        </div>
                      ) : (
                        reports.map((report) => (
                          <div key={report.id} className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm flex gap-8 hover:shadow-xl transition-all group">
                            {report.image_url && (
                              <div className="w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                <img src={report.image_url} className="w-full h-full object-cover" alt="Report" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-4">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full",
                                  report.severity === 'Critical' ? "bg-red-50 text-red-600 border border-red-100" : "bg-orange-50 text-orange-600 border border-orange-100"
                                )}>
                                  {report.severity}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono font-bold">{new Date(report.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <h4 className="text-xl font-black text-zinc-900 mb-2 tracking-tight">{report.type}</h4>
                              <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{report.description}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">AI Recovery Assistant</h3>
                    <div className="h-[700px] rounded-[3rem] overflow-hidden border border-zinc-100 shadow-2xl bg-white">
                      <Chatbot />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'info' && (
              <motion.div 
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 md:p-0 space-y-16"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                  <div className="flex-1">
                    <h2 className="text-5xl md:text-8xl font-display font-black italic mb-6 leading-[0.85] tracking-tighter">System<br/>Intelligence</h2>
                    <p className="text-zinc-500 max-w-md font-medium leading-relaxed">Technical architecture, security protocols, and real-time operational status of the platform.</p>
                  </div>
                  
                  <div className="w-full md:max-w-md bg-emerald-600 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                        <ShieldAlert size={24} />
                      </div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em]">Privacy & Security</h3>
                    </div>
                    <p className="text-sm opacity-90 leading-relaxed relative z-10">End-to-end encryption for SOS signals. Data retention limited to active disaster periods to ensure user safety and compliance with global privacy standards.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="bg-zinc-900 text-white p-10 rounded-[3rem] shadow-2xl">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400">
                        <Bot size={24} />
                      </div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em]">AI Stack</h3>
                    </div>
                    <ul className="space-y-6">
                      {[
                        { id: "01", label: "Gemini 3 Flash", desc: "Reasoning & Real-time Chat" },
                        { id: "02", label: "Gemini Vision", desc: "Automated Damage Assessment" },
                        { id: "03", label: "Search Grounding", desc: "Live Risk & Weather Analysis" },
                        { id: "04", label: "OSM Engine", desc: "Geospatial Intelligence" }
                      ].map((item) => (
                        <li key={item.id} className="flex gap-4 group">
                          <span className="text-emerald-500 font-mono font-black text-xs mt-1 group-hover:scale-110 transition-transform">{item.id}</span>
                          <div>
                            <p className="font-black text-sm">{item.label}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white border border-zinc-100 p-10 rounded-[3rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-blue-500">
                        <Radio size={24} />
                      </div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-900">Network Status</h3>
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: "Database", status: "Operational", color: "text-emerald-500" },
                        { label: "Vite Dev Server", status: "Active", color: "text-emerald-500" },
                        { label: "Gemini API", status: "Connected", color: "text-emerald-500" },
                        { label: "GPS Provider", status: "Locked", color: "text-emerald-500" },
                        { label: "Socket.io", status: "Live", color: "text-emerald-500" }
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center group">
                          <span className="text-sm font-bold text-zinc-500 group-hover:text-zinc-900 transition-colors">{item.label}</span>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", item.color.replace('text', 'bg'))} />
                            <span className={cn("text-[10px] font-black uppercase tracking-widest", item.color)}>{item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-100 p-10 rounded-[3rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                        <Database size={24} />
                      </div>
                      <h3 className="font-black text-xs uppercase tracking-[0.2em] text-zinc-900">Data Architecture</h3>
                    </div>
                    <div className="space-y-6">
                      <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Storage Engine</p>
                        <p className="text-sm font-black text-zinc-900">Better-SQLite3</p>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Real-time Layer</p>
                        <p className="text-sm font-black text-zinc-900">Socket.io (WebSockets)</p>
                      </div>
                      <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Frontend Stack</p>
                        <p className="text-sm font-black text-zinc-900">React 18 + Vite + Tailwind</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-zinc-100 px-4 py-3 flex justify-around items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "flex flex-col items-center gap-1.5 py-2 px-3 rounded-2xl transition-all duration-300 relative",
              activeTab === tab.id ? "text-zinc-950" : "text-zinc-400"
            )}
          >
            {activeTab === tab.id && (
              <motion.div 
                layoutId="mobile-active-bg"
                className="absolute inset-0 bg-zinc-100 rounded-2xl -z-10"
              />
            )}
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </motion.button>
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
            <motion.div 
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigator.clipboard.writeText(`${location[0].toFixed(6)}, ${location[1].toFixed(6)}`);
                alert("Coordinates copied to clipboard");
              }}
              className="mt-12 p-6 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
            >
              <p className="text-lg font-mono tracking-widest">{location[0].toFixed(6)}, {location[1].toFixed(6)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">Tap to copy coordinates</p>
            </motion.div>
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

