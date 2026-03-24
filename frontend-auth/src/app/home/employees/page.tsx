"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "../../../context/auth-context";
import { Button, Card, Badge, Input, ProfileDropdown } from "../../../components/ui";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  Home,
  Sparkles,
  Cpu,
  Brain,
  Zap,
  Clock,
  User,
  Upload,
  Layers,
  Bot,
  ArrowRight,
  MoreVertical,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Shield,
  Activity,
  AlertCircle,
  Edit,
  Eye,
  MoreHorizontal,
  UserPlus,
  Filter
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive" | "on_leave";
  avatar: string;
  joinedAt: string;
  phone: string;
  location: string;
}

const sampleEmployees: Employee[] = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@company.com", role: "Engineering Manager", department: "Engineering", status: "active", avatar: "SC", joinedAt: "2022-03-15", phone: "+1 555-0101", location: "San Francisco, CA" },
  { id: "2", name: "Michael Rodriguez", email: "michael.r@company.com", role: "Senior Developer", department: "Engineering", status: "active", avatar: "MR", joinedAt: "2021-08-20", phone: "+1 555-0102", location: "Austin, TX" },
  { id: "3", name: "Emily Watson", email: "emily.w@company.com", role: "Product Designer", department: "Design", status: "active", avatar: "EW", joinedAt: "2023-01-10", phone: "+1 555-0103", location: "New York, NY" },
  { id: "4", name: "James Kim", email: "james.k@company.com", role: "DevOps Engineer", department: "Infrastructure", status: "on_leave", avatar: "JK", joinedAt: "2022-06-01", phone: "+1 555-0104", location: "Seattle, WA" },
  { id: "5", name: "Lisa Park", email: "lisa.p@company.com", role: "Data Scientist", department: "Data", status: "active", avatar: "LP", joinedAt: "2023-04-15", phone: "+1 555-0105", location: "Boston, MA" },
  { id: "6", name: "David Brown", email: "david.b@company.com", role: "Marketing Lead", department: "Marketing", status: "inactive", avatar: "DB", joinedAt: "2021-01-05", phone: "+1 555-0106", location: "Chicago, IL" },
];

const departments = [...new Set(sampleEmployees.map(e => e.department))];
const roles = [...new Set(sampleEmployees.map(e => e.role))];

export default function EmployeesPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState(sampleEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    onLeave: employees.filter(e => e.status === "on_leave").length,
    inactive: employees.filter(e => e.status === "inactive").length
  };

  const deleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#0066ff]/20 border-t-[#0066ff] rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0b]">
      <Sidebar activeTool="employees" />

      <main className="flex-1 overflow-y-auto">
        <Header user={user} logout={logout} />

        <div className="p-8 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Workforce</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Employee Management</h1>
            <p className="text-white/40">Manage your team members, roles, and permissions.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-xs text-white/40">Total Employees</span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-white/40">Active</span>
              </div>
              <p className="text-2xl font-bold">{stats.active}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs text-white/40">On Leave</span>
              </div>
              <p className="text-2xl font-bold">{stats.onLeave}</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/5">
                  <Shield className="w-4 h-4 text-white/40" />
                </div>
                <span className="text-xs text-white/40">Inactive</span>
              </div>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDepartment(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !selectedDepartment ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                }`}
              >
                All
              </button>
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDepartment === dept ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee List */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {filteredEmployees.map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedEmployee(employee)}
                    className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all group ${
                      selectedEmployee?.id === employee.id
                        ? "bg-indigo-500/5 border-indigo-500/30"
                        : "bg-white/[0.02] border-white/5 hover:border-indigo-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                        {employee.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white">{employee.name}</h3>
                          <StatusBadge status={employee.status} />
                        </div>
                        <p className="text-sm text-white/40">{employee.role}</p>
                        <div className="flex items-center gap-3 text-xs text-white/30 mt-1">
                          <span>{employee.department}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{employee.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-white/30">Joined</p>
                        <p className="text-sm text-white/60">{employee.joinedAt}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 rounded-lg text-white/20 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 rounded-lg text-white/20 hover:text-white hover:bg-white/10 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteEmployee(employee.id); }}
                          className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredEmployees.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40">No employees found</p>
                </div>
              )}
            </div>

            {/* Employee Details */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 p-6">
                {selectedEmployee ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                        {selectedEmployee.avatar}
                      </div>
                      <h3 className="text-xl font-bold text-white">{selectedEmployee.name}</h3>
                      <p className="text-sm text-white/40">{selectedEmployee.role}</p>
                      <StatusBadge status={selectedEmployee.status} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-white/40" />
                        <span className="text-white/60">{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-white/40" />
                        <span className="text-white/60">{selectedEmployee.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-white/40" />
                        <span className="text-white/60">{selectedEmployee.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Briefcase className="w-4 h-4 text-white/40" />
                        <span className="text-white/60">{selectedEmployee.department}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-white/40" />
                        <span className="text-white/60">Joined {selectedEmployee.joinedAt}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                        <Mail className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                    <p className="text-sm text-white/40">Select an employee to view details</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg p-6 mx-4 rounded-3xl bg-[#0a0a0b] border border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-6">Add New Employee</h2>
              <div className="space-y-4">
                <Input label="Full Name" placeholder="Enter full name" />
                <Input label="Email" type="email" placeholder="Enter email address" />
                <Input label="Phone" placeholder="Enter phone number" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1 mb-2">Department</label>
                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50">
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1 mb-2">Role</label>
                    <select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500/50">
                      {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700">Add Employee</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Employee["status"] }) {
  const styles = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    inactive: "bg-white/5 text-white/40 border-white/10",
    on_leave: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const labels = { active: "Active", inactive: "Inactive", on_leave: "On Leave" };

  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[status]}`}>{labels[status]}</span>;
}

function Sidebar({ activeTool }: { activeTool: string }) {
  const router = useRouter();
  
  const navItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/home" },
    { id: "rag", label: "Document RAG", icon: Layers, href: "/home/rag" },
    { id: "agents", label: "Agentic Tools", icon: Bot, href: "/home/agents" },
    { id: "inventory", label: "AI Inventory", icon: Cpu, href: "/home/inventory" },
    { id: "files", label: "File Processing", icon: Upload, href: "/home/files" },
    { id: "api", label: "API Management", icon: Settings, href: "/home/api" },
    { id: "employees", label: "Employees", icon: Users, href: "/home/employees" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 border-r border-white/[0.05] bg-white/[0.02]">
      <div className="p-6 border-b border-white/[0.05]">
        <Link href="/home" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#0066ff] to-[#00d4ff] rounded-xl flex items-center justify-center shadow-lg shadow-[#0066ff]/30">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">ITSP</span>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">AI platform</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTool === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all relative ${
                isActive
                  ? "bg-[#0066ff]/10 text-[#0066ff]"
                  : "text-white/40 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              {isActive && <div className="absolute left-0 w-1 h-8 bg-[#0066ff] rounded-r-full" />}
              {(() => {
                const Icon = item.icon;
                return <Icon size={18} />;
              })()}
              <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function Header({ user, logout }: { user: any; logout: () => void }) {
  return (
    <header className="sticky top-0 z-10 px-6 py-4 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between">
      <div className="text-sm text-white/40">
        <span className="text-white/60">Employee Management</span>
      </div>
      <ProfileDropdown user={user} logout={logout} />
    </header>
  );
}
