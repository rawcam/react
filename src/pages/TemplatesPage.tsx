export const TemplatesPage = () => {
  return (
    <div className="dashboard-wrapper">
      <h2>КОНСТРУКТОР ДОКУМЕНТОВ</h2>
      <div className="template-builder">
        <div className="setting">
          <label>Выберите шаблон:</label>
          <select id="templateSelect">
            <option value="explanatory">Пояснительная записка</option>
            <option value="specification">Спецификация оборудования</option>
            <option value="act">Акт выполненных работ</option>
          </select>
        </div>
        <div className="setting">
          <label>Подсистемы проекта:</label>
          <div id="subsystemsChecklist">
            <label><input type="checkbox" value="display" /> Подсистема отображения</label>
            <label><input type="checkbox" value="vks" /> ВКС</label>
            <label><input type="checkbox" value="sound" /> Звукоусиление</label>
            <label><input type="checkbox" value="led" /> LED-экраны</label>
            <label><input type="checkbox" value="control" /> Управление</label>
          </div>
        </div>
        <div className="setting">
          <label>Привязать к проекту:</label>
          <select id="templateProjectSelect">
            <option value="">— Не привязывать —</option>
          </select>
        </div>
        <button className="btn-primary" id="generateDocBtn">
          <i className="fas fa-file-alt"></i> Сформировать документ
        </button>
        <div id="documentPreview" className="document-preview" style={{ marginTop: 24, display: 'none' }}>
          <h3>Предварительный просмотр</h3>
          <div id="previewContent"></div>
          <button className="btn-secondary" id="copyDocBtn">
            <i className="fas fa-copy"></i> Копировать текст
          </button>
        </div>
      </div>
    </div>
  )
}
