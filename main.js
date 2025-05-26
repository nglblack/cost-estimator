class CategoryManager {
    constructor() {
        this.categories = {};
        this.currentIndustry = null;
        this.currentView = 'list';
        this.expandedCategories = new Set();
        
        // Industry templates embedded in the app
        this.industryTemplates = {
            construction: {
                foundation: ['footings', 'slab', 'crawlspace'],
                framing: ['walls', 'roof', 'flooring', 'trusses'],
                roofing: ['shingles', 'metal', 'tile'],
                finishes: ['drywall', 'paint', 'flooring-finishes', 'trim-work'],
                electrical: ['rough-in-wiring', 'fixtures', 'panel-installation'],
                plumbing: ['rough-in-pipes', 'fixtures', 'water-heater'],
                hvac: ['ductwork', 'furnace', 'ac-unit'],
                insulation: ['walls', 'attic', 'floor']
            },
            manufacturing: {
                'raw-materials': ['steel', 'plastic', 'electronics', 'chemicals'],
                'equipment': ['machinery', 'tools', 'safety-equipment', 'maintenance'],
                'labor': ['assembly', 'quality-control', 'packaging', 'shipping'],
                'overhead': ['utilities', 'rent', 'insurance', 'administrative'],
                'research': ['development', 'testing', 'prototyping', 'patents']
            },
            software: {
                'development': ['frontend', 'backend', 'mobile', 'database'],
                'infrastructure': ['hosting', 'cdn', 'security', 'monitoring'],
                'tools': ['licenses', 'software', 'hardware', 'subscriptions'],
                'personnel': ['developers', 'designers', 'testers', 'managers'],
                'marketing': ['advertising', 'content', 'analytics', 'social-media']
            },
            events: {
                'venue': ['rental', 'setup', 'cleanup', 'security'],
                'catering': ['food', 'beverages', 'service', 'equipment'],
                'entertainment': ['speakers', 'music', 'activities', 'decorations'],
                'marketing': ['invitations', 'advertising', 'social-media', 'photography'],
                'logistics': ['transportation', 'accommodation', 'coordination', 'insurance']
            },
            consulting: {
                'personnel': ['consultants', 'analysts', 'managers', 'specialists'],
                'travel': ['flights', 'hotels', 'meals', 'transportation'],
                'technology': ['software', 'hardware', 'licenses', 'subscriptions'],
                'materials': ['research', 'reports', 'presentations', 'documentation'],
                'overhead': ['office', 'insurance', 'legal', 'administrative']
            }
        };
        
        this.loadFromStorage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        console.log('Category Manager initialized');
    }

    bindEvents() {
        // Industry selection
        document.querySelectorAll('.industry-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const industry = e.currentTarget.dataset.industry;
                this.selectIndustry(industry);
            });
        });

        // Category management
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.addCategory();
            });
        }

        const newCategoryInput = document.getElementById('new-category');
        if (newCategoryInput) {
            newCategoryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addCategory();
                }
            });
        }

        // Category view switching
        const listViewBtn = document.getElementById('list-view-btn');
        const gridViewBtn = document.getElementById('grid-view-btn');
        
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.switchCategoryView('list');
            });
        }

        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.switchCategoryView('grid');
            });
        }

        // Category search
        const searchCategories = document.getElementById('search-categories');
        if (searchCategories) {
            searchCategories.addEventListener('input', (e) => {
                this.filterCategories(e.target.value);
            });
        }
    }

    selectIndustry(industry) {
        this.currentIndustry = industry;
        
        // Update UI to show selection
        document.querySelectorAll('.industry-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-industry="${industry}"]`)?.classList.add('active');

        // Clear existing categories completely
        this.categories = {};

        if (industry === 'custom') {
            this.categories = {
                'general': ['miscellaneous', 'other']
            };
        } else if (this.industryTemplates[industry]) {
            const templateCategories = this.industryTemplates[industry];
            this.categories = {};
            
            Object.keys(templateCategories).forEach(category => {
                this.categories[category] = [...templateCategories[category]];
            });
        }

        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`${this.capitalizeFirst(industry)} categories loaded! Previous categories have been replaced.`);
    }

    saveToStorage() {
        const data = {
            categories: this.categories,
            currentIndustry: this.currentIndustry,
            currentView: this.currentView,
            expandedCategories: Array.from(this.expandedCategories)
        };
        localStorage.setItem('categoryManagerData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('categoryManagerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.categories = data.categories || {};
                this.currentIndustry = data.currentIndustry;
                this.currentView = data.currentView || 'list';
                this.expandedCategories = new Set(data.expandedCategories || []);
            } catch (error) {
                console.warn('Error loading saved data:', error);
                this.categories = {};
            }
        }
    }

    addCategory() {
        const input = document.getElementById('new-category');
        if (!input) return;
        
        const categoryName = input.value.trim().toLowerCase();

        if (!categoryName) {
            this.showErrorMessage('Category name cannot be empty.');
            return;
        }

        if (this.categories.hasOwnProperty(categoryName)) {
            this.showErrorMessage('Category already exists.');
            return;
        }

        this.categories[categoryName] = [];
        input.value = '';
        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`Category "${this.capitalizeFirst(categoryName)}" added successfully!`);
    }

    updateUI() {
        this.renderCategoryList();
        this.updateCategoryStats();
    }

    updateCategoryStats() {
        const totalCategories = Object.keys(this.categories).length;
        const totalSubcategories = Object.values(this.categories).reduce((sum, subs) => sum + subs.length, 0);
        
        const statsElement = document.getElementById('total-categories');
        if (statsElement) {
            statsElement.textContent = `${totalCategories} categories, ${totalSubcategories} subcategories`;
        }
    }

    switchCategoryView(view) {
        this.currentView = view;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        if (view === 'list') {
            document.getElementById('list-view-btn')?.classList.add('active');
            const listView = document.getElementById('category-list-collapsible');
            const gridView = document.getElementById('category-list-grid');
            if (listView) listView.style.display = 'block';
            if (gridView) gridView.style.display = 'none';
        } else {
            document.getElementById('grid-view-btn')?.classList.add('active');
            const listView = document.getElementById('category-list-collapsible');
            const gridView = document.getElementById('category-list-grid');
            if (listView) listView.style.display = 'none';
            if (gridView) gridView.style.display = 'block';
        }
        
        this.saveToStorage();
        this.renderCategoryList();
    }

    filterCategories(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        this.renderCategoryList(term);
    }

    renderCategoryList(searchFilter = '') {
        if (this.currentView === 'list') {
            this.renderCollapsibleCategoryList(searchFilter);
        } else {
            this.renderGridCategoryList(searchFilter);
        }
    }

    renderCollapsibleCategoryList(searchFilter = '') {
        const container = document.getElementById('category-list-collapsible');
        if (!container) return;
        
        if (Object.keys(this.categories).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h4>No categories yet</h4>
                    <p>Add your first category above or select an industry template</p>
                </div>
            `;
            return;
        }

        const filteredCategories = this.getFilteredCategories(searchFilter);

        if (filteredCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h4>No categories match your search</h4>
                    <p>Try adjusting your search terms</p>
                </div>
            `;
            return;
        }

        let html = '';
        filteredCategories.forEach(mainCategory => {
            const subcategories = this.categories[mainCategory];
            const isExpanded = this.expandedCategories.has(mainCategory);
            const subcategoryCount = subcategories.length;

            html += `
                <div class="category-item-collapsible" data-category="${mainCategory}">
                    <div class="category-header ${isExpanded ? 'expanded' : ''}" onclick="window.categoryManager.toggleCategory('${mainCategory}')">
                        <div class="category-main-info">
                            <span class="category-name">${this.capitalizeFirst(mainCategory)}</span>
                            <span class="category-count">${subcategoryCount} subcategories</span>
                        </div>
                        <div class="category-actions" onclick="event.stopPropagation()">
                            <button class="btn btn-secondary btn-small add-subcategory-btn" onclick="window.categoryManager.showAddSubcategoryInput('${mainCategory}')" title="Add Subcategory">
                                <span>➕</span> Sub
                            </button>
                            <button class="btn btn-secondary btn-small edit-category-btn" onclick="window.categoryManager.showEditCategoryInput('${mainCategory}')" title="Edit Category">
                                <span>✏️</span> Edit
                            </button>
                            <button class="btn btn-secondary btn-small delete-category-btn" onclick="window.categoryManager.confirmDeleteCategory('${mainCategory}')" title="Delete Category">
                                <span>🗑️</span> Delete
                            </button>
                        </div>
                        <span class="expand-icon ${isExpanded ? 'expanded' : ''}">▶</span>
                    </div>
                    <div class="subcategories-container ${isExpanded ? 'expanded' : ''}">
                        <div class="subcategories-grid">
                            ${subcategories.map(subcategory => {
                                return `
                                    <div class="subcategory-tag" data-main-category="${mainCategory}" data-subcategory="${subcategory}">
                                        <span class="subcategory-name">${this.capitalizeFirst(subcategory)}</span>
                                        <div class="subcategory-actions">
                                            <button class="btn btn-secondary btn-small edit-subcategory-btn" onclick="window.categoryManager.showEditSubcategoryInput('${mainCategory}', '${subcategory}')" title="Edit">✏️</button>
                                            <button class="btn btn-secondary btn-small delete-subcategory-btn" onclick="window.categoryManager.confirmDeleteSubcategory('${mainCategory}', '${subcategory}')" title="Delete">🗑️</button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    renderGridCategoryList(searchFilter = '') {
        const container = document.getElementById('category-list-grid');
        if (!container) return;
        
        if (Object.keys(this.categories).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📂</div>
                    <h4>No categories yet</h4>
                    <p>Add your first category above or select an industry template</p>
                </div>
            `;
            return;
        }

        const filteredCategories = this.getFilteredCategories(searchFilter);

        if (filteredCategories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h4>No categories match your search</h4>
                    <p>Try adjusting your search terms</p>
                </div>
            `;
            return;
        }

        let html = '';
        filteredCategories.forEach(mainCategory => {
            const subcategories = this.categories[mainCategory];

            html += `
                <div class="category-card" data-category="${mainCategory}">
                    <div class="category-card-header">
                        <span class="category-card-name">${this.capitalizeFirst(mainCategory)}</span>
                        <div class="category-actions">
                            <button class="btn btn-secondary btn-small" onclick="window.categoryManager.showAddSubcategoryInput('${mainCategory}')" title="Add Subcategory">➕</button>
                            <button class="btn btn-secondary btn-small" onclick="window.categoryManager.showEditCategoryInput('${mainCategory}')" title="Edit">✏️</button>
                            <button class="btn btn-secondary btn-small" onclick="window.categoryManager.confirmDeleteCategory('${mainCategory}')" title="Delete">🗑️</button>
                        </div>
                    </div>
                    <div class="category-card-stats">
                        <span class="category-count">${subcategories.length} subcategories</span>
                    </div>
                    <div class="subcategories-list">
                        ${subcategories.map(subcategory => {
                            return `<span class="subcategory-chip" onclick="window.categoryManager.showEditSubcategoryInput('${mainCategory}', '${subcategory}')">${this.capitalizeFirst(subcategory)}</span>`;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getFilteredCategories(searchFilter) {
        if (!searchFilter) {
            return Object.keys(this.categories);
        }

        return Object.keys(this.categories).filter(category => {
            const categoryMatch = category.toLowerCase().includes(searchFilter);
            const subcategoryMatch = this.categories[category].some(sub => 
                sub.toLowerCase().includes(searchFilter)
            );
            return categoryMatch || subcategoryMatch;
        });
    }

    toggleCategory(categoryName) {
        if (this.expandedCategories.has(categoryName)) {
            this.expandedCategories.delete(categoryName);
        } else {
            this.expandedCategories.add(categoryName);
        }
        this.saveToStorage();
        this.renderCategoryList();
    }

    showEditCategoryInput(categoryName) {
        const prompt = window.prompt(`Enter new name for category "${this.capitalizeFirst(categoryName)}":`, this.capitalizeFirst(categoryName));
        if (prompt && prompt.trim()) {
            const newName = prompt.trim().toLowerCase();
            if (newName !== categoryName) {
                this.editCategory(categoryName, newName);
            }
        }
    }

    showEditSubcategoryInput(mainCategory, subcategoryName) {
        const prompt = window.prompt(`Enter new name for subcategory "${this.capitalizeFirst(subcategoryName)}":`, this.capitalizeFirst(subcategoryName));
        if (prompt && prompt.trim()) {
            const newName = prompt.trim().toLowerCase();
            if (newName !== subcategoryName) {
                this.editSubcategory(mainCategory, subcategoryName, newName);
            }
        }
    }

    showAddSubcategoryInput(mainCategory) {
        const prompt = window.prompt(`Enter name for new subcategory in "${this.capitalizeFirst(mainCategory)}":`);
        if (prompt && prompt.trim()) {
            const subcategoryName = prompt.trim().toLowerCase();
            this.addSubcategory(mainCategory, subcategoryName);
        }
    }

    confirmDeleteCategory(categoryName) {
        if (confirm(`Are you sure you want to delete the category "${this.capitalizeFirst(categoryName)}"? This will also delete all its subcategories.`)) {
            this.deleteCategory(categoryName);
        }
    }

    confirmDeleteSubcategory(mainCategory, subcategoryName) {
        if (confirm(`Are you sure you want to delete the subcategory "${this.capitalizeFirst(subcategoryName)}"?`)) {
            this.deleteSubcategory(mainCategory, subcategoryName);
        }
    }

    editCategory(oldName, newName) {
        if (this.categories.hasOwnProperty(newName)) {
            this.showErrorMessage('Category name already exists.');
            return;
        }

        this.categories[newName] = this.categories[oldName];
        delete this.categories[oldName];

        if (this.expandedCategories.has(oldName)) {
            this.expandedCategories.delete(oldName);
            this.expandedCategories.add(newName);
        }

        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`Category renamed to "${this.capitalizeFirst(newName)}".`);
    }

    editSubcategory(mainCategory, oldName, newName) {
        if (this.categories[mainCategory].includes(newName)) {
            this.showErrorMessage('Subcategory name already exists in this category.');
            return;
        }

        const index = this.categories[mainCategory].indexOf(oldName);
        if (index !== -1) {
            this.categories[mainCategory][index] = newName;
        }

        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`Subcategory renamed to "${this.capitalizeFirst(newName)}".`);
    }

    addSubcategory(mainCategory, subcategoryName) {
        if (this.categories[mainCategory].includes(subcategoryName)) {
            this.showErrorMessage('Subcategory already exists.');
            return false;
        }

        this.categories[mainCategory].push(subcategoryName);
        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`Subcategory "${this.capitalizeFirst(subcategoryName)}" added!`);
        return true;
    }

    deleteCategory(categoryName) {
        delete this.categories[categoryName];
        this.expandedCategories.delete(categoryName);
        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`Category "${this.capitalizeFirst(categoryName)}" deleted.`);
    }

    deleteSubcategory(mainCategory, subcategoryName) {
        const index = this.categories[mainCategory].indexOf(subcategoryName);
        if (index !== -1) {
            this.categories[mainCategory].splice(index, 1);
        }

        this.saveToStorage();
        this.updateUI();
        
        // Update transaction manager if it exists
        if (window.transactionManager) {
            window.transactionManager.updateCategoryDropdowns();
        }
        
        this.showSuccessMessage(`Subcategory "${this.capitalizeFirst(subcategoryName)}" deleted!`);
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => msg.remove());

        const messageEl = document.createElement('div');
        messageEl.className = `toast-message ${type}`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.classList.add('show');
        }, 100);

        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 400);
        }, 4000);
    }
}

// Transaction Management Class
class TransactionManager {
    constructor() {
        this.transactions = [];
        this.nextId = 1;
        
        this.loadFromStorage();
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
        this.updateCategoryDropdowns();
        console.log('Transaction Manager initialized');
    }

    bindEvents() {
        // Add transaction button
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                this.addTransaction();
            });
        }

        // Category selection change
        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.updateSubcategoryDropdown(e.target.value);
            });
        }

        // Search and filter
        const searchTransactions = document.getElementById('search-transactions');
        if (searchTransactions) {
            searchTransactions.addEventListener('input', (e) => {
                this.filterTransactions();
            });
        }

        const filterCategory = document.getElementById('filter-category');
        if (filterCategory) {
            filterCategory.addEventListener('change', () => {
                this.filterTransactions();
            });
        }

        // File upload
        const fileUploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('file-input');
        
        if (fileUploadArea && fileInput) {
            fileUploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.style.background = '#eff6ff';
                fileUploadArea.style.borderColor = '#3b82f6';
            });

            fileUploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                fileUploadArea.style.background = '#f8fafc';
                fileUploadArea.style.borderColor = '#cbd5e0';
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.style.background = '#f8fafc';
                fileUploadArea.style.borderColor = '#cbd5e0';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleFileUpload(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFileUpload(e.target.files[0]);
                }
            });
        }

        // Estimator controls
        this.bindEstimatorEvents();
    }

bindEstimatorEvents() {
    // Preset markup buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const markup = parseFloat(e.target.dataset.markup);
            const customMarkupInput = document.getElementById('custom-markup');
            if (customMarkupInput) {
                customMarkupInput.value = markup;
            }
            this.updateEstimate();
        });
    });

    // Estimator input changes
    const estimatorInputs = ['custom-markup', 'contingency', 'permits', 'insurance', 'overhead'];
    estimatorInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                this.updateEstimate();
            });
        }
    });

    // Export format change
    document.querySelectorAll('input[name="export-format"]').forEach(radio => {
        radio.addEventListener('change', () => {
            this.togglePdfOptions();
        });
    });

    // Terms checkbox toggle
    const includeTermsCheckbox = document.getElementById('include-terms');
    if (includeTermsCheckbox) {
        includeTermsCheckbox.addEventListener('change', (e) => {
            const termsSection = document.getElementById('terms-section');
            if (termsSection) {
                termsSection.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }

    // Preview estimate button
    const previewEstimateBtn = document.getElementById('preview-estimate-btn');
    if (previewEstimateBtn) {
        previewEstimateBtn.addEventListener('click', () => {
            this.previewEstimate();
        });
    }

    // *** REMOVED DUPLICATE EXPORT BUTTON BINDING - HANDLED BY initializeExportSystem() ***

    // Modal close events
    const closePreviewBtn = document.getElementById('close-preview');
    const closePreviewFooterBtn = document.getElementById('close-preview-btn');
    const downloadFromPreviewBtn = document.getElementById('download-from-preview');

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', () => {
            this.closePreviewModal();
        });
    }

    if (closePreviewFooterBtn) {
        closePreviewFooterBtn.addEventListener('click', () => {
            this.closePreviewModal();
        });
    }

    if (downloadFromPreviewBtn) {
        downloadFromPreviewBtn.addEventListener('click', () => {
            this.downloadPdfFromPreview();
        });
    }

    // Modal overlay click to close
    const modal = document.getElementById('pdf-preview-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closePreviewModal();
            }
        });
    }

    // Set default date
    const estimateDateInput = document.getElementById('estimate-date');
    if (estimateDateInput && !estimateDateInput.value) {
        estimateDateInput.value = new Date().toISOString().split('T')[0];
    }
}

    togglePdfOptions() {
        const selectedFormat = document.querySelector('input[name="export-format"]:checked')?.value;
        const pdfOptions = document.getElementById('pdf-options');
        
        if (pdfOptions) {
            const isPdfFormat = selectedFormat === 'pdf' || selectedFormat === 'detailed-pdf';
            pdfOptions.style.opacity = isPdfFormat ? '1' : '0.5';
            pdfOptions.style.pointerEvents = isPdfFormat ? 'auto' : 'none';
        }
    }

    addTransaction() {
        const itemName = document.getElementById('item-name')?.value?.trim();
        const category = document.getElementById('category-select')?.value;
        const subcategory = document.getElementById('subcategory-select')?.value;
        const quantity = parseFloat(document.getElementById('quantity')?.value) || 0;
        const unitCost = parseFloat(document.getElementById('unit-cost')?.value) || 0;
        const notes = document.getElementById('notes')?.value?.trim() || '';

        // Validation
        if (!itemName) {
            this.showErrorMessage('Item name is required.');
            return;
        }

        if (!category) {
            this.showErrorMessage('Please select a category.');
            return;
        }

        if (quantity <= 0) {
            this.showErrorMessage('Quantity must be greater than 0.');
            return;
        }

        if (unitCost <= 0) {
            this.showErrorMessage('Unit cost must be greater than 0.');
            return;
        }

        const transaction = {
            id: this.nextId++,
            itemName,
            category,
            subcategory: subcategory || 'general',
            quantity,
            unitCost,
            totalCost: quantity * unitCost,
            notes,
            dateAdded: new Date().toISOString()
        };

        this.transactions.push(transaction);
        this.saveToStorage();
        this.updateUI();
        this.clearForm();
        this.showSuccessMessage(`Transaction "${itemName}" added successfully!`);
    }

    clearForm() {
        const inputs = ['item-name', 'quantity', 'unit-cost', 'notes'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) input.value = '';
        });

        const selects = ['category-select', 'subcategory-select'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) select.selectedIndex = 0;
        });

        // Reset subcategory dropdown
        const subcategorySelect = document.getElementById('subcategory-select');
        if (subcategorySelect) {
            subcategorySelect.disabled = true;
            subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
        }
    }

    updateCategoryDropdowns() {
        const categorySelect = document.getElementById('category-select');
        const filterCategory = document.getElementById('filter-category');
        
        if (!window.categoryManager) return;

        const categories = window.categoryManager.categories;
        
        // Update main category dropdown
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            Object.keys(categories).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.capitalizeFirst(category);
                categorySelect.appendChild(option);
            });
        }

        // Update filter dropdown
        if (filterCategory) {
            const currentValue = filterCategory.value;
            filterCategory.innerHTML = '<option value="">All Categories</option>';
            Object.keys(categories).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.capitalizeFirst(category);
                filterCategory.appendChild(option);
            });
            filterCategory.value = currentValue;
        }
    }

    updateSubcategoryDropdown(selectedCategory) {
        const subcategorySelect = document.getElementById('subcategory-select');
        if (!subcategorySelect || !window.categoryManager) return;

        if (!selectedCategory) {
            subcategorySelect.disabled = true;
            subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';
            return;
        }

        const subcategories = window.categoryManager.categories[selectedCategory] || [];
        subcategorySelect.disabled = false;
        subcategorySelect.innerHTML = '<option value="">Select Subcategory</option>';

        subcategories.forEach(subcategory => {
            const option = document.createElement('option');
            option.value = subcategory;
            option.textContent = this.capitalizeFirst(subcategory);
            subcategorySelect.appendChild(option);
        });
    }

    filterTransactions() {
        const searchTerm = document.getElementById('search-transactions')?.value?.toLowerCase() || '';
        const categoryFilter = document.getElementById('filter-category')?.value || '';

        let filteredTransactions = this.transactions;

        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(transaction =>
                transaction.itemName.toLowerCase().includes(searchTerm) ||
                transaction.category.toLowerCase().includes(searchTerm) ||
                transaction.subcategory.toLowerCase().includes(searchTerm) ||
                transaction.notes.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter) {
            filteredTransactions = filteredTransactions.filter(transaction =>
                transaction.category === categoryFilter
            );
        }

        this.renderTransactions(filteredTransactions);
    }

    renderTransactions(transactionsToRender = this.transactions) {
        const container = document.getElementById('transactions-container');
        if (!container) return;

        if (transactionsToRender.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">No transactions yet. Add your first transaction above!</p>';
            return;
        }

        const html = transactionsToRender.map(transaction => `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-details">
                    <h4>${transaction.itemName}</h4>
                    <div class="transaction-meta">
                        <span>${this.capitalizeFirst(transaction.category)}</span>
                        ${transaction.subcategory ? ` > ${this.capitalizeFirst(transaction.subcategory)}` : ''}
                        <span> • Qty: ${transaction.quantity}</span>
                        <span> • Unit: ${transaction.unitCost.toFixed(2)}</span>
                        ${transaction.notes ? `<br><small style="color: #6b7280;">${transaction.notes}</small>` : ''}
                    </div>
                </div>
                <div>
                    <div class="transaction-amount">${transaction.totalCost.toFixed(2)}</div>
                    <button class="btn btn-secondary btn-small" onclick="window.transactionManager.deleteTransaction(${transaction.id})" title="Delete Transaction">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToStorage();
            this.updateUI();
            this.showSuccessMessage('Transaction deleted successfully!');
        }
    }

    handleFileUpload(file) {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            this.showErrorMessage('Please upload a CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                this.parseCSV(e.target.result);
            } catch (error) {
                this.showErrorMessage('Error reading CSV file: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            this.showErrorMessage('CSV file must have at least a header row and one data row.');
            return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['item', 'category', 'quantity', 'unitcost'];
        
        const missingHeaders = requiredHeaders.filter(req => 
            !headers.some(h => h.includes(req.replace('unitcost', 'unit')) || h.includes(req))
        );

        if (missingHeaders.length > 0) {
            this.showErrorMessage(`CSV missing required columns: ${missingHeaders.join(', ')}`);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length !== headers.length) continue;

            try {
                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index];
                });

                const itemName = rowData[headers.find(h => h.includes('item'))] || '';
                const category = rowData[headers.find(h => h.includes('category'))] || '';
                const quantity = parseFloat(rowData[headers.find(h => h.includes('quantity'))]) || 0;
                const unitCost = parseFloat(rowData[headers.find(h => h.includes('unit') || h.includes('cost'))]) || 0;
                const subcategory = rowData[headers.find(h => h.includes('subcategory'))] || '';
                const notes = rowData[headers.find(h => h.includes('notes'))] || '';

                if (itemName && category && quantity > 0 && unitCost > 0) {
                    const transaction = {
                        id: this.nextId++,
                        itemName,
                        category: category.toLowerCase(),
                        subcategory: subcategory.toLowerCase() || 'general',
                        quantity,
                        unitCost,
                        totalCost: quantity * unitCost,
                        notes,
                        dateAdded: new Date().toISOString()
                    };

                    this.transactions.push(transaction);
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                errorCount++;
            }
        }

        this.saveToStorage();
        this.updateUI();

        if (successCount > 0) {
            this.showSuccessMessage(`Successfully imported ${successCount} transactions!`);
        }
        if (errorCount > 0) {
            this.showErrorMessage(`Failed to import ${errorCount} rows. Check your data format.`);
        }
    }

    updateUI() {
        this.renderTransactions();
        this.updateDashboard();
        this.updateTransactionCount();
        this.updateEstimate();
        this.togglePdfOptions();
    }

    updateTransactionCount() {
        const countElement = document.getElementById('transaction-count');
        if (countElement) {
            countElement.textContent = `${this.transactions.length} items`;
        }
    }

    updateDashboard() {
        const totalTransactions = this.transactions.length;
        const totalCost = this.transactions.reduce((sum, t) => sum + t.totalCost, 0);
        const avgCost = totalTransactions > 0 ? totalCost / totalTransactions : 0;
        
        const categories = window.categoryManager ? Object.keys(window.categoryManager.categories).length : 0;

        // Update stat cards
        const elements = {
            'total-transactions': totalTransactions,
            'total-cost': `${totalCost.toFixed(2)}`,
            'avg-cost': `${avgCost.toFixed(2)}`,
            'category-count': categories
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update category breakdown
        this.updateCategoryBreakdown();
    }

    updateCategoryBreakdown() {
        const container = document.getElementById('category-breakdown');
        if (!container) return;

        const categoryTotals = {};
        this.transactions.forEach(transaction => {
            const category = transaction.category;
            categoryTotals[category] = (categoryTotals[category] || 0) + transaction.totalCost;
        });

        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        if (sortedCategories.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center;">No transactions yet</p>';
            return;
        }

        const totalCost = Object.values(categoryTotals).reduce((sum, cost) => sum + cost, 0);

        const html = sortedCategories.map(([category, cost]) => {
            const percentage = totalCost > 0 ? (cost / totalCost * 100) : 0;
            return `
                <div class="cost-line">
                    <span>${this.capitalizeFirst(category)}</span>
                    <span>${cost.toFixed(2)} (${percentage.toFixed(1)}%)</span>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    updateEstimate() {
        const subtotal = this.transactions.reduce((sum, t) => sum + t.totalCost, 0);
        const markupPercent = parseFloat(document.getElementById('custom-markup')?.value) || 0;
        const contingencyPercent = parseFloat(document.getElementById('contingency')?.value) || 0;
        const permits = parseFloat(document.getElementById('permits')?.value) || 0;
        const insurance = parseFloat(document.getElementById('insurance')?.value) || 0;
        const overhead = parseFloat(document.getElementById('overhead')?.value) || 0;

        const markup = subtotal * (markupPercent / 100);
        const contingency = subtotal * (contingencyPercent / 100);
        const additional = permits + insurance + overhead;
        const total = subtotal + markup + contingency + additional;

        // Update display
        const elements = {
            'estimate-subtotal': `${subtotal.toFixed(2)}`,
            'estimate-markup': `${markup.toFixed(2)}`,
            'estimate-contingency': `${contingency.toFixed(2)}`,
            'estimate-additional': `${additional.toFixed(2)}`,
            'estimate-total': `${total.toFixed(2)}`,
            'markup-label': `Markup (${markupPercent}%)`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    previewEstimate() {
        const estimateData = this.getEstimateData();
        if (!estimateData) return;

        // Generate preview content
        const previewContent = this.generatePdfPreview(estimateData);
        
        // Show modal
        const modal = document.getElementById('pdf-preview-modal');
        const previewContainer = document.getElementById('preview-container');
        
        if (modal && previewContainer) {
            previewContainer.innerHTML = previewContent;
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    closePreviewModal() {
        const modal = document.getElementById('pdf-preview-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    downloadPdfFromPreview() {
        // For now, just trigger the export function
        this.exportEstimate();
        this.closePreviewModal();
    }

    getEstimateData() {
        // Validate required fields
        const projectName = document.getElementById('project-name')?.value?.trim();
        const clientName = document.getElementById('client-name')?.value?.trim();
        const companyName = document.getElementById('company-name')?.value?.trim();

        if (!projectName) {
            this.showErrorMessage('Project name is required for export.');
            return null;
        }

        if (!clientName) {
            this.showErrorMessage('Client name is required for export.');
            return null;
        }

        if (!companyName) {
            this.showErrorMessage('Company name is required for export.');
            return null;
        }

        const subtotal = this.transactions.reduce((sum, t) => sum + t.totalCost, 0);
        const markupPercent = parseFloat(document.getElementById('custom-markup')?.value) || 0;
        const contingencyPercent = parseFloat(document.getElementById('contingency')?.value) || 0;
        const permits = parseFloat(document.getElementById('permits')?.value) || 0;
        const insurance = parseFloat(document.getElementById('insurance')?.value) || 0;
        const overhead = parseFloat(document.getElementById('overhead')?.value) || 0;

        const markup = subtotal * (markupPercent / 100);
        const contingency = subtotal * (contingencyPercent / 100);
        const additional = permits + insurance + overhead;
        const total = subtotal + markup + contingency + additional;

        const estimateData = {
            projectInfo: {
                projectName,
                clientName,
                companyName,
                estimateDate: document.getElementById('estimate-date')?.value || new Date().toISOString().split('T')[0],
                projectDescription: document.getElementById('project-description')?.value?.trim() || ''
            },
            transactions: this.transactions,
            calculations: {
                subtotal,
                markupPercent,
                markup,
                contingencyPercent,
                contingency,
                permits,
                insurance,
                overhead,
                additional,
                total
            },
            exportOptions: {
                format: document.querySelector('input[name="export-format"]:checked')?.value || 'pdf',
                includeLogo: document.getElementById('include-logo')?.checked || false,
                includeBreakdown: document.getElementById('include-breakdown')?.checked || false,
                includeTerms: document.getElementById('include-terms')?.checked || false,
                includeWatermark: document.getElementById('include-watermark')?.checked || false,
                template: document.getElementById('pdf-template')?.value || 'professional',
                terms: document.getElementById('terms-text')?.value?.trim() || ''
            }
        };

        return estimateData;
    }

    generatePdfPreview(estimateData) {
        const { projectInfo, calculations, transactions } = estimateData;
        
        // Group transactions by category for breakdown
        const categoryBreakdown = {};
        transactions.forEach(transaction => {
            const category = this.capitalizeFirst(transaction.category);
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = {
                    items: [],
                    total: 0
                };
            }
            categoryBreakdown[category].items.push(transaction);
            categoryBreakdown[category].total += transaction.totalCost;
        });

        const estimateNumber = `EST-${Date.now().toString().slice(-6)}`;
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        return `
            <div class="pdf-page">
                <!-- Header Section -->
                <div class="pdf-header">
                    <div class="company-info">
                        <div class="logo-placeholder">
                            <div class="logo-text">[COMPANY LOGO]</div>
                        </div>
                        <div class="company-details">
                            <h1 class="company-name">${projectInfo.companyName}</h1>
                            <div class="company-contact">
                                <div>Phone: (555) 123-4567</div>
                                <div>Email: contact@company.com</div>
                                <div>Website: www.company.com</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="estimate-info">
                        <h2 class="estimate-title">PROJECT ESTIMATE</h2>
                        <div class="estimate-details">
                            <div class="detail-row">
                                <span class="label">Estimate #:</span>
                                <span class="value">${estimateNumber}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Date:</span>
                                <span class="value">${new Date(projectInfo.estimateDate).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Valid Until:</span>
                                <span class="value">${validUntil.toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Project & Client Info -->
                <div class="pdf-section">
                    <div class="client-project-info">
                        <div class="client-info">
                            <h3>Client Information</h3>
                            <div class="info-content">
                                <div class="client-name">${projectInfo.clientName}</div>
                                <div class="client-details">
                                    <div>Address: [Client Address]</div>
                                    <div>Phone: [Client Phone]</div>
                                    <div>Email: [Client Email]</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="project-info">
                            <h3>Project Information</h3>
                            <div class="info-content">
                                <div class="project-name">${projectInfo.projectName}</div>
                                <div class="project-description">${projectInfo.projectDescription || 'No description provided.'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Cost Breakdown Section -->
                <div class="pdf-section breakdown-section">
                    <h3>Cost Breakdown</h3>
                    <div class="breakdown-table">
                        <div class="breakdown-header">
                            <div class="col-category">Category</div>
                            <div class="col-items">Items</div>
                            <div class="col-amount">Amount</div>
                        </div>
                        <div class="breakdown-body">
                            ${Object.entries(categoryBreakdown).map(([category, data]) => `
                                <div class="breakdown-row">
                                    <div class="col-category">${category}</div>
                                    <div class="col-items">${data.items.length} items</div>
                                    <div class="col-amount">${data.total.toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Summary Section -->
                <div class="pdf-section summary-section">
                    <h3>Project Summary</h3>
                    <div class="summary-table">
                        <div class="summary-row">
                            <span class="summary-label">Subtotal:</span>
                            <span class="summary-value">${calculations.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Markup (${calculations.markupPercent}%):</span>
                            <span class="summary-value">${calculations.markup.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Contingency (${calculations.contingencyPercent}%):</span>
                            <span class="summary-value">${calculations.contingency.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Additional Costs:</span>
                            <span class="summary-value">${calculations.additional.toFixed(2)}</span>
                        </div>
                        <div class="summary-row total-row">
                            <span class="summary-label">Total Project Cost:</span>
                            <span class="summary-value">${calculations.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Footer Section -->
                <div class="pdf-footer">
                    <div class="footer-text">
                        <div>Thank you for considering our services. We look forward to working with you!</div>
                        <div class="contact-footer">Questions? Contact us at contact@company.com or (555) 123-4567</div>
                    </div>
                </div>
            </div>
        `;
    }

exportEstimate() {
    const estimateData = this.getEstimateData();
    if (!estimateData) return;

    // Use the ExportManager for PDF exports, fallback for others
    const format = estimateData.exportOptions.format;
    
    switch (format) {
        case 'pdf':
        case 'detailed-pdf':
            if (window.exportManager) {
                window.exportManager.exportToAdvancedPdf(estimateData)
                    .then(() => {
                        this.showSuccessMessage('PDF export completed! Check your print dialog.');
                    })
                    .catch((error) => {
                        this.showErrorMessage('Export failed: ' + error.message);
                    });
            } else {
                this.exportToPdf(estimateData);
            }
            break;
        case 'json':
            this.exportToJson(estimateData);
            break;
        case 'csv':
            this.exportToCsv(estimateData);
            break;
        default:
            this.showErrorMessage('Invalid export format selected.');
    }
}

    exportToPdf(estimateData) {
        // For now, we'll create a simple HTML representation that can be printed
        const pdfContent = this.generatePdfPreview(estimateData);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${estimateData.projectInfo.projectName} - Estimate</title>
                <style>
                    ${this.getPdfStyles()}
                </style>
            </head>
            <body>
                ${pdfContent}
                <script>
                    window.onload = function() {
                        window.print();
                        window.onafterprint = function() {
                            window.close();
                        };
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        this.showSuccessMessage('PDF print dialog opened. You can save as PDF from the print options.');
    }

    getPdfStyles() {
        // Return a simplified version of the PDF styles for printing
        return `
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; }
            .pdf-page { max-width: 210mm; margin: 0 auto; }
            .pdf-header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #3b82f6; }
            .company-info { display: flex; gap: 20px; }
            .logo-placeholder { width: 80px; height: 80px; border: 2px dashed #cbd5e0; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
            .logo-text { font-size: 10px; color: #6b7280; text-align: center; }
            .company-name { font-size: 24px; font-weight: 700; color: #1e40af; margin: 0 0 10px 0; }
            .company-contact { font-size: 11px; color: #6b7280; }
            .estimate-info { text-align: right; }
            .estimate-title { font-size: 20px; font-weight: 700; color: #1e40af; margin: 0 0 15px 0; }
            .estimate-details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .detail-row .label { font-weight: 600; color: #4a5568; }
            .pdf-section { margin-bottom: 25px; }
            .pdf-section h3 { font-size: 16px; font-weight: 600; color: #1e40af; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
            .client-project-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .client-info, .project-info { background: #f8fafc; border-radius: 6px; padding: 15px; border-left: 4px solid #3b82f6; }
            .client-name, .project-name { font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 8px; }
            .breakdown-table { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
            .breakdown-header { display: grid; grid-template-columns: 2fr 3fr 1fr; background: #1e40af; color: white; padding: 12px 15px; font-weight: 600; }
            .breakdown-row { display: grid; grid-template-columns: 2fr 3fr 1fr; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; }
            .breakdown-row:nth-child(even) { background: #f8fafc; }
            .col-amount { text-align: right; font-weight: 600; color: #059669; }
            .summary-table { background: white; border: 1px solid #e2e8f0; border-radius: 6px; max-width: 400px; margin-left: auto; }
            .summary-row { display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #e2e8f0; }
            .summary-row.total-row { background: #1e40af; color: white; font-weight: 700; }
            .pdf-footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; font-size: 11px; color: #6b7280; }
            @media print { body { margin: 0; padding: 0; } .pdf-page { max-width: none; } }
        `;
    }

    exportToJson(estimateData) {
        const dataStr = JSON.stringify(estimateData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `estimate-${estimateData.projectInfo.projectName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccessMessage('JSON estimate exported successfully!');
    }

    exportToCsv(estimateData) {
        const { transactions, calculations, projectInfo } = estimateData;
        
        // Create CSV header
        let csvContent = 'Project Name,Client Name,Company Name,Estimate Date\n';
        csvContent += `"${projectInfo.projectName}","${projectInfo.clientName}","${projectInfo.companyName}","${projectInfo.estimateDate}"\n\n`;
        
        // Add transactions
        csvContent += 'Item Name,Category,Subcategory,Quantity,Unit Cost,Total Cost,Notes\n';
        transactions.forEach(transaction => {
            csvContent += `"${transaction.itemName}","${transaction.category}","${transaction.subcategory}",${transaction.quantity},${transaction.unitCost},${transaction.totalCost},"${transaction.notes}"\n`;
        });
        
        // Add summary
        csvContent += '\nSummary\n';
        csvContent += `Subtotal,${calculations.subtotal}\n`;
        csvContent += `Markup (${calculations.markupPercent}%),${calculations.markup}\n`;
        csvContent += `Contingency (${calculations.contingencyPercent}%),${calculations.contingency}\n`;
        csvContent += `Additional Costs,${calculations.additional}\n`;
        csvContent += `Total,${calculations.total}\n`;
        
        const dataBlob = new Blob([csvContent], { type: 'text/csv' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `estimate-${estimateData.projectInfo.projectName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        this.showSuccessMessage('CSV estimate exported successfully!');
    }

    saveToStorage() {
        const data = {
            transactions: this.transactions,
            nextId: this.nextId
        };
        localStorage.setItem('transactionManagerData', JSON.stringify(data));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('transactionManagerData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.transactions = data.transactions || [];
                this.nextId = data.nextId || 1;
            } catch (error) {
                console.warn('Error loading transaction data:', error);
                this.transactions = [];
                this.nextId = 1;
            }
        }
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type = 'info') {
        const existingMessages = document.querySelectorAll('.toast-message');
        existingMessages.forEach(msg => msg.remove());

        const messageEl = document.createElement('div');
        messageEl.className = `toast-message ${type}`;
        messageEl.textContent = message;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.classList.add('show');
        }, 100);

        setTimeout(() => {
            messageEl.classList.remove('show');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 400);
        }, 4000);
    }
}

// PDF Generator Utility Class
class PdfGenerator {
    static generateAdvancedPdf(estimateData) {
        // This would integrate with a PDF library like jsPDF or PDFKit
        // For now, we'll use the print-based approach
        const content = TransactionManager.prototype.generatePdfPreview(estimateData);
        
        // Create a more sophisticated PDF layout
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${estimateData.projectInfo.projectName} - Professional Estimate</title>
                <meta charset="UTF-8">
                <style>
                    ${this.getAdvancedPdfStyles(estimateData.exportOptions.template)}
                </style>
            </head>
            <body>
                ${content}
                ${estimateData.exportOptions.includeWatermark ? '<div class="watermark">ESTIMATE</div>' : ''}
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.onafterprint = function() {
                                window.close();
                            };
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    static getAdvancedPdfStyles(template = 'professional') {
        const baseStyles = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
                margin: 0; 
                padding: 0; 
                background: white;
                color: #333;
                line-height: 1.4;
                font-size: 12px;
            }
            .pdf-page { 
                width: 210mm; 
                min-height: 297mm; 
                margin: 0 auto; 
                padding: 20mm; 
                background: white;
                position: relative;
            }
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 120px;
                font-weight: 900;
                color: rgba(59, 130, 246, 0.1);
                pointer-events: none;
                z-index: 1;
                user-select: none;
            }
        `;

        const templateStyles = {
            professional: `
                .pdf-header { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 30px; 
                    padding-bottom: 20px; 
                    border-bottom: 3px solid #3b82f6; 
                }
                .company-name { color: #1e40af; font-size: 24px; font-weight: 700; }
                .estimate-title { color: #1e40af; font-size: 20px; font-weight: 700; }
                .summary-row.total-row { background: #1e40af; color: white; }
            `,
            detailed: `
                .pdf-header { 
                    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                    padding: 20px;
                    margin-bottom: 30px;
                    border-radius: 8px;
                    border: 1px solid #cbd5e0;
                }
                .company-name { color: #2d3748; font-size: 22px; font-weight: 600; }
                .estimate-title { color: #2d3748; font-size: 18px; font-weight: 600; }
                .summary-row.total-row { background: #2d3748; color: white; }
            `,
            simple: `
                .pdf-header { 
                    margin-bottom: 40px; 
                    padding-bottom: 15px; 
                    border-bottom: 1px solid #e2e8f0; 
                }
                .company-name { color: #374151; font-size: 20px; font-weight: 600; }
                .estimate-title { color: #374151; font-size: 16px; font-weight: 600; }
                .summary-row.total-row { background: #374151; color: white; }
            `,
            construction: `
                .pdf-header { 
                    background: #f97316;
                    color: white;
                    padding: 20px;
                    margin-bottom: 30px;
                    border-radius: 0;
                }
                .company-name { color: white; font-size: 24px; font-weight: 700; }
                .estimate-title { color: white; font-size: 20px; font-weight: 700; }
                .estimate-details { background: rgba(255,255,255,0.9); color: #1f2937; }
                .summary-row.total-row { background: #f97316; color: white; }
            `
        };

        return baseStyles + (templateStyles[template] || templateStyles.professional) + `
            .pdf-header .company-info { display: flex; gap: 20px; align-items: flex-start; }
            .logo-placeholder { 
                width: 80px; height: 80px; border: 2px dashed #cbd5e0; 
                border-radius: 8px; display: flex; align-items: center; 
                justify-content: center; background: #f8fafc; flex-shrink: 0;
            }
            .logo-text { font-size: 10px; color: #6b7280; text-align: center; font-weight: 500; }
            .company-details { flex: 1; }
            .company-contact { font-size: 11px; color: #6b7280; line-height: 1.6; margin-top: 10px; }
            .estimate-info { text-align: right; min-width: 200px; }
            .estimate-details { 
                background: #f8fafc; border: 1px solid #e2e8f0; 
                border-radius: 6px; padding: 15px; margin-top: 15px;
            }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .detail-row:last-child { margin-bottom: 0; }
            .detail-row .label { font-weight: 600; color: #4a5568; }
            .detail-row .value { color: #2d3748; font-weight: 500; }
            .pdf-section { margin-bottom: 25px; }
            .pdf-section h3 { 
                font-size: 16px; font-weight: 600; color: #1e40af; 
                margin: 0 0 15px 0; padding-bottom: 8px; 
                border-bottom: 2px solid #e2e8f0; 
            }
            .client-project-info { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .client-info, .project-info { 
                background: #f8fafc; border-radius: 6px; 
                padding: 15px; border-left: 4px solid #3b82f6; 
            }
            .client-info h3, .project-info h3 { 
                font-size: 14px; margin: 0 0 10px 0; 
                border: none; padding: 0; color: #2d3748; 
            }
            .client-name, .project-name { 
                font-size: 16px; font-weight: 600; 
                color: #1e40af; margin-bottom: 8px; 
            }
            .client-details, .project-description { 
                font-size: 11px; color: #6b7280; line-height: 1.6; 
            }
            .breakdown-table { border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; }
            .breakdown-header { 
                display: grid; grid-template-columns: 2fr 3fr 1fr; 
                background: #1e40af; color: white; padding: 12px 15px; 
                font-weight: 600; font-size: 13px; 
            }
            .breakdown-body { background: white; }
            .breakdown-row { 
                display: grid; grid-template-columns: 2fr 3fr 1fr; 
                padding: 10px 15px; border-bottom: 1px solid #e2e8f0; 
                align-items: center; 
            }
            .breakdown-row:last-child { border-bottom: none; }
            .breakdown-row:nth-child(even) { background: #f8fafc; }
            .col-category { font-weight: 600; color: #2d3748; }
            .col-items { color: #6b7280; font-size: 11px; }
            .col-amount { text-align: right; font-weight: 600; color: #059669; }
            .summary-table { 
                background: white; border: 1px solid #e2e8f0; 
                border-radius: 6px; overflow: hidden; 
                max-width: 400px; margin-left: auto; 
            }
            .summary-row { 
                display: flex; justify-content: space-between; 
                padding: 12px 20px; border-bottom: 1px solid #e2e8f0; 
            }
            .summary-row:last-child { border-bottom: none; }
            .summary-row.total-row { font-weight: 700; font-size: 14px; }
            .summary-label { font-weight: 600; }
            .summary-value { font-weight: 600; color: #059669; }
            .total-row .summary-value { color: inherit; }
            .terms-content { 
                background: #f8fafc; border: 1px solid #e2e8f0; 
                border-radius: 6px; padding: 15px; font-size: 11px; 
                line-height: 1.6; color: #4a5568; 
            }
            .pdf-footer { 
                margin-top: 40px; padding-top: 20px; 
                border-top: 2px solid #e2e8f0; text-align: center; 
            }
            .footer-text { font-size: 11px; color: #6b7280; line-height: 1.6; }
            .contact-footer { margin-top: 8px; font-weight: 500; color: #4a5568; }
            
            @media print {
                body { margin: 0; padding: 0; }
                .pdf-page { max-width: none; margin: 0; }
                @page { margin: 0; }
            }
        `;
    }
}

// Advanced Export Manager Class
class ExportManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.currentPreviewData = null;
    }

    async generatePdfBlob(estimateData) {
        // Create a comprehensive PDF content
        const pdfContent = this.generateComprehensivePdfContent(estimateData);
        
        // Create a blob URL for the PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${estimateData.projectInfo.projectName} - Estimate</title>
                <style>${PdfGenerator.getAdvancedPdfStyles(estimateData.exportOptions.template)}</style>
            </head>
            <body>
                ${pdfContent}
                ${estimateData.exportOptions.includeWatermark ? '<div class="watermark">ESTIMATE</div>' : ''}
            </body>
            </html>
        `;
        
        return new Blob([htmlContent], { type: 'text/html' });
    }

    generateComprehensivePdfContent(estimateData) {
        const { projectInfo, calculations, transactions, exportOptions } = estimateData;
        
        // Group transactions by category
        const categoryBreakdown = this.groupTransactionsByCategory(transactions);
        
        // Generate estimate number and dates
        const estimateNumber = `EST-${Date.now().toString().slice(-6)}`;
        const currentDate = new Date(projectInfo.estimateDate);
        const validUntil = new Date(currentDate);
        validUntil.setDate(validUntil.getDate() + 30);

        let content = `
            <div class="pdf-page">
                <!-- Header Section -->
                <div class="pdf-header">
                    <div class="company-info">
                        ${exportOptions.includeLogo ? `
                            <div class="logo-placeholder">
                                <div class="logo-text">[COMPANY LOGO]</div>
                            </div>
                        ` : ''}
                        <div class="company-details">
                            <h1 class="company-name">${projectInfo.companyName}</h1>
                            <div class="company-contact">
                                <div>Phone: (555) 123-4567</div>
                                <div>Email: contact@${projectInfo.companyName.toLowerCase().replace(/\s+/g, '')}.com</div>
                                <div>Website: www.${projectInfo.companyName.toLowerCase().replace(/\s+/g, '')}.com</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="estimate-info">
                        <h2 class="estimate-title">PROJECT ESTIMATE</h2>
                        <div class="estimate-details">
                            <div class="detail-row">
                                <span class="label">Estimate #:</span>
                                <span class="value">${estimateNumber}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Date:</span>
                                <span class="value">${currentDate.toLocaleDateString()}</span>
                            </div>
                            <div class="detail-row">
                                <span class="label">Valid Until:</span>
                                <span class="value">${validUntil.toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Project & Client Info -->
                <div class="pdf-section">
                    <div class="client-project-info">
                        <div class="client-info">
                            <h3>Client Information</h3>
                            <div class="info-content">
                                <div class="client-name">${projectInfo.clientName}</div>
                                <div class="client-details">
                                    <div>Project: ${projectInfo.projectName}</div>
                                    <div>Contact: [Client Phone]</div>
                                    <div>Email: [Client Email]</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="project-info">
                            <h3>Project Information</h3>
                            <div class="info-content">
                                <div class="project-name">${projectInfo.projectName}</div>
                                <div class="project-description">${projectInfo.projectDescription || 'Professional cost estimate for the requested services and materials.'}</div>
                            </div>
                        </div>
                    </div>
                </div>
        `;

        // Add detailed breakdown if requested
        if (exportOptions.includeBreakdown && exportOptions.format === 'detailed-pdf') {
            content += this.generateDetailedBreakdown(transactions, categoryBreakdown);
        }

        // Add category summary
        content += `
                <!-- Cost Breakdown Section -->
                <div class="pdf-section breakdown-section">
                    <h3>Cost Breakdown by Category</h3>
                    <div class="breakdown-table">
                        <div class="breakdown-header">
                            <div class="col-category">Category</div>
                            <div class="col-items">Items</div>
                            <div class="col-amount">Amount</div>
                        </div>
                        <div class="breakdown-body">
                            ${Object.entries(categoryBreakdown).map(([category, data]) => `
                                <div class="breakdown-row">
                                    <div class="col-category">${this.transactionManager.capitalizeFirst(category)}</div>
                                    <div class="col-items">${data.items.length} items</div>
                                    <div class="col-amount">$${data.total.toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Summary Section -->
                <div class="pdf-section summary-section">
                    <h3>Project Cost Summary</h3>
                    <div class="summary-table">
                        <div class="summary-row">
                            <span class="summary-label">Subtotal:</span>
                            <span class="summary-value">$${calculations.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Markup (${calculations.markupPercent}%):</span>
                            <span class="summary-value">$${calculations.markup.toFixed(2)}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-label">Contingency (${calculations.contingencyPercent}%):</span>
                            <span class="summary-value">$${calculations.contingency.toFixed(2)}</span>
                        </div>
                        ${calculations.additional > 0 ? `
                        <div class="summary-row">
                            <span class="summary-label">Additional Costs:</span>
                            <span class="summary-value">$${calculations.additional.toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="summary-row total-row">
                            <span class="summary-label">Total Project Cost:</span>
                            <span class="summary-value">$${calculations.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
        `;

        // Add terms and conditions if requested
        if (exportOptions.includeTerms && exportOptions.terms) {
            content += `
                <!-- Terms & Conditions Section -->
                <div class="pdf-section terms-section">
                    <h3>Terms & Conditions</h3>
                    <div class="terms-content">
                        ${exportOptions.terms.split('\n').map(line => `<p>${line}</p>`).join('')}
                    </div>
                </div>
            `;
        }

        // Add footer
        content += `
                <!-- Footer Section -->
                <div class="pdf-footer">
                    <div class="footer-text">
                        <div>Thank you for considering ${projectInfo.companyName}. We look forward to working with you!</div>
                        <div class="contact-footer">Questions? Contact us at contact@${projectInfo.companyName.toLowerCase().replace(/\s+/g, '')}.com</div>
                    </div>
                </div>
            </div>
        `;

        return content;
    }

    generateDetailedBreakdown(transactions, categoryBreakdown) {
        return `
            <!-- Detailed Item Breakdown -->
            <div class="pdf-section detailed-breakdown-section">
                <h3>Detailed Item Breakdown</h3>
                ${Object.entries(categoryBreakdown).map(([category, data]) => `
                    <div class="category-section">
                        <h4 style="color: #1e40af; font-size: 14px; margin: 20px 0 10px 0; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0;">
                            ${this.transactionManager.capitalizeFirst(category)} - $${data.total.toFixed(2)}
                        </h4>
                        <div class="items-table">
                            <div class="items-header" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; background: #f8fafc; padding: 8px 12px; font-weight: 600; border: 1px solid #e2e8f0; font-size: 11px;">
                                <div>Item</div>
                                <div style="text-align: center;">Qty</div>
                                <div style="text-align: center;">Unit Cost</div>
                                <div style="text-align: right;">Total</div>
                            </div>
                            ${data.items.map(item => `
                                <div class="item-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 6px 12px; border: 1px solid #e2e8f0; border-top: none; font-size: 10px;">
                                    <div>
                                        ${item.itemName}
                                        ${item.notes ? `<br><span style="color: #6b7280; font-size: 9px;">${item.notes}</span>` : ''}
                                    </div>
                                    <div style="text-align: center;">${item.quantity}</div>
                                    <div style="text-align: center;">$${item.unitCost.toFixed(2)}</div>
                                    <div style="text-align: right; font-weight: 600;">$${item.totalCost.toFixed(2)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    groupTransactionsByCategory(transactions) {
        const categoryBreakdown = {};
        transactions.forEach(transaction => {
            const category = transaction.category;
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = {
                    items: [],
                    total: 0
                };
            }
            categoryBreakdown[category].items.push(transaction);
            categoryBreakdown[category].total += transaction.totalCost;
        });
        return categoryBreakdown;
    }

    async exportToAdvancedPdf(estimateData) {
        try {
            // Generate PDF content with selected template
            const pdfContent = this.generateComprehensivePdfContent(estimateData);
            
            // Create a new window with the PDF content
            const printWindow = window.open('', '_blank', 'width=900,height=700');
            
            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${estimateData.projectInfo.projectName} - Professional Estimate</title>
                    <style>
                        ${PdfGenerator.getAdvancedPdfStyles(estimateData.exportOptions.template)}
                    </style>
                </head>
                <body>
                    ${pdfContent}
                    ${estimateData.exportOptions.includeWatermark ? '<div class="watermark">ESTIMATE</div>' : ''}
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = function() {
                                    window.close();
                                };
                            }, 1000);
                        };
                    </script>
                </body>
                </html>
            `;
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            return true;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('Failed to generate PDF. Please try again.');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    window.categoryManager = new CategoryManager();
    window.transactionManager = new TransactionManager();
    window.exportManager = new ExportManager(window.transactionManager);
    
    // Set up navigation
    setupNavigation();
    
    // Initialize export functionality
    initializeExportSystem();
    
    console.log('Multi-Industry Cost Estimator initialized successfully!');
});

function initializeExportSystem() {
    // Enhanced export functionality - this will be the ONLY export button handler
    const exportBtn = document.getElementById('export-estimate-btn');
    if (exportBtn) {
        // Remove any existing listeners by cloning the element
        exportBtn.replaceWith(exportBtn.cloneNode(true));
        const newExportBtn = document.getElementById('export-estimate-btn');
        
        newExportBtn.addEventListener('click', async () => {
            try {
                const estimateData = window.transactionManager.getEstimateData();
                if (!estimateData) return;

                const format = estimateData.exportOptions.format;
                
                // Show loading state
                newExportBtn.disabled = true;
                newExportBtn.innerHTML = '<span>⏳</span> Exporting...';
                
                switch (format) {
                    case 'pdf':
                    case 'detailed-pdf':
                        await window.exportManager.exportToAdvancedPdf(estimateData);
                        window.transactionManager.showSuccessMessage('PDF export completed! Check your print dialog.');
                        break;
                    case 'json':
                        window.transactionManager.exportToJson(estimateData);
                        break;
                    case 'csv':
                        window.transactionManager.exportToCsv(estimateData);
                        break;
                    default:
                        throw new Error('Invalid export format selected.');
                }
            } catch (error) {
                window.transactionManager.showErrorMessage('Export failed: ' + error.message);
            } finally {
                // Reset button state
                setTimeout(() => {
                    newExportBtn.disabled = false;
                    newExportBtn.innerHTML = '<span>📤</span> Export Estimate';
                }, 2000);
            }
        });
    }

    // Ensure PDF options toggle is working
    setTimeout(() => {
        if (window.transactionManager) {
            window.transactionManager.togglePdfOptions();
        }
    }, 100);
}

function setupNavigation() {
    // Handle navigation between sections
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                // Remove active class from all nav links
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
                
                // Show/hide sections based on navigation
                const sectionId = href.substring(1);
                showSection(sectionId);
            } else if (href && href.endsWith('.html')) {
                // Handle page navigation
                window.location.href = href;
            }
        });
    });
}

function showSection(sectionId) {
    // Hide all sections first
    const sections = ['entry', 'transactions', 'dashboard', 'estimator'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update UI when switching to certain sections
    if (sectionId === 'dashboard' && window.transactionManager) {
        window.transactionManager.updateDashboard();
    } else if (sectionId === 'transactions' && window.transactionManager) {
        window.transactionManager.filterTransactions();
    } else if (sectionId === 'estimator' && window.transactionManager) {
        window.transactionManager.updateEstimate();
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Export for global access
window.ExportManager = ExportManager;
window.PdfGenerator = PdfGenerator;