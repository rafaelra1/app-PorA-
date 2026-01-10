import { Task } from '../types';

/**
 * Serviço para exportar checklist para PDF ou impressão
 */

interface ExportOptions {
    includeCompleted?: boolean;
    groupByCategory?: boolean;
    showDueDates?: boolean;
}

/**
 * Gera HTML formatado para impressão do checklist
 */
export const generatePrintableHTML = (
    tasks: Task[],
    tripTitle: string,
    tripDates: { start: string; end: string },
    options: ExportOptions = {}
): string => {
    const {
        includeCompleted = true,
        groupByCategory = true,
        showDueDates = true,
    } = options;

    const filteredTasks = includeCompleted
        ? tasks
        : tasks.filter(t => !t.is_completed);

    const groupedTasks = groupByCategory
        ? groupTasksByCategory(filteredTasks)
        : { 'Todas': filteredTasks };

    const completedCount = tasks.filter(t => t.is_completed).length;
    const completionPercentage = tasks.length > 0
        ? Math.round((completedCount / tasks.length) * 100)
        : 0;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Checklist - ${tripTitle}</title>
      <style>
        @media print {
          @page {
            margin: 2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .header .dates {
          font-size: 14px;
          opacity: 0.9;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }

        .stat-card .number {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
        }

        .stat-card .label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .category-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }

        .category-header {
          background: #f3f4f6;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-header h2 {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }

        .category-header .count {
          background: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
          color: #6b7280;
        }

        .task-list {
          list-style: none;
        }

        .task-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .task-item:last-child {
          border-bottom: none;
        }

        .checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .checkbox.completed {
          background: #10b981;
          border-color: #10b981;
          position: relative;
        }

        .checkbox.completed::after {
          content: '✓';
          color: white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 14px;
          font-weight: bold;
        }

        .task-content {
          flex: 1;
        }

        .task-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .task-title.completed {
          text-decoration: line-through;
          color: #9ca3af;
        }

        .task-description {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .task-meta {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #9ca3af;
        }

        .task-meta .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .badge.urgent {
          background: #fef3c7;
          color: #92400e;
        }

        .badge.due-date {
          background: #e0e7ff;
          color: #3730a3;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }

        .progress-fill {
          height: 100%;
          background: #10b981;
          transition: width 0.3s ease;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${tripTitle}</h1>
        <div class="dates">${tripDates.start} - ${tripDates.end}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${completionPercentage}%"></div>
        </div>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="number">${tasks.length}</div>
          <div class="label">Total de Tarefas</div>
        </div>
        <div class="stat-card">
          <div class="number">${completedCount}</div>
          <div class="label">Concluídas</div>
        </div>
        <div class="stat-card">
          <div class="number">${completionPercentage}%</div>
          <div class="label">Progresso</div>
        </div>
      </div>

      ${Object.entries(groupedTasks).map(([category, categoryTasks]) => `
        <div class="category-section">
          <div class="category-header">
            <h2>${getCategoryName(category)}</h2>
            <span class="count">${categoryTasks.length}</span>
          </div>
          <ul class="task-list">
            ${categoryTasks.map(task => `
              <li class="task-item">
                <div class="checkbox ${task.is_completed ? 'completed' : ''}"></div>
                <div class="task-content">
                  <div class="task-title ${task.is_completed ? 'completed' : ''}">
                    ${task.title}
                  </div>
                  ${task.description ? `
                    <div class="task-description">${task.description}</div>
                  ` : ''}
                  <div class="task-meta">
                    ${task.is_urgent ? '<span class="badge urgent">Urgente</span>' : ''}
                    ${showDueDates && task.due_date ? `
                      <span class="badge due-date">
                        Prazo: ${formatDate(task.due_date)}
                      </span>
                    ` : ''}
                  </div>
                </div>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}

      <div class="footer">
        <p>Gerado em ${new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}</p>
        <p>PorAí - Seu Companheiro de Viagem</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Agrupa tarefas por categoria
 */
function groupTasksByCategory(tasks: Task[]): Record<string, Task[]> {
    const grouped: Record<string, Task[]> = {};

    tasks.forEach(task => {
        const category = task.category || 'other';
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(task);
    });

    return grouped;
}

/**
 * Retorna nome amigável da categoria
 */
function getCategoryName(category: string): string {
    const names: Record<string, string> = {
        documentation: 'Documentação',
        health: 'Saúde',
        financial: 'Financeiro',
        packing: 'Bagagem',
        other: 'Outros',
    };

    return names[category] || category;
}

/**
 * Formata data para exibição
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
    });
}

/**
 * Abre janela de impressão com o checklist
 */
export const printChecklist = (
    tasks: Task[],
    tripTitle: string,
    tripDates: { start: string; end: string },
    options?: ExportOptions
): void => {
    const html = generatePrintableHTML(tasks, tripTitle, tripDates, options);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Aguarda o carregamento antes de imprimir
        printWindow.onload = () => {
            printWindow.print();
        };
    }
};

/**
 * Exporta checklist como PDF (usando impressão do navegador)
 */
export const exportToPDF = (
    tasks: Task[],
    tripTitle: string,
    tripDates: { start: string; end: string },
    options?: ExportOptions
): void => {
    // Usa a mesma função de impressão, mas o usuário pode escolher "Salvar como PDF"
    printChecklist(tasks, tripTitle, tripDates, options);
};
