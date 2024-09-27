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
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatar.src = event.target.result;
                localStorage.setItem('avatar', event.target.result);
            };
            reader.readAsDataURL(file);
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
        resetAll();
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
            block.innerHTML = `<div class="block-content">${content}</div>`;
            placeBlockInFirstAvailableCell(block);

            createResizePanel(block);
            makeBlockInteractive(block);
            saveBlocks();
        }

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                content += `<img src="${event.target.result}" alt="Image">`;
                if (text) {
                    content += `<div>${text}</div>`;
                }
                finalizeContent();
            };
            reader.readAsDataURL(imageFile);
        } else {
            finalizeContent();
        }

        function finalizeContent() {
            if (text) {
                content += `<div>${text}</div>`;
            }
            if (link) {
                // Оборачиваем контент в ссылку
                content = `<a href="${link}" target="_blank">${content}</a>`;
            }
            finalizeBlock();
        }
    }

    // Создание блока-картинки
    function createImageBlock() {
        const block = document.createElement('div');
        block.classList.add('block');
        block.setAttribute('data-id', Date.now());
        block.setAttribute('data-type', 'image');

        block.innerHTML = `<div class="block-content">Click to add image</div>`;
        placeBlockInFirstAvailableCell(block);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        const blockContent = block.querySelector('.block-content');
        blockContent.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isEditMode) {
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    blockContent.innerHTML = `<img src="${event.target.result}" alt="Image">`;
                    saveBlocks();
                };
                reader.readAsDataURL(file);
            }
        });

        block.appendChild(fileInput);
        createResizePanel(block);
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
        contentDiv.textContent = 'Double-click to edit text';
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

        block.appendChild(contentDiv);
        placeBlockInFirstAvailableCell(block);
        createResizePanel(block);
        makeBlockInteractive(block);
        saveBlocks();
    }

    // Размещение блока в первой доступной ячейке
    function placeBlockInFirstAvailableCell(block) {
        const emptyCell = document.querySelector('.grid-cell:not(.occupied)');
        if (emptyCell) {
            emptyCell.classList.add('occupied');
            emptyCell.appendChild(block);
            block.setAttribute('data-position', emptyCell.getAttribute('data-position'));
        } else {
            alert('Нет свободных ячеек для размещения блока.');
        }
    }

    // Панель управления блоком
    function createResizePanel(block) {
        const panel = document.createElement('div');
        panel.classList.add('resize-panel');

        const increaseButton = document.createElement('button');
        increaseButton.innerHTML = '<i class="material-icons">zoom_out_map</i>';
        increaseButton.addEventListener('click', () => {
            if (isEditMode) {
                scaleBlock(block, 'increase');
            }
        });

        const decreaseButton = document.createElement('button');
        decreaseButton.innerHTML = '<i class="material-icons">zoom_in_map</i>';
        decreaseButton.addEventListener('click', () => {
            if (isEditMode) {
                scaleBlock(block, 'decrease');
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="material-icons">delete</i>';
        deleteButton.addEventListener('click', () => {
            if (isEditMode) {
                removeBlock(block);
            }
        });

        panel.appendChild(increaseButton);
        panel.appendChild(decreaseButton);
        panel.appendChild(deleteButton);
        block.appendChild(panel);
    }

    // Удаление блока
    function removeBlock(block) {
        const position = block.getAttribute('data-position');
        const cell = document.querySelector(`.grid-cell[data-position="${position}"]`);
        if (cell) {
            cell.classList.remove('occupied');
        }
        block.remove();
        saveBlocks();
    }

    // Масштабирование блока
    function scaleBlock(block, action) {
        let width = parseInt(block.style.width) || block.parentElement.offsetWidth;
        let height = parseInt(block.style.height) || block.parentElement.offsetHeight;
        const scaleFactor = 50;

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
            const resizePanel = block.querySelector('.resize-panel');
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
            onstart: function(event) {
                if (isEditMode) {
                    block.classList.add('dragging');
                }
            },
            onmove: dragMoveListener,
            onend: function(event) {
                if (isEditMode) {
                    block.classList.remove('dragging');
                    snapBlockToGrid(block);
                    saveBlocks();
                }
            }
        });
    }

    // Функция перемещения блока
    function dragMoveListener(event) {
        if (!isEditMode) return;

        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }

    // Привязка блока к сетке с обменом местами
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

            // Если ячейка занята, меняем блоки местами
            if (closestCell.classList.contains('occupied')) {
                const targetBlock = closestCell.querySelector('.block');
                const sourceCell = block.parentElement;

                // Обновляем позицию целевого блока
                sourceCell.appendChild(targetBlock);
                targetBlock.setAttribute('data-position', sourceCell.getAttribute('data-position'));

                // Обновляем позицию перемещаемого блока
                closestCell.appendChild(block);
                block.setAttribute('data-position', targetPosition);

                saveBlocks();
            } else {
                // Освобождаем предыдущую ячейку
                const previousCell = block.parentElement;
                previousCell.classList.remove('occupied');

                // Занимаем новую ячейку
                closestCell.appendChild(block);
                closestCell.classList.add('occupied');
                block.setAttribute('data-position', targetPosition);
            }

            // Сбрасываем трансформацию
            block.style.transform = '';
            block.setAttribute('data-x', 0);
            block.setAttribute('data-y', 0);
        } else {
            // Возвращаем блок на место
            block.style.transform = '';
            block.setAttribute('data-x', 0);
            block.setAttribute('data-y', 0);
        }
    }

    // Сброс всех данных
    function resetAll() {
        document.querySelectorAll('.block').forEach(block => {
            removeBlock(block);
        });

        avatar.src = 'images/default-avatar.png';
        localStorage.removeItem('avatar');
        username.textContent = 'Ваш никнейм';
        localStorage.removeItem('username');
        localStorage.removeItem('blocks');
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

                block.innerHTML = `<div class="block-content">${data.content}</div>`;

                const cell = document.querySelector(`.grid-cell[data-position="${data.position}"]`);
                if (cell) {
                    cell.classList.add('occupied');
                    cell.appendChild(block);
                    block.setAttribute('data-position', data.position);
                }

                createResizePanel(block);
                makeBlockInteractive(block);

                // Восстанавливаем события для блоков
                if (data.type === 'image') {
                    const fileInput = block.querySelector('input[type="file"]');
                    const blockContent = block.querySelector('.block-content');
                    blockContent.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (isEditMode) {
                            fileInput.click();
                        }
                    });
                } else if (data.type === 'text') {
                    const contentDiv = block.querySelector('.block-content');
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

    // Инициализация
    loadBlocks();
    toggleEditMode(); // Устанавливаем начальное состояние режима редактирования

    // Добавляем события для существующих блоков
    document.querySelectorAll('.block').forEach(block => {
        createResizePanel(block);
        makeBlockInteractive(block);
    });
});
