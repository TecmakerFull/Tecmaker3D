import { useState } from 'react'
import { Typography, Button } from '@mui/material'
import styles from './Contacto.module.css'

const WHATSAPP_CONTACTO = '5493415866464'

const Contacto = () => {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()

    const texto =
      `*CONSULTA - TecMaker 3D*\n\n` +
      `*Nombre:* ${form.nombre}\n` +
      `*Email:* ${form.email}\n` +
      `*Asunto:* ${form.asunto}\n\n` +
      `*Mensaje:*\n${form.mensaje}`

    const url = `https://wa.me/${WHATSAPP_CONTACTO}?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank')

    setForm({ nombre: '', email: '', asunto: '', mensaje: '' })
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.label}>📬 CONTACTO</span>
        <Typography component="h1" className={styles.title}>Contactanos</Typography>
        <Typography className={styles.subtitle}>¿Tenés alguna consulta? Estamos para ayudarte.</Typography>
      </div>

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Info */}
          <div className={styles.info}>
            <Typography className={styles.infoTitle}>¿Cómo podemos ayudarte?</Typography>
            <div className={styles.infoItems}>
              {[
                { icon: '💬', label: 'WhatsApp — Enrique', val: '+54 9 341 586-6464', link: 'https://wa.me/5493415866464' },
                { icon: '💬', label: 'WhatsApp — Lorena', val: '+54 9 341 606-8267', link: 'https://wa.me/5493416068267' },
                { icon: '📱', label: 'Instagram', val: '@tecmaker.3d', link: 'https://www.instagram.com/tecmaker.3d/' },
                { icon: '📘', label: 'Facebook', val: 'TecMaker 3D', link: 'https://www.facebook.com/profile.php?id=100087129600305' },
                { icon: '⏰', label: 'Horarios', val: 'Lun-Vie 9:00 - 19:00', link: null },
              ].map((item) => (
                <div key={item.label} className={styles.infoItem}>
                  <span className={styles.infoIcon}>{item.icon}</span>
                  <div>
                    <p className={styles.infoLabel}>{item.label}</p>
                    {item.link ? (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.infoVal}>{item.val}</a>
                    ) : (
                      <p className={styles.infoVal}>{item.val}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label2} htmlFor="nombre">Nombre</label>
                <input id="nombre" name="nombre" className={styles.input} placeholder="Tu nombre" value={form.nombre} onChange={handleChange} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label2} htmlFor="email">Email</label>
                <input id="email" name="email" type="email" className={styles.input} placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label2} htmlFor="asunto">Asunto</label>
              <input id="asunto" name="asunto" className={styles.input} placeholder="¿En qué podemos ayudarte?" value={form.asunto} onChange={handleChange} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label2} htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" name="mensaje" className={styles.textarea} placeholder="Escribí tu mensaje aquí..." rows={5} value={form.mensaje} onChange={handleChange} required />
            </div>
            <Button type="submit" className={styles.submitBtn} id="btn-enviar-contacto">
              Enviar por WhatsApp →
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Contacto
