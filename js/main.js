// Добавляем глобальную переменную для отслеживания позиций
let nextPosition = 1;

document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('avatar');
    const avatarInput = document.getElementById('avatar-input');
    const username = document.getElementById('username');
    const gridContainer = document.getElementById('grid-container');

    // Модальные элементы
    const blockEditorModal = document.getElementById('block-editor-modal');
    const closeBlockEditorBtn = blockEditorModal.querySelector('.close-button');
    const saveBlockBtn = document.getElementById('save-block-btn');
    const blockLinkInput = document.getElementById('block-link');
    const blockImageInput = document.getElementById('block-image-input');
    const blockTextInput = document.getElementById('block-text');

    // Кнопки панели инструментов
    const addLinkBtn = document.getElementById('add-link-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const addTextBtn = document.getElementById('add-text-btn');
    const toggleEditBtn = document.getElementById('toggle-edit-btn');
    const resetBtn = document.getElementById('reset-btn');

    let isEditMode = false; // Флаг режима редактирования

    // Загрузка профиля пользователя
    function loadUserProfile() {
        const savedAvatar = localStorage.getItem('avatar');
        const savedUsername = localStorage.getItem('username');

        if (savedAvatar) {
            avatar.src = savedAvatar;
        }

        if (savedUsername) {
            username.textContent = savedUsername;
        }
    }

    loadUserProfile();

    // Сохранение аватара
    avatar.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatar.src = event.target.result;
                localStorage.setItem('avatar', event.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Пожалуйста, выберите корректный файл изображения.');
        }
    });

    // Сохранение никнейма
    username.addEventListener('input', () => {
        localStorage.setItem('username', username.textContent);
    });

    // Обработчики кнопок панели инструментов
    addLinkBtn.addEventListener('click', () => {
        openBlockEditorModal();
    });

    addImageBtn.addEventListener('click', () => {
        createImageBlock();
    });

    addTextBtn.addEventListener('click', () => {
        createTextBlock();
    });

    toggleEditBtn.addEventListener('click', () => {
        isEditMode = !isEditMode;
        toggleEditBtn.classList.toggle('active', isEditMode);
        document.body.classList.toggle('edit-mode', isEditMode);
        toggleEditMode();
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
            resetAll();
        }
    });

    // Функции модального окна
    function openBlockEditorModal() {
        blockLinkInput.value = '';
        blockImageInput.value = '';
        blockImageInput.files = null;
        blockTextInput.value = '';

        blockEditorModal.classList.remove('hidden');
    }

    function closeBlockEditorModal() {
        blockEditorModal.classList.add('hidden');
    }

    closeBlockEditorBtn.addEventListener('click', closeBlockEditorModal);

    saveBlockBtn.addEventListener('click', () => {
        const link = blockLinkInput.value.trim();
        const imageFile = blockImageInput.files ? blockImageInput.files[0] : null;
        const text = blockTextInput.value.trim();

        if (!link && !imageFile && !text) {
            alert('Пожалуйста, заполните хотя бы одно поле.');
            return;
        }

        createLinkBlock(link, imageFile, text);
        closeBlockEditorModal();
    });

    // Создание блока-ссылки
    function createLinkBlock(link, imageFile, text) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.setAttribute('data-id', Date.now());
        block.setAttribute('data-type', 'link');

        let content = '';

        function finalizeBlock() {
            const contentDiv = document.createElement('div');
            contentDiv.classList.add('block-content');
            contentDiv.innerHTML = content;

            block.appendChild(contentDiv);
            createResizePanel(block);

            // Создаем grid-cell и добавляем в grid-container
            const gridCell = document.createElement('div');
            gridCell.classList.add('grid-cell');
            gridCell.setAttribute('data-position', nextPosition);
            gridCell.classList.add('occupied'); // Помечаем ячейку как занятую
            block.setAttribute('data-position', nextPosition);
            nextPosition++;

            gridCell.appendChild(block);
            gridContainer.appendChild(gridCell);

            makeBlockInteractive(block);
            saveBlocks();
        }

        function finalizeContent() {
            if (text && !imageFile) {
                content += `<div>${escapeHtml(text)}</div>`;
            }
            if (link) {
                // Оборачиваем контент в ссылку
                content = `<a href="${link}" target="_blank" rel="noopener noreferrer">${content}</a>`;
            }
            finalizeBlock();
        }

        if (imageFile && imageFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                content += `<img src="${event.target.result}" alt="Image">`;
                if (text) {
                    content += `<div>${escapeHtml(text)}</div>`;
                }
                finalizeContent();
            };
            reader.readAsDataURL(imageFile);
        } else {
            if (imageFile) {
                alert('Пожалуйста, выберите корректный файл изображения.');
            }
            finalizeContent();
        }
    }

    // Создание блока-картинки
    function createImageBlock() {
        const block = document.createElement('div');
        block.classList.add('block');
        block.setAttribute('data-id', Date.now());
        block.setAttribute('data-type', 'image');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('block-content');
        contentDiv.textContent = 'Нажмите, чтобы добавить изображение';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        contentDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isEditMode) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    contentDiv.innerHTML = `<img src="${event.target.result}" alt="Image">`;
                    saveBlocks();
                };
                reader.readAsDataURL(file);
            } else {
                alert('Пожалуйста, выберите корректный файл изображения.');
            }
        });

        block.appendChild(contentDiv);
        block.appendChild(fileInput);
        createResizePanel(block);

        // Создаем grid-cell и добавляем в grid-container
        const gridCell = document.createElement('div');
        gridCell.classList.add('grid-cell');
        gridCell.setAttribute('data-position', nextPosition);
        gridCell.classList.add('occupied'); // Помечаем ячейку как занятую
        block.setAttribute('data-position', nextPosition);
        nextPosition++;

        gridCell.appendChild(block);
        gridContainer.appendChild(gridCell);

        makeBlockInteractive(block);
        saveBlocks();
    }

    // Создание текстового блока
    function createTextBlock() {
        const block = document.createElement('div');
        block.classList.add('block');
        block.setAttribute('data-id', Date.now());
        block.setAttribute('data-type', 'text');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('block-content');
        contentDiv.textContent = 'Двойной клик для редактирования текста';
        contentDiv.contentEditable = false;

        block.appendChild(contentDiv);
        createResizePanel(block);

        block.addEventListener('dblclick', () => {
            if (isEditMode) {
                contentDiv.contentEditable = true;
                contentDiv.focus();
            }
        });

        contentDiv.addEventListener('blur', () => {
            contentDiv.contentEditable = false;
            saveBlocks();
        });

        // Создаем grid-cell и добавляем в grid-container
        const gridCell = document.createElement('div');
        gridCell.classList.add('grid-cell');
        gridCell.setAttribute('data-position', nextPosition);
        gridCell.classList.add('occupied'); // Помечаем ячейку как занятую
        block.setAttribute('data-position', nextPosition);
        nextPosition++;

        gridCell.appendChild(block);
        gridContainer.appendChild(gridCell);

        makeBlockInteractive(block);
        saveBlocks();
    }

    // Панель управления блоком
    function createResizePanel(block) {
        const panel = document.createElement('div');
        panel.classList.add('resize-panel');

        const increaseButton = document.createElement('button');
        increaseButton.innerHTML = '<i class="material-icons">zoom_out_map</i>';
        increaseButton.title = 'Увеличить размер';
        increaseButton.addEventListener('click', () => {
            if (isEditMode) {
                scaleBlock(block, 'increase');
            }
        });

        const decreaseButton = document.createElement('button');
        decreaseButton.innerHTML = '<i class="material-icons">zoom_in_map</i>';
        decreaseButton.title = 'Уменьшить размер';
        decreaseButton.addEventListener('click', () => {
            if (isEditMode) {
                scaleBlock(block, 'decrease');
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="material-icons">delete</i>';
        deleteButton.title = 'Удалить блок';
        deleteButton.addEventListener('click', () => {
            if (isEditMode) {
                if (confirm('Вы уверены, что хотите удалить этот блок?')) {
                    removeBlock(block);
                }
            }
        });

        panel.appendChild(increaseButton);
        panel.appendChild(decreaseButton);
        panel.appendChild(deleteButton);
        block.appendChild(panel);
    }

    // Удаление блока
    function removeBlock(block) {
        const parentCell = block.parentElement;
        block.remove(); // Удаляем блок из ячейки
        parentCell.classList.remove('occupied'); // Помечаем ячейку как свободную
        saveBlocks();
    }

    // Масштабирование блока
    function scaleBlock(block, action) {
        let width = parseInt(block.style.width) || block.parentElement.offsetWidth;
        let height = parseInt(block.style.height) || block.parentElement.offsetHeight;
        const scaleFactor = 20;

        if (action === 'increase') {
            width += scaleFactor;
            height += scaleFactor;
        } else if (action === 'decrease') {
            width = Math.max(100, width - scaleFactor);
            height = Math.max(100, height - scaleFactor);
        }

        block.style.width = `${width}px`;
        block.style.height = `${height}px`;

        saveBlocks();
    }

    // Переключение режима редактирования
    function toggleEditMode() {
        const blocks = document.querySelectorAll('.block');
        blocks.forEach(block => {
            if (isEditMode) {
                // Активируем перетаскивание
                interact(block).draggable(true);
                block.style.cursor = 'move';

                // Отключаем ссылки
                const links = block.querySelectorAll('a');
                links.forEach(link => {
                    link.style.pointerEvents = 'none';
                });
            } else {
                // Деактивируем перетаскивание
                interact(block).draggable(false);
                block.style.cursor = 'pointer';

                // Включаем ссылки
                const links = block.querySelectorAll('a');
                links.forEach(link => {
                    link.style.pointerEvents = 'auto';
                });
            }
        });
    }

    // Функция для перетаскивания блоков
    function makeBlockInteractive(block) {
        interact(block).draggable({
            enabled: isEditMode,
            inertia: true,
            autoScroll: true,
            onstart: function(event) {
                if (isEditMode) {
                    block.classList.add('dragging');
                    block.style.zIndex = 1000;

                    // Получаем размеры блока
                    const rect = block.getBoundingClientRect();
                    const containerRect = gridContainer.getBoundingClientRect();

                    // Устанавливаем явную ширину и высоту, чтобы сохранить размеры
                    block.style.width = `${rect.width}px`;
                    block.style.height = `${rect.height}px`;

                    // Устанавливаем абсолютное позиционирование
                    block.style.position = 'absolute';
                    block.style.left = `${rect.left - containerRect.left}px`;
                    block.style.top = `${rect.top - containerRect.top}px`;

                    // Переносим блок в gridContainer
                    gridContainer.appendChild(block);

                    // Сохраняем начальные координаты
                    block.setAttribute('data-left', rect.left - containerRect.left);
                    block.setAttribute('data-top', rect.top - containerRect.top);
                }
            },
            onmove: dragMoveListener,
            onend: function(event) {
                if (isEditMode) {
                    block.classList.remove('dragging');
                    block.style.zIndex = '';

                    snapBlockToGrid(block);
                    saveBlocks();
                }
            }
        });
    }

    function dragMoveListener(event) {
        if (!isEditMode) return;

        const target = event.target;

        // Вычисляем новые координаты
        const dx = (parseFloat(target.getAttribute('data-left')) || 0) + event.dx;
        const dy = (parseFloat(target.getAttribute('data-top')) || 0) + event.dy;

        // Устанавливаем новые координаты
        target.style.left = dx + 'px';
        target.style.top = dy + 'px';

        // Сохраняем новые координаты
        target.setAttribute('data-left', dx);
        target.setAttribute('data-top', dy);
    }

    // Функция привязки блока к сетке и обмена местами
    function snapBlockToGrid(block) {
        const cells = document.querySelectorAll('.grid-cell');
        let closestCell = null;
        let minDistance = Infinity;

        const blockRect = block.getBoundingClientRect();

        cells.forEach(cell => {
            const cellRect = cell.getBoundingClientRect();
            const dx = blockRect.left - cellRect.left;
            const dy = blockRect.top - cellRect.top;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestCell = cell;
            }
        });

        if (closestCell) {
            const targetPosition = closestCell.getAttribute('data-position');

            // Получаем блок в целевой ячейке, если он есть
            const targetBlock = closestCell.querySelector('.block');
            const sourceCell = block.previousCell || block.parentElement;
            const sourcePosition = block.getAttribute('data-position');

            if (targetBlock) {
                // Обмениваем блоки местами
                sourceCell.appendChild(targetBlock);
                targetBlock.setAttribute('data-position', sourcePosition);
            } else {
                // Помечаем исходную ячейку как свободную
                if (sourceCell) {
                    sourceCell.classList.remove('occupied');
                }
            }

            // Перемещаем блок в целевую ячейку
            closestCell.appendChild(block);
            block.setAttribute('data-position', targetPosition);
            closestCell.classList.add('occupied');

            // Сохраняем текущую ячейку как предыдущую для корректной работы
            block.previousCell = closestCell;

            // Сбрасываем стили позиционирования и размеров
            block.style.position = '';
            block.style.left = '';
            block.style.top = '';
            block.style.width = '';
            block.style.height = '';
            block.removeAttribute('data-left');
            block.removeAttribute('data-top');
        } else {
            // Возвращаем блок на место
            block.style.left = '';
            block.style.top = '';
            block.style.width = '';
            block.style.height = '';
            block.removeAttribute('data-left');
            block.removeAttribute('data-top');
        }
    }

    // Сброс всех данных
    function resetAll() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.remove();
        });

        avatar.src = 'images/default-avatar.png';
        localStorage.removeItem('avatar');
        username.textContent = 'Ваш никнейм';
        localStorage.removeItem('username');
        localStorage.removeItem('blocks');
        nextPosition = 1;
    }

    // Загрузка блоков из localStorage
    function loadBlocks() {
        const savedBlocks = localStorage.getItem('blocks');
        if (savedBlocks) {
            const blockData = JSON.parse(savedBlocks);
            blockData.forEach(data => {
                const block = document.createElement('div');
                block.classList.add('block');
                block.setAttribute('data-id', data.id);
                block.setAttribute('data-type', data.type);
                block.style.width = data.width;
                block.style.height = data.height;
                block.setAttribute('data-position', data.position);

                const contentDiv = document.createElement('div');
                contentDiv.classList.add('block-content');
                contentDiv.innerHTML = data.content;

                block.appendChild(contentDiv);
                createResizePanel(block);
                makeBlockInteractive(block);

                // Восстанавливаем события для блоков
                if (data.type === 'image') {
                    contentDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (isEditMode) {
                            const fileInput = block.querySelector('input[type="file"]');
                            if (fileInput) {
                                fileInput.click();
                            }
                        }
                    });
                } else if (data.type === 'text') {
                    contentDiv.contentEditable = false;

                    block.addEventListener('dblclick', () => {
                        if (isEditMode) {
                            contentDiv.contentEditable = true;
                            contentDiv.focus();
                        }
                    });

                    contentDiv.addEventListener('blur', () => {
                        contentDiv.contentEditable = false;
                        saveBlocks();
                    });
                }

                // Создаем grid-cell и добавляем в grid-container
                const gridCell = document.createElement('div');
                gridCell.classList.add('grid-cell');
                gridCell.setAttribute('data-position', data.position);
                gridCell.classList.add('occupied'); // Помечаем ячейку как занятую
                gridCell.appendChild(block);
                gridContainer.appendChild(gridCell);

                // Обновляем nextPosition
                if (parseInt(data.position) >= nextPosition) {
                    nextPosition = parseInt(data.position) + 1;
                }
            });
        }
    }

    // Сохранение блоков в localStorage
    function saveBlocks() {
        const blocks = document.querySelectorAll('.block');
        const blockData = [];

        blocks.forEach(block => {
            blockData.push({
                id: block.getAttribute('data-id'),
                type: block.getAttribute('data-type'),
                content: block.querySelector('.block-content').innerHTML,
                width: block.style.width,
                height: block.style.height,
                position: block.getAttribute('data-position')
            });
        });

        localStorage.setItem('blocks', JSON.stringify(blockData));
    }

    // Функция для экранирования HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Инициализация
    loadBlocks();
    toggleEditMode(); // Устанавливаем начальное состояние режима редактирования
});
