document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('avatar');
    const avatarInput = document.getElementById('avatar-input');
    const username = document.getElementById('username');
    const gridContainer = document.getElementById('grid-container');

    // Modal Elements
    const blockEditorModal = document.getElementById('block-editor-modal');
    const closeBlockEditorBtn = blockEditorModal.querySelector('.close-button');
    const saveBlockBtn = document.getElementById('save-block-btn');
    const blockLinkInput = document.getElementById('block-link');
    const blockImageInput = document.getElementById('block-image-input');
    const blockTextInput = document.getElementById('block-text');

    // Toolbar Buttons
    const addLinkBtn = document.getElementById('add-link-btn');
    const addImageBtn = document.getElementById('add-image-btn');
    const addTextBtn = document.getElementById('add-text-btn');

    // Load User Profile
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

    // Save Avatar
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

    // Save Username
    username.addEventListener('input', () => {
        localStorage.setItem('username', username.textContent);
    });

    // Toolbar Button Handlers
    addLinkBtn.addEventListener('click', () => {
        openBlockEditorModal();
    });

    addImageBtn.addEventListener('click', () => {
        createImageBlock();
    });

    addTextBtn.addEventListener('click', () => {
        createTextBlock();
    });

    // Modal Functions
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

    // Create Link Block
    function createLinkBlock(link, imageFile, text) {
        const block = document.createElement('div');
        block.classList.add('block');
        block.setAttribute('data-id', Date.now());
        block.setAttribute('data-type', 'link');

        let content = '';

        function finalizeBlock() {
            block.innerHTML = `<div class="block-content">${content}</div>`;
            gridContainer.appendChild(block);

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
                // Wrap content with a link
                content = `<a href="${link}" target="_blank">${content}</a>`;
            }
            finalizeBlock();
        }
    }

    // Create Image Block
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

    // Create Text Block
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

    // Drag Move Listener
    function dragMoveListener(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        saveBlocks();
    }

    // Create Resize Panel
    function createResizePanel(block) {
        const panel = document.createElement('div');
        panel.classList.add('resize-panel');

        const increaseButton = document.createElement('button');
        increaseButton.innerHTML = '<i class="material-icons">zoom_out_map</i>';
        increaseButton.addEventListener('click', () => {
            scaleBlock(block, 'increase');
        });

        const decreaseButton = document.createElement('button');
        decreaseButton.innerHTML = '<i class="material-icons">zoom_in_map</i>';
        decreaseButton.addEventListener('click', () => {
            scaleBlock(block, 'decrease');
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="material-icons">delete</i>';
        deleteButton.addEventListener('click', () => {
            block.remove();
            saveBlocks();
        });

        panel.appendChild(increaseButton);
        panel.appendChild(decreaseButton);
        panel.appendChild(deleteButton);
        block.appendChild(panel);
    }

    // Scale Block
    function scaleBlock(block, action) {
        let width = parseInt(block.style.width) || 150;
        let height = parseInt(block.style.height) || 150;
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

    // Reset Button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        document.querySelectorAll('.block').forEach(block => {
            block.remove();
        });

        avatar.src = 'images/default-avatar.png';
        localStorage.removeItem('avatar');
        username.textContent = 'Your Username';
        localStorage.removeItem('username');
        localStorage.removeItem('blocks');
    });

    // Load Blocks from Local Storage
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
                block.style.transform = `translate(${data.x}px, ${data.y}px)`;
                block.setAttribute('data-x', data.x);
                block.setAttribute('data-y', data.y);

                block.innerHTML = `<div class="block-content">${data.content}</div>`;
                gridContainer.appendChild(block);

                createResizePanel(block);
                makeBlockInteractive(block);

                // Re-add event listeners for image blocks
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
                                blockContent.innerHTML = `<img src="${event.target.result}" alt="Image">`;
                                saveBlocks();
                            };
                            reader.readAsDataURL(file);
                        }
                    });

                    block.appendChild(fileInput);
                }

                // Re-add event listeners for text blocks
                else if (data.type === 'text') {
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

    // Save Blocks to Local Storage
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

    // Make Blocks Interactive
    function makeBlockInteractive(block) {
        const blockType = block.getAttribute('data-type');

        let isDragging = false;
        let holdTimer;

        // Start drag after holding for 300ms
        block.addEventListener('mousedown', (e) => {
            holdTimer = setTimeout(() => {
                isDragging = true;
                interact(block).draggable({
                    inertia: true,
                    onmove: dragMoveListener,
                    onend: () => {
                        isDragging = false;
                        interact(block).draggable(false);
                        saveBlocks();
                    },
                    restrict: {
                        restriction: "parent",
                        endOnly: true
                    }
                });
                interact(block).draggable(true);
            }, 300);
        });

        block.addEventListener('mouseup', () => {
            clearTimeout(holdTimer);
            if (!isDragging && blockType === 'link') {
                // Simulate click on link
                const linkElement = block.querySelector('a');
                if (linkElement) {
                    window.open(linkElement.href, '_blank');
                }
            }
        });

        block.addEventListener('mouseleave', () => {
            clearTimeout(holdTimer);
        });
    }

    // Initialize
    loadBlocks();

    // Add resize panel and interactivity to existing blocks
    document.querySelectorAll('.block').forEach(block => {
        createResizePanel(block);
        makeBlockInteractive(block);
    });
});
