'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getAllUsers, toggleUserActive, changeUserRole } from '@/services/user-service'
import { User } from '@/types/user'
import { toast } from 'sonner'
import Link from 'next/link'
import { ArrowLeft, Shield, ShieldOff, UserCheck, UserX } from 'lucide-react'

export default function AdminUsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/auth/login')
      else if (user.role !== 'admin') router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'admin') {
      getAllUsers()
        .then(res => setUsers(res.users))
        .catch(() => toast.error('Error al cargar usuarios'))
        .finally(() => setFetching(false))
    }
  }, [user])

  const handleToggle = async (userId: string) => {
    try {
      const updated = await toggleUserActive(userId)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: updated.isActive } : u))
      toast.success('Estado actualizado')
    } catch { toast.error('Error') }
  }

  const handleRole = async (userId: string, role: string) => {
    try {
      const updated = await changeUserRole(userId, role)
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: updated.role } : u))
      toast.success('Rol actualizado')
    } catch { toast.error('Error') }
  }

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al admin
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Usuarios ({users.length})</h1>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Usuario</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Rol</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-left px-5 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                          {u.firstName?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(u._id)}
                          title={u.isActive !== false ? 'Desactivar' : 'Activar'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          {u.isActive !== false ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                          title={u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-purple-600 transition-colors"
                        >
                          {u.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
