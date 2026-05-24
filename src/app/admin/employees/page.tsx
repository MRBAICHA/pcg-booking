'use client';

import { useEffect, useState } from 'react';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  position?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  employeeId: '',
  name: '',
  nameEn: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  role: 'EMPLOYEE',
  password: 'PCG@2024',
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadEmployees(); }, []);

  async function loadEmployees(q?: string) {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : '';
    const res = await fetch(`/api/admin/employees${params}`);
    if (res.ok) {
      const { employees } = await res.json();
      setEmployees(employees);
    }
    setLoading(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await loadEmployees(search);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const res = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'เกิดข้อผิดพลาด');
    } else {
      setSuccess(`เพิ่มพนักงาน ${data.employee.name} สำเร็จ`);
      setShowForm(false);
      setForm(emptyForm);
      await loadEmployees();
    }
    setSaving(false);
  }

  async function toggleActive(emp: Employee) {
    await fetch(`/api/admin/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !emp.isActive }),
    });
    await loadEmployees();
  }

  const roleLabel = (role: string) =>
    ({ EMPLOYEE: 'พนักงาน', ADMIN: 'ผู้ดูแล', GA_ADMIN: 'GA Admin' }[role] || role);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">จัดการพนักงาน</h1>
          <p className="text-gray-500 text-sm mt-1">ทั้งหมด {employees.length} คน</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-pcg-blue text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          เพิ่มพนักงาน
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
          ✓ {success}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">เพิ่มพนักงานใหม่</h2>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'employeeId', label: 'รหัสพนักงาน *', placeholder: 'EMP001' },
              { key: 'name', label: 'ชื่อ-นามสกุล (ไทย) *', placeholder: 'สมชาย ใจดี' },
              { key: 'nameEn', label: 'ชื่อภาษาอังกฤษ', placeholder: 'Somchai Jaidee' },
              { key: 'email', label: 'อีเมล', placeholder: 'email@pcg.co.th' },
              { key: 'phone', label: 'โทรศัพท์', placeholder: '08x-xxx-xxxx' },
              { key: 'department', label: 'แผนก', placeholder: 'Finance' },
              { key: 'position', label: 'ตำแหน่ง', placeholder: 'Accountant' },
              { key: 'password', label: 'รหัสผ่านเริ่มต้น *', placeholder: 'PCG@2024' },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{f.label}</label>
                <input
                  type={f.key === 'password' ? 'text' : 'text'}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  required={f.label.includes('*')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">บทบาท</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMPLOYEE">พนักงาน</option>
                <option value="GA_ADMIN">GA Admin</option>
                <option value="ADMIN">ผู้ดูแลระบบ</option>
              </select>
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">ยกเลิก</button>
              <button type="submit" disabled={saving} className="bg-pcg-blue text-white px-5 py-2 rounded-xl font-medium text-sm disabled:opacity-60">
                {saving ? 'กำลังบันทึก...' : 'เพิ่มพนักงาน'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาด้วยรหัส ชื่อ หรือแผนก..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button type="submit" className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200">
          ค้นหา
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); loadEmployees(); }} className="text-gray-400 px-3 py-2.5 rounded-xl text-sm">
            ล้าง
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-pcg-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">พนักงาน</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">แผนก/ตำแหน่ง</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">บทบาท</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((emp) => (
                  <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${!emp.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-700">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.employeeId} • {emp.email || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">{emp.department || '-'}</p>
                      <p className="text-xs text-gray-400">{emp.position || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        emp.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        emp.role === 'GA_ADMIN' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {roleLabel(emp.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {emp.isActive ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(emp)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          emp.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {emp.isActive ? 'ระงับ' : 'เปิดใช้'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
