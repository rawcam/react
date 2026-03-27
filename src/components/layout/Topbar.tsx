import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { toggleTheme } from '../../store/themeSlice'
import { RootState } from '../../store'
import './Topbar.css'

export const Topbar = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const theme = useSelector((state: RootState) => state.theme.mode)

  const getActiveClass = (path: string) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <div className="topbar">
      <div className="topbar-logo">
        <i className="fas fa-satellite-dish"></i> Sputnik Studio
      </div>
      <div className="topbar-nav">
        <Link to="/dashboard" className={`topbar-btn ${getActiveClass('/dashboard')}`}>
          Главная
        </Link>
        <Link to="/projects" className={`topbar-btn ${getActiveClass('/projects')}`}>
          Проекты
        </Link>
        <Link to="/calculations" className={`topbar-btn ${getActiveClass('/calculations')}`}>
          Расчёты
        </Link>
        <Link to="/templates" className={`topbar-btn ${getActiveClass('/templates')}`}>
          Шаблоны
        </Link>
      </div>
      <div className="topbar-actions">
        <button onClick={() => dispatch(toggleTheme())} title="Тема">
          <i className={`fas fa-${theme === 'dark' ? 'moon' : 'sun'}`}></i>
        </button>
        <button id="topbarSave" title="Сохранить">
          <i className="fas fa-save"></i>
        </button>
        <button id="topbarExport" title="Экспорт">
          <i className="fas fa-file-export"></i>
        </button>
      </div>
    </div>
  )
}
