import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store'
import { toggleSidebar } from '../../store/uiSlice'
import './Sidebar.css'

export const Sidebar = () => {
  const dispatch = useDispatch()
  const collapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Показываем сайдбар только на странице расчётов
    const showSidebar = () => {
      const path = window.location.pathname
      setIsVisible(path === '/calculations')
    }
    showSidebar()
    window.addEventListener('popstate', showSidebar)
    return () => window.removeEventListener('popstate', showSidebar)
  }, [])

  if (!isVisible) return null

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2>SPUTNIK STUDIO</h2>
        <div className="header-actions">
          <div className="theme-switch" id="themeSwitch"><i className="fas fa-sun"></i></div>
          <div className="collapse-btn" onClick={() => dispatch(toggleSidebar())}>
            <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
          </div>
        </div>
      </div>

      <div id="sidebarSectionsContainer">
        {/* Здесь позже появятся аккордеоны */}
        <div className="sidebar-placeholder">Секции настроек появятся позже</div>
      </div>

      <div className="sidebar-footer">Sputnik Studio v8.0<br />React Edition</div>
    </div>
  )
}
