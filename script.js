document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const htmlCode = document.getElementById('html-code');
    const cssCode = document.getElementById('css-code');
    const jsCode = document.getElementById('js-code');
    const previewFrame = document.getElementById('preview-frame');
    const toggleEditModeBtn = document.getElementById('toggle-edit-mode');
    const editModeIndicator = document.getElementById('edit-mode-indicator');
    const previewContainer = document.getElementById('preview-container');
    const currentElementInfo = document.getElementById('current-element');
    const elementControls = document.getElementById('element-controls');
    const saveProjectBtn = document.getElementById('save-project');
    const loadProjectBtn = document.getElementById('load-project');
    const exportHtmlBtn = document.getElementById('export-html');
    const resetAllBtn = document.getElementById('reset-all');
    const copyElementCodeBtn = document.getElementById('copy-element-code');
    const resetElementBtn = document.getElementById('reset-element');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const codeEditors = document.querySelectorAll('.code-editor');
    const elementWidth = document.getElementById('element-width');
    const elementHeight = document.getElementById('element-height');
    const elementMargin = document.getElementById('element-margin');
    const elementPadding = document.getElementById('element-padding');
    const elementPosition = document.getElementById('element-position');
    const showCodeBtn = document.getElementById('show-code');
    const copyCodeBtn = document.getElementById('copy-code');
    const codeModal = document.getElementById('code-modal');
    const closeModal = document.querySelector('.close-modal');
    const fullCodeTextarea = document.getElementById('full-code');
    const copyFromModalBtn = document.getElementById('copy-from-modal');

    // Variáveis de estado
    let editModeActive = false;
    let currentSelectedElement = null;
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    // Inicialização
    initDefaultCode();
    updatePreview();
    setupEventListeners();

    function initDefaultCode() {
        htmlCode.value = `<div class="container">
    <h1>Bem-vindo ao Editor de Sites</h1>
    <p>Comece a editar seu código HTML, CSS e JavaScript nos campos abaixo.</p>
    <button id="demo-btn">Clique em mim</button>
</div>`;
        cssCode.value = `body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}
.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
h1 {
    color: #333;
}
#demo-btn {
    padding: 10px 20px;
    background-color: #4a6fa5;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
#demo-btn:hover {
    background-color: #166088;
}`;
        jsCode.value = `document.getElementById('demo-btn').addEventListener('click', function() {
    alert('Botão clicado!');
});`;
    }

    function setupEventListeners() {
        htmlCode.addEventListener('input', updatePreview);
        cssCode.addEventListener('input', updatePreview);
        jsCode.addEventListener('input', updatePreview);

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        toggleEditModeBtn.addEventListener('click', toggleEditMode);
        elementWidth.addEventListener('change', updateElementStyle);
        elementHeight.addEventListener('change', updateElementStyle);
        elementMargin.addEventListener('change', updateElementStyle);
        elementPadding.addEventListener('change', updateElementStyle);
        elementPosition.addEventListener('change', updateElementStyle);
        saveProjectBtn.addEventListener('click', saveProject);
        loadProjectBtn.addEventListener('click', loadProject);
        exportHtmlBtn.addEventListener('click', exportAsHtml);
        resetAllBtn.addEventListener('click', resetAll);
        copyElementCodeBtn.addEventListener('click', copyElementCode);
        resetElementBtn.addEventListener('click', resetElementStyles);
        if (showCodeBtn) showCodeBtn.addEventListener('click', showFullCode);
        if (copyCodeBtn) copyCodeBtn.addEventListener('click', copyFullCode);
        if (closeModal) closeModal.addEventListener('click', () => codeModal.style.display = 'none');
        if (copyFromModalBtn) copyFromModalBtn.addEventListener('click', copyFromModal);
    }

    function updatePreview() {
        const html = htmlCode.value;
        const css = cssCode.value;
        const js = jsCode.value;
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        previewDoc.open();
        previewDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview</title>
                <style>
                    /* Variáveis CSS do root para o iframe - CRÍTICO PARA OS ESTILOS */
                    :root {
                        --primary-color: #4a6fa5;
                        --edit-mode-color: #ffb347;
                        --background: #f5f5f5;
                    }
                    /* CSS do usuário */
                    ${css}
                    /* Estilos do resize-handle para o iframe */
                    .resize-handle {
                        position: absolute;
                        right: -7px;
                        bottom: -7px;
                        width: 14px;
                        height: 14px;
                        background: var(--edit-mode-color);
                        border-radius: 50%;
                        cursor: se-resize;
                        z-index: 9999; /* Garante que a bolinha esteja acima de tudo */
                        border: 2px solid white;
                        box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    }
                    /* Estilo para o outline dos elementos selecionados no modo de edição */
                    .edit-mode-outline {
                        outline: 2px dashed var(--primary-color) !important; /* !important para garantir que sobreponha outros outlines */
                    }
                </style>
            </head>
            <body>
                ${html}
                <script>${js}<\/script>
            </body>
            </html>
        `);
        previewDoc.close();
        if (editModeActive) {
            // Atraso para garantir que o conteúdo do iframe esteja totalmente carregado
            // e os elementos possam ser selecionados/manipulados corretamente.
            setTimeout(() => {
                setupEditMode(previewDoc);
                // Re-adiciona o handle ao elemento selecionado se o preview foi atualizado
                if (currentSelectedElement) {
                    addResizeHandle(currentSelectedElement);
                }
            }, 100);
        }
    }

    function switchTab(tabName) {
        tabButtons.forEach(button => button.classList.remove('active'));
        codeEditors.forEach(editor => editor.classList.remove('active'));
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-code`).classList.add('active');
    }

    function toggleEditMode() {
        editModeActive = !editModeActive;
        if (editModeActive) {
            toggleEditModeBtn.textContent = 'Desativar Modo Edição';
            editModeIndicator.textContent = 'Modo Edição: ATIVO';
            editModeIndicator.style.backgroundColor = 'var(--edit-mode-color)';
            previewContainer.classList.add('edit-mode-active');
            const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
            setupEditMode(previewDoc);
        } else {
            toggleEditModeBtn.textContent = 'Ativar Modo Edição';
            editModeIndicator.textContent = 'Modo Edição: DESATIVADO';
            editModeIndicator.style.backgroundColor = 'var(--primary-color)';
            previewContainer.classList.remove('edit-mode-active');
            if (currentSelectedElement) {
                currentSelectedElement.classList.remove('edit-mode-outline'); // Remove a classe de outline
                // Remove o handle de redimensionamento ao desativar o modo de edição
                const oldHandle = currentSelectedElement.querySelector('.resize-handle');
                if (oldHandle) oldHandle.remove();
                currentSelectedElement = null;
            }
            elementControls.style.display = 'none';
            currentElementInfo.textContent = 'Nenhum elemento selecionado';
        }
    }

    function setupEditMode(doc) {
        const allElements = doc.querySelectorAll('*');
        // Remove listeners antigos para evitar duplicação em atualizações do preview
        allElements.forEach(el => {
            el.removeEventListener('click', handleElementClick);
        });
        allElements.forEach(el => {
            el.addEventListener('click', handleElementClick);
        });
        // Listener no documento do iframe para deselecionar ao clicar fora dos elementos
        doc.removeEventListener('click', handleDocClick); // Remove para evitar duplicação
        doc.addEventListener('click', handleDocClick);
    }

    function handleDocClick(e) {
        if (currentSelectedElement && (e.target === this.documentElement || e.target === this.body || !currentSelectedElement.contains(e.target))) {
            currentSelectedElement.classList.remove('edit-mode-outline');
            const oldHandle = currentSelectedElement.querySelector('.resize-handle');
            if (oldHandle) oldHandle.remove();
            currentSelectedElement = null;
            elementControls.style.display = 'none';
            currentElementInfo.textContent = 'Nenhum elemento selecionado';
        }
    }


    function handleElementClick(e) {
        e.stopPropagation(); // Impede que o clique no elemento se propague para o documento
        if (currentSelectedElement) {
            currentSelectedElement.classList.remove('edit-mode-outline'); // Remove classe do elemento anterior
            // Remove o handle do elemento anterior
            const oldHandle = currentSelectedElement.querySelector('.resize-handle');
            if (oldHandle) oldHandle.remove();
        }
        currentSelectedElement = e.target;
        currentSelectedElement.classList.add('edit-mode-outline'); // Adiciona classe para outline
        currentElementInfo.textContent = `Elemento: ${currentSelectedElement.tagName.toLowerCase()}`;
        elementControls.style.display = 'block';
        updateElementControls();
        setupDragAndDrop(currentSelectedElement); // Configura o arrastar
        addResizeHandle(currentSelectedElement); // Adiciona a bolinha de redimensionamento
    }

    function updateElementControls() {
        if (!currentSelectedElement) return;
        // Use o valor inline se existir, senão o computado
        elementWidth.value = currentSelectedElement.style.width || window.getComputedStyle(currentSelectedElement).width;
        elementHeight.value = currentSelectedElement.style.height || window.getComputedStyle(currentSelectedElement).height;
        elementMargin.value = currentSelectedElement.style.margin || window.getComputedStyle(currentSelectedElement).margin;
        elementPadding.value = currentSelectedElement.style.padding || window.getComputedStyle(currentSelectedElement).padding;
        elementPosition.value = currentSelectedElement.style.position || window.getComputedStyle(currentSelectedElement).position;
        syncHtmlEditorWithPreview();
    }

    function syncHtmlEditorWithPreview() {
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        // Clona o body para remover o handle de redimensionamento antes de copiar o HTML
        const tempBody = previewDoc.body.cloneNode(true);
        tempBody.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
        tempBody.querySelectorAll('.edit-mode-outline').forEach(el => el.classList.remove('edit-mode-outline')); // Remove outlines
        htmlCode.value = tempBody.innerHTML;
    }

    function updateElementStyle() {
        if (!currentSelectedElement) return;
        // Só altera o elemento selecionado
        currentSelectedElement.style.width = elementWidth.value;
        currentSelectedElement.style.height = elementHeight.value;
        currentSelectedElement.style.margin = elementMargin.value;
        currentSelectedElement.style.padding = elementPadding.value;
        currentSelectedElement.style.position = elementPosition.value;
        syncHtmlEditorWithPreview();
    }

    function setupDragAndDrop(element) {
        // Remove listeners antigos para evitar duplicação
        element.removeEventListener('mousedown', startDrag);
        
        element.style.position = element.style.position || 'relative'; // Garante que o elemento seja posicionável
        element.style.cursor = 'move'; // Altera o cursor para indicar que é arrastável
        element.addEventListener('mousedown', startDrag);

        function startDrag(e) {
            if (e.button !== 0) return; // Apenas botão esquerdo do mouse
            // Se o clique foi na alça de redimensionamento, não inicia o arrasto
            if (e.target.classList.contains('resize-handle')) {
                return;
            }

            e.preventDefault(); // Impede o comportamento padrão de arrastar (ex: imagens)
            e.stopPropagation(); // Impede a propagação para o documento
            isDragging = true;
            const doc = element.ownerDocument; // Obtém o documento do iframe
            startX = e.clientX;
            startY = e.clientY;
            // Garante que left e top sejam números para cálculo
            startLeft = parseFloat(styleToNumber(element.style.left)) || 0;
            startTop = parseFloat(styleToNumber(element.style.top)) || 0;
            
            doc.addEventListener('mousemove', drag);
            doc.addEventListener('mouseup', stopDrag);
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            element.style.left = `${startLeft + dx}px`;
            element.style.top = `${startTop + dy}px`;
        }

        function stopDrag() {
            isDragging = false;
            const doc = element.ownerDocument;
            doc.removeEventListener('mousemove', drag);
            doc.removeEventListener('mouseup', stopDrag);
            updateElementControls(); // Atualiza os controles e o HTML após arrastar
            syncHtmlEditorWithPreview();
        }
    }

    function addResizeHandle(element) {
        // Remove qualquer handle existente para evitar duplicatas
        const oldHandle = element.querySelector('.resize-handle');
        if (oldHandle) oldHandle.remove();

        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        
        // Adiciona a handle ao elemento
        element.appendChild(handle);

        // Adiciona o listener de mousedown diretamente na handle
        handle.addEventListener('mousedown', startResize);

        function startResize(e) {
            e.preventDefault(); // Impede o comportamento padrão de arrastar imagens, etc.
            e.stopPropagation(); // Impede que o clique na alça propague para o elemento pai (para o drag)
            isResizing = true;
            const startRect = element.getBoundingClientRect(); // Pega o tamanho e posição atuais
            startX = e.clientX;
            startY = e.clientY;
            startWidth = startRect.width;
            startHeight = startRect.height;
            const doc = element.ownerDocument; // Pega o documento do iframe
            doc.addEventListener('mousemove', resize);
            doc.addEventListener('mouseup', stopResize); // Nova função para parar o redimensionamento
        }

        function resize(e) {
            if (!isResizing) return;
            e.preventDefault();
            const dx = e.clientX - startX; // Mudança em X
            const dy = e.clientY - startY; // Mudança em Y
            // Aplica as novas dimensões
            element.style.width = `${Math.max(20, startWidth + dx)}px`; // Garante largura mínima
            element.style.height = `${Math.max(20, startHeight + dy)}px`; // Garante altura mínima
        }

        function stopResize() {
            isResizing = false;
            const doc = element.ownerDocument;
            doc.removeEventListener('mousemove', resize);
            doc.removeEventListener('mouseup', stopResize);
            updateElementControls(); // Atualiza os controles e o HTML após redimensionar
            syncHtmlEditorWithPreview();
        }
    }

    function styleToNumber(value) {
        return value.replace('px', '');
    }

    function saveProject() {
        const project = {
            html: htmlCode.value,
            css: cssCode.value,
            js: jsCode.value,
            timestamp: new Date().toISOString()
        };
        const projectJson = JSON.stringify(project);
        const blob = new Blob([projectJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `site-editor-project-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Projeto salvo com sucesso!');
    }

    function loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const project = JSON.parse(event.target.result);
                    htmlCode.value = project.html;
                    cssCode.value = project.css;
                    jsCode.value = project.js;
                    updatePreview();
                    alert('Projeto carregado com sucesso!');
                } catch (error) {
                    alert('Erro ao carregar o projeto: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function exportAsHtml() {
        const html = htmlCode.value;
        const css = cssCode.value;
        const js = jsCode.value;
        const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Exportado</title>
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>${js}<\/script>
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `site-exportado-${new Date().getTime()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        alert('HTML exportado com sucesso!');
    }

    function resetAll() {
        if (confirm('Tem certeza que deseja limpar todo o código? Isso não pode ser desfeito.')) {
            htmlCode.value = '';
            cssCode.value = '';
            jsCode.value = '';
            updatePreview();
            alert('Editor limpo!');
        }
    }

    function copyElementCode() {
        if (!currentSelectedElement) {
            alert('Nenhum elemento selecionado para copiar.');
            return;
        }
        const outerHTML = currentSelectedElement.outerHTML;
        navigator.clipboard.writeText(outerHTML)
            .then(() => alert('Código do elemento copiado para a área de transferência!'))
            .catch(err => alert('Erro ao copiar código: ' + err));
    }

    function resetElementStyles() {
        if (!currentSelectedElement) {
            alert('Nenhum elemento selecionado para redefinir estilos.');
            return;
        }
        if (!confirm('Redefinir todos os estilos deste elemento?')) return;
        currentSelectedElement.style.cssText = ''; // Limpa todos os estilos inline
        updateElementControls(); // Atualiza os controles
        syncHtmlEditorWithPreview(); // Sincroniza com o HTML
        alert('Estilos do elemento redefinidos!');
    }

    function showFullCode() {
        const html = htmlCode.value;
        const css = cssCode.value;
        const js = jsCode.value;
        const fullCode = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Criado no Editor</title>
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>${js}<\/script>
</body>
</html>`;
        fullCodeTextarea.value = fullCode;
        codeModal.style.display = 'block';
    }

    function copyFullCode() {
        const html = htmlCode.value;
        const css = cssCode.value;
        const js = jsCode.value;
        const fullCode = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Criado no Editor</title>
    <style>${css}</style>
</head>
<body>
    ${html}
    <script>${js}<\/script>
</body>
</html>`;
        navigator.clipboard.writeText(fullCode)
            .then(() => alert('Código completo copiado para a área de transferência!'))
            .catch(err => alert('Erro ao copiar código: ' + err));
    }

    function copyFromModal() {
        fullCodeTextarea.select();
        document.execCommand('copy');
        alert('Código copiado para a área de transferência!');
    }
});