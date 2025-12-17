/**
 * Suraksha Students Records System
 * Clean, offline-first student management using LocalStorage.
 */

const STORAGE_KEY = 'suraksha_students_v1';

const app = {
    records: [],
    currentEditId: null,

    init() {
        this.loadRecords();
        this.cacheDOM();
        this.bindEvents();
        this.renderTable();
        this.setTodayDate();
    },

    cacheDOM() {
        this.tableBody = document.getElementById('table-body');
        this.emptyState = document.getElementById('empty-state');
        this.modal = document.getElementById('record-modal');
        this.form = document.getElementById('record-form');
        this.modalTitle = document.getElementById('modal-title');
        this.totalCount = document.getElementById('total-records-count');
        this.dateInput = document.getElementById('record-date');
    },

    bindEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });
    },

    setTodayDate() {
        // Set default date to today for new records
        if (this.dateInput) {
            this.dateInput.valueAsDate = new Date();
        }
    },

    loadRecords() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.records = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse records", e);
                this.records = [];
            }
        }
    },

    saveRecords() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
        this.renderTable();
    },

    renderTable() {
        this.tableBody.innerHTML = '';
        this.totalCount.textContent = this.records.length;

        if (this.records.length === 0) {
            this.emptyState.classList.remove('hidden');
            return;
        }

        this.emptyState.classList.add('hidden');

        // Sort by date desc (newest first) or admission no? Let's do newest created first (append order inverted or just simple map)
        // Let's just map as is.
        this.records.forEach(record => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${this.escapeHtml(record.admissionNo)}</td>
                <td>
                    <strong>${this.escapeHtml(record.name)}</strong>
                </td>
                <td>${this.escapeHtml(record.address || '-')}</td>
                <td>${this.formatDate(record.date)}</td>
                <td>${this.escapeHtml(record.contact || '-')}</td>
                <td>${this.escapeHtml(record.refNo || '-')}</td>
                <td class="actions-cell no-print">
                    <button class="btn-icon" onclick="app.editRecord('${record.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete" onclick="app.deleteRecord('${record.id}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            `;
            this.tableBody.appendChild(tr);
        });
    },

    openModal(isEdit = false) {
        this.modal.classList.remove('hidden');
        if (!isEdit) {
            this.form.reset();
            this.currentEditId = null;
            this.modalTitle.textContent = "Add New Record";
            this.setTodayDate();
        } else {
            this.modalTitle.textContent = "Edit Record";
        }
    },

    closeModal() {
        this.modal.classList.add('hidden');
        this.form.reset();
        this.currentEditId = null;
    },

    handleFormSubmit() {
        const formData = {
            name: document.getElementById('student-name').value.trim(),
            admissionNo: document.getElementById('admission-no').value.trim(),
            address: document.getElementById('address').value.trim(),
            date: document.getElementById('record-date').value,
            contact: document.getElementById('contact-number').value.trim(),
            refNo: document.getElementById('reference-number').value.trim(),
            notes: document.getElementById('notes').value.trim(),
        };

        if (this.currentEditId) {
            // Update
            const index = this.records.findIndex(r => r.id === this.currentEditId);
            if (index !== -1) {
                this.records[index] = { ...this.records[index], ...formData };
            }
        } else {
            // Create
            const newRecord = {
                id: Date.now().toString(), // Simple unique ID
                ...formData
            };
            this.records.push(newRecord);
        }

        this.saveRecords();
        this.closeModal();
    },

    editRecord(id) {
        const record = this.records.find(r => r.id === id);
        if (!record) return;

        this.currentEditId = id;
        document.getElementById('student-name').value = record.name;
        document.getElementById('admission-no').value = record.admissionNo;
        document.getElementById('address').value = record.address;
        document.getElementById('record-date').value = record.date;
        document.getElementById('contact-number').value = record.contact;
        document.getElementById('reference-number').value = record.refNo;
        document.getElementById('notes').value = record.notes;

        this.openModal(true);
    },

    deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.records = this.records.filter(r => r.id !== id);
            this.saveRecords();
        }
    },

    exportCSV() {
        if (this.records.length === 0) {
            alert("No records to export.");
            return;
        }

        const headers = ['Name', 'Admission No', 'Address', 'Date', 'Contact', 'Ref No', 'Notes'];
        const csvRows = [headers.join(',')];

        this.records.forEach(r => {
            const row = [
                `"${r.name}"`,
                `"${r.admissionNo}"`,
                `"${r.address}"`,
                `"${r.date}"`,
                `"${r.contact}"`,
                `"${r.refNo}"`,
                `"${r.notes}"`
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_records_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    },

    importData(inputElement) {
        const file = inputElement.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            // Simple CSV parsing (assuming our export format)
            try {
                const lines = text.split('\n');
                // Skip header
                let count = 0;
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    // Regex to handle quotes properly
                    const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    // Basic split for now, robust CSV parsing is complex
                    // Let's assume the user re-imports exactly what we exported or simple CSV
                    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, ''));

                    if (cols.length >= 2) { // minimal validation
                        this.records.push({
                            id: Date.now().toString() + Math.random(),
                            name: cols[0],
                            admissionNo: cols[1],
                            address: cols[2] || '',
                            date: cols[3] || '',
                            contact: cols[4] || '',
                            refNo: cols[5] || '',
                            notes: cols[6] || ''
                        });
                        count++;
                    }
                }
                this.saveRecords();
                alert(`Successfully imported ${count} records.`);
                inputElement.value = ''; // Reset
            } catch (err) {
                alert("Error importing file. Please check format.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    },

    // Utilities
    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString();
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
