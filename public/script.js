class CertificateManager {
    constructor() {
        this.certificates = [];
        this.filteredCertificates = [];
        this.init();
    }

    async init() {
        await this.loadCertificates();
        this.setupEventListeners();
        this.updateStats();
    }

    async loadCertificates() {
        try {
            const response = await fetch('/api/certificates');
            this.certificates = await response.json();
            this.filteredCertificates = [...this.certificates];
            this.renderCertificates();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading certificates:', error);
            this.showError('Failed to load certificates');
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            this.filterCertificates(e.target.value);
        });
    }

    filterCertificates(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredCertificates = [...this.certificates];
        } else {
            this.filteredCertificates = this.certificates.filter(cert => 
                cert.name.toLowerCase().includes(term) ||
                cert.type.toLowerCase().includes(term) ||
                cert.bundleId.toLowerCase().includes(term) ||
                cert.teamId.toLowerCase().includes(term)
            );
        }
        
        this.renderCertificates();
        this.updateStats();
    }

    renderCertificates() {
        const grid = document.getElementById('certificatesGrid');
        const noResults = document.getElementById('noResults');
        
        if (this.filteredCertificates.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }
        
        grid.style.display = 'grid';
        noResults.style.display = 'none';
        
        grid.innerHTML = this.filteredCertificates.map(cert => this.createCertificateCard(cert)).join('');
    }

    createCertificateCard(cert) {
        const isExpiringSoon = this.isExpiringSoon(cert.expiryDate);
        const expiryClass = isExpiringSoon ? 'expiry-date' : 'expiry-date safe';
        
        return `
            <div class="certificate-card" data-id="${cert.id}">
                <div class="certificate-header">
                    <div>
                        <div class="certificate-name">${cert.name}</div>
                        <div class="certificate-type">${cert.type}</div>
                    </div>
                    <div class="certificate-status">${cert.status}</div>
                </div>
                
                <div class="certificate-details">
                    <div class="detail-row">
                        <span class="detail-label">Team ID:</span>
                        <span class="detail-value">${cert.teamId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Bundle ID:</span>
                        <span class="detail-value">${cert.bundleId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Expires:</span>
                        <span class="detail-value ${expiryClass}">${this.formatDate(cert.expiryDate)}</span>
                    </div>
                </div>
                
                <button class="download-button" onclick="certificateManager.downloadCertificate(${cert.id})">
                    <i class="fas fa-download"></i>
                    Download Certificate Package
                </button>
            </div>
        `;
    }

    async downloadCertificate(certId) {
        const button = document.querySelector(`[data-id="${certId}"] .download-button`);
        const originalContent = button.innerHTML;
        
        try {
            // Update button state
            button.classList.add('downloading');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Download...';
            
            const response = await fetch(`/api/download/${certId}`);
            
            if (!response.ok) {
                throw new Error('Download failed');
            }
            
            // Get filename from response headers
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition 
                ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                : `certificate_${certId}.zip`;
            
            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Show success
            button.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.classList.remove('downloading');
            }, 2000);
            
        } catch (error) {
            console.error('Download error:', error);
            button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Download Failed';
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.classList.remove('downloading');
            }, 3000);
        }
    }

    updateStats() {
        const totalCerts = this.filteredCertificates.length;
        const expiringSoon = this.filteredCertificates.filter(cert => 
            this.isExpiringSoon(cert.expiryDate)
        ).length;
        
        document.getElementById('totalCerts').textContent = totalCerts;
        document.getElementById('expiringSoon').textContent = expiringSoon;
    }

    isExpiringSoon(expiryDate) {
        const expiry = new Date(expiryDate);
        const now = new Date();
        const daysDiff = (expiry - now) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30; // Consider expiring if less than 30 days
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showError(message) {
        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
    }
}

// Initialize the certificate manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.certificateManager = new CertificateManager();
});