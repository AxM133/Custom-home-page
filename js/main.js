document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('avatar');
    const avatarInput = document.getElementById('avatar-input');
    const username = document.getElementById('username');
    const gridContainer = document.getElementById('grid-container');

    // Элементы модального окна
    const blockEditorModal = document.getElementById('block-editor-modal');
    const closeBlockEditorBtn = blockEditorModal.querySelector('.close-button');
    const saveBlockBtn = document.getElementById('save-block-btn');
    const blockLinkInput = document.getElementById('block-link');
    const blockImageInput = document.getElementById('block-image-input');
    const blockTextInput = document.getElementById('block-text');

    // Кнопки добавления блоков
    const addLinkBtn = document.getElementById('add-link-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const addTextBtn = document.getElementById('add-text-btn');

    // Загрузка аватара и никнейма из localStorage
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

    loadUserProfile(); // Загружаем аватар и никнейм при старте

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
                localStorage.setItem('avatar', event.target.result); // Сохраняем в localStorage
            };
            reader.readAsDataURL(file);
        }
    });

    // Сохранение никнейма
    username.addEventListener('input', () => {
        localStorage.setItem('username', username.textContent);
    });

    // Обработчики для кнопок добавления блоков
    addLinkBtn.addEventListener('click', () => {
        // Открываем модальное окно для ввода данных
        openBlockEditorModal();
    });

    addImageBtn.addEventListener('click', () => {
        // Создаем новый блок-картинку
        createImageBlock();
    });

    addTextBtn.addEventListener('click', () => {
        // Создаем новый текстовый блок
        createTextBlock();
    });

    // Открытие и закрытие модального окна
    function openBlockEditorModal() {
        // Очищаем поля ввода
        blockLinkInput.value = '';
        blockImageInput.value = '';
        blockImageInput.files = null;
        blockTextInput.value = '';

        // Показываем модальное окно
        blockEditorModal.classList.remove('hidden');
    }

    function closeBlockEditorModal() {
        blockEditorModal.classList.add('hidden');
    }

    // Закрытие модального окна при клике на кнопку закрытия
    closeBlockEditorBtn.addEventListener('click', closeBlockEditorModal);

    // Сохранение данных из модального окна и создание блока
    saveBlockBtn.addEventListener('click', () => {
        const link = blockLinkInput.value;
        const imageFile = blockImageInput.files ? blockImageInput.files[0] : null;
        const text = blockTextInput.value;

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
            if (link) {
                content = `<a href="${link}" target="_blank">${content}</a>`;
            }

            block.innerHTML = `<div class="block-content">${content}</div>`;

            gridContainer.appendChild(block);

            createResizePanel(block);
            makeBlockInteractive(block);
            saveBlocks();
        }

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                content += `<img src="${event.target.result}" alt="Image" style="max-width: 100%; max-height: 100%;">`;
                if (text) {
                    content += `<div>${text}</div>`;
                }
                finalizeBlock();
            };
            reader.readAsDataURL(imageFile);
        } else {
            if (text) {
                content += `<div>${text}</div>`;
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

        gridContainer.appendChild(block);

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        // Добавляем обработчик только на содержимое блока
        const blockContent = block.querySelector('.block-content');
        blockContent.addEventListener('click', (e) => {
            e.stopPropagation(); // Останавливаем всплытие события
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    blockContent.innerHTML = `<img src="${event.target.result}" alt="Image" style="max-width: 100%; max-height: 100%;">`;
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
            contentDiv.contentEditable = true;
            contentDiv.focus();
        });

        contentDiv.addEventListener('blur', () => {
            contentDiv.contentEditable = false;
            saveBlocks();
        });

        block.appendChild(contentDiv);

        gridContainer.appendChild(block);

        createResizePanel(block);
        makeBlockInteractive(block);
        saveBlocks();
    }

    // Функция для перетаскивания блоков
    function dragMoveListener(event) {
        let target = event.target;
        let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        saveBlocks();
    }

    // Добавление панели управления к блоку
    function createResizePanel(block) {
        const panel = document.createElement('div');
        panel.classList.add('resize-panel');

        const increaseButton = document.createElement('button');
        increaseButton.innerHTML = '⛶';
        increaseButton.addEventListener('click', () => {
            scaleBlock(block, 'increase');
            saveBlocks();
        });

        const decreaseButton = document.createElement('button');
        decreaseButton.innerHTML = '⬚';
        decreaseButton.addEventListener('click', () => {
            scaleBlock(block, 'decrease');
            saveBlocks();
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '🗑';
        deleteButton.addEventListener('click', () => {
            block.remove();
            saveBlocks();
        });

        panel.appendChild(increaseButton);
        panel.appendChild(decreaseButton);
        panel.appendChild(deleteButton);
        block.appendChild(panel);
    }

    function scaleBlock(block, action) {
        if (action === 'increase') {
            block.style.width = '300px';
            block.style.height = '300px';
        } else if (action === 'decrease') {
            block.style.width = '150px';
            block.style.height = '150px';
        }
        saveBlocks();
    }

    const resetBtn = document.getElementById('reset-btn');
    // Кнопка сброса всех блоков
    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.block').forEach(block => {
            block.remove();
        });

        // Сброс аватара и никнейма к значениям по умолчанию
        avatar.src = 'images/default-avatar.png';
        localStorage.removeItem('avatar');
        username.textContent = 'Ваш никнейм';
        localStorage.removeItem('username');
        localStorage.removeItem('blocks');
    });

    // Загрузка блоков из localStorage
    function loadBlocks() {
        const savedBlocks = localStorage.getItem('blocks');
        if (savedBlocks) {
            document.querySelectorAll('.block').forEach(block => block.remove());

            const blockData = JSON.parse(savedBlocks);
            blockData.forEach(data => {
                const block = document.createElement('div');
                block.classList.add('block');
                block.setAttribute('data-id', data.id);
                block.setAttribute('data-type', data.type);
                block.style.width = data.width;
                block.style.height = data.height;
                block.style.transform = `translate(${data.x}px, ${data.y}px)`;
                block.setAttribute('data-x', data.x);
                block.setAttribute('data-y', data.y);

                block.innerHTML = `<div class="block-content">${data.content}</div>`;

                gridContainer.appendChild(block);

                createResizePanel(block);
                makeBlockInteractive(block);

                if (data.type === 'image') {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';

                    const blockContent = block.querySelector('.block-content');
                    blockContent.addEventListener('click', (e) => {
                        e.stopPropagation();
                        fileInput.click();
                    });

                    fileInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = function(event) {
                                blockContent.innerHTML = `<img src="${event.target.result}" alt="Image" style="max-width: 100%; max-height: 100%;">`;
                                saveBlocks();
                            };
                            reader.readAsDataURL(file);
                        }
                    });

                    block.appendChild(fileInput);
                } else if (data.type === 'text') {
                    const contentDiv = block.querySelector('.block-content');
                    contentDiv.contentEditable = false;

                    block.addEventListener('dblclick', () => {
                        contentDiv.contentEditable = true;
                        contentDiv.focus();
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
                x: block.getAttribute('data-x'),
                y: block.getAttribute('data-y')
            });
        });
        localStorage.setItem('blocks', JSON.stringify(blockData));
    }

    // Функция для перетаскивания блоков
    function makeBlockInteractive(block) {
        const blockType = block.getAttribute('data-type');

        interact(block).draggable({
            inertia: true,
            onstart: (event) => {
                if (blockType === 'link') {
                    const linkElement = block.querySelector('a');
                    if (linkElement) {
                        linkElement.style.pointerEvents = 'none'; // Отключаем переход по ссылке при начале перетаскивания
                    }
                }
            },
            onmove: dragMoveListener,
            onend: (event) => {
                if (blockType === 'link') {
                    const linkElement = block.querySelector('a');
                    if (linkElement) {
                        linkElement.style.pointerEvents = 'auto'; // Включаем переход по ссылке после завершения перетаскивания
                    }
                }
                saveBlocks();
            },
            restrict: {
                restriction: "parent",
                endOnly: true
            }
        });
    }

    // Загружаем сохраненные блоки при старте страницы
    loadBlocks();

    // Добавляем панель управления и интерактивность к существующим блокам
    document.querySelectorAll('.block').forEach(block => {
        createResizePanel(block);
        makeBlockInteractive(block);
    });
});
