import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import useAuthStore from '../../stores/useAuthStore'
import { supabase } from '../../lib/supabase'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import styles from './AdminUsuarios.module.css'

// ============================================================
// AdminUsuarios — Lista de usuarios registrados
// Solo accesible para esAdmin === true
// ============================================================

const fmt = (f) =>
  f ? new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

const AdminUsuarios = () => {
  const { session, esAdmin } = useAuthStore()
  const [usuarios, setUsuarios]  = useState([])
  const [cargando, setCargando]  = useState(false)
  const [busqueda, setBusqueda]  = useState('')

  useEffect(() => {
    if (!session || !esAdmin) {
      setCargando(false)
      return
    }
    cargar()
  }, [session, esAdmin])

  const cargar = async () => {
    setCargando(true)
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre, email, telefono, es_admin, created_at, avatar_url')
        .order('created_at', { ascending: false })
      if (error) console.error('Error cargando usuarios:', error.message)
      setUsuarios(data || [])
    } catch (e) {
      console.error('Excepción cargando usuarios:', e)
    } finally {
      setCargando(false)
    }
  }

  if (!session || !esAdmin) return null

  const filtrados = usuarios.filter(u =>
    (u.nombre  || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.email   || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <h1 className={styles.titulo}><GroupOutlinedIcon sx={{ fontSize: '1.4rem', verticalAlign: 'middle', mr: 0.5 }} /> Usuarios registrados</h1>
        <span className={styles.badge}>{usuarios.length} total</span>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <button className={styles.refreshBtn} onClick={cargar}>↺ Actualizar</button>
      </div>

      {cargando ? (
        <div className={styles.loading}><CircularProgress size={28} sx={{ color: '#f59e0b' }} /></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Registro</th>
                <th>Rol</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => (
                <tr key={u.id}>
                  <td>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt={u.nombre} className={styles.avatar} referrerPolicy="no-referrer" />
                      : <div className={styles.avatarInitial}>{(u.nombre || u.email || '?').charAt(0).toUpperCase()}</div>
                    }
                  </td>
                  <td className={styles.nombre}>{u.nombre || '—'}</td>
                  <td className={styles.email}>{u.email}</td>
                  <td>{u.telefono || '—'}</td>
                  <td className={styles.fecha}>{fmt(u.created_at)}</td>
                  <td>
                    {u.es_admin
                      ? <span className={styles.rolAdmin}>Admin</span>
                      : <span className={styles.rolUser}>Usuario</span>
                    }
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No se encontraron usuarios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminUsuarios
