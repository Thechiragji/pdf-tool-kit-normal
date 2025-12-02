let selectedFiles = [];
let currentTool = '';

const toolConfig = {
    'merge': {
        title: 'Merge PDF',
        accept: '.pdf',
        multiple: true,
        options: ''
    },
    'split': {
        title: 'Split PDF',
        accept: '.pdf',
        multiple: false,
        options: `
            <div class="form-group">
                <label>Split Options</label>
                <select class="form-control" id="splitOption">
                    <option value="all">Extract all pages</option>
                    <option value="range">Page range (e.g., 1-5)</option>
                    <option value="single">Single page</option>
                </select>
            </div>
            <div class="form-group">
                <label>Page Range/Number</label>
                <input type="text" class="form-control" id="pageRange" placeholder="e.g., 1-5 or 3">
            </div>
        `
    },
    'compress': {
        title: 'Compress PDF',
        accept: '.pdf',
        multiple: true,
        options: `
            <div class="form-group">
                <label>Compression Level</label>
                <select class="form-control" id="compressionLevel">
                    <option value="low">Low (Better quality)</option>
                    <option value="medium" selected>Medium (Balanced)</option>
                    <option value="high">High (Smaller size)</option>
                </select>
            </div>
        `
    },
    'pdf-to-jpg': {
        title: 'PDF to JPG',
        accept: '.pdf',
        multiple: true,
        options: `
            <div class="form-group">
                <label>Image Quality</label>
                <select class="form-control" id="imageQuality">
                    <option value="high" selected>High Quality</option>
                    <option value="medium">Medium Quality</option>
                    <option value="low">Low Quality</option>
                </select>
            </div>
        `
    },
    'jpg-to-pdf': {
        title: 'JPG to PDF',
        accept: '.jpg,.jpeg,.png',
        multiple: true,
        options: `
            <div class="form-group">
                <label>Page Orientation</label>
                <select class="form-control" id="orientation">
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                    <option value="auto" selected>Auto</option>
                </select>
            </div>
            <div class="form-group">
                <label>Page Margins (mm)</label>
                <input type="number" class="form-control" id="margins" value="10" min="0" max="50">
            </div>
        `
    },
    'pdf-to-word': {
        title: 'PDF to Word',
        accept: '.pdf',
        multiple: true,
        options: ''
    },
    'word-to-pdf': {
        title: 'Word to PDF',
        accept: '.doc,.docx',
        multiple: true,
        options: ''
    },
    'scan': {
        title: 'Scan to PDF',
        accept: 'image/*',
        multiple: true,
        options: `
            <div class="form-group">
                <label>Scan Quality</label>
                <select class="form-control" id="scanQuality">
                    <option value="high" selected>High (Best for text)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low (Faster)</option>
                </select>
            </div>
        `
    }
};

document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
        const tool = card.dataset.tool;
        openModal(tool);
    });
});

function openModal(tool) {
    currentTool = tool;
    const config = toolConfig[tool];
    document.getElementById('modalTitle').textContent = config.title;
    document.getElementById('fileInput').accept = config.accept;
    document.getElementById('fileInput').multiple = config.multiple;
    
    const optionsSection = document.getElementById('optionsSection');
    const toolOptions = document.getElementById('toolOptions');
    if (config.options) {
        toolOptions.innerHTML = config.options;
        optionsSection.style.display = 'block';
    } else {
        optionsSection.style.display = 'none';
    }

    selectedFiles = [];
    updateFileList();
    document.getElementById('processBtn').disabled = true;
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('resultSection').classList.remove('active');
    
    document.getElementById('toolModal').classList.add('active');
}

function closeModal() {
    document.getElementById('toolModal').classList.remove('active');
}

document.getElementById('toolModal').addEventListener('click', (e) => {
    if (e.target.id === 'toolModal') {
        closeModal();
    }
});

const uploadZone = document.getElementById('uploadZone');

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const config = toolConfig[currentTool];
    
    if (!config.multiple && files.length > 1) {
        alert('This tool only accepts one file at a time');
        return;
    }

    Array.from(files).forEach(file => {
        if (validateFile(file, config.accept)) {
            selectedFiles.push(file);
        }
    });

    updateFileList();
    document.getElementById('processBtn').disabled = selectedFiles.length === 0;
}

function validateFile(file, accept) {
    const extensions = accept.split(',').map(ext => ext.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    
    if (accept === 'image/*') {
        return file.type.startsWith('image/');
    }
    
    return extensions.some(ext => fileName.endsWith(ext.replace('.', '')));
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }

    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-icon">📄</div>
                <div class="file-details">
                    <h4>${file.name}</h4>
                    <p>${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button class="remove-file" onclick="removeFile(${index})">✕</button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    document.getElementById('processBtn').disabled = selectedFiles.length === 0;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function processFiles() {
    document.getElementById('processBtn').disabled = true;
    document.getElementById('progressContainer').style.display = 'block';
    
    let progress = 0;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 95) progress = 95;
        progressFill.style.width = progress + '%';
        progressText.textContent = `Processing... ${Math.round(progress)}%`;
    }, 200);

    await new Promise(resolve => setTimeout(resolve, 2500));

    clearInterval(interval);
    progressFill.style.width = '100%';
    progressText.textContent = 'Processing... 100%';

    await new Promise(resolve => setTimeout(resolve, 500));

    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('resultSection').classList.add('active');

    let blob, fileName;
    
    if (currentTool === 'merge' || currentTool === 'compress' || currentTool === 'split') {
        const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>stream
BT /F1 24 Tf 100 700 Td (Processed by Chirag Toolkit) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000337 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
416
%%EOF`;
        blob = new Blob([pdfContent], { type: 'application/pdf' });
        fileName = `processed_${currentTool}_${Date.now()}.pdf`;
    } else if (currentTool === 'pdf-to-jpg') {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 800, 600);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Processed by Chirag Toolkit', 400, 300);
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        fileName = `converted_${Date.now()}.jpg`;
    } else if (currentTool === 'jpg-to-pdf') {
        const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 50>>stream
BT /F1 20 Tf 100 700 Td (JPG converted to PDF successfully) Tj ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000343 00000 n
trailer<</Size 6/Root 1 0 R>>
startxref
422
%%EOF`;
        blob = new Blob([pdfContent], { type: 'application/pdf' });
        fileName = `images_to_pdf_${Date.now()}.pdf`;
    } else {
        const content = `Chirag Cloud Toolkit - ${toolConfig[currentTool].title}
        
File processed successfully!
Tool: ${currentTool}
Files processed: ${selectedFiles.length}
Date: ${new Date().toLocaleString()}

This is a demo output. In production, actual file conversion would happen here.`;
        blob = new Blob([content], { type: 'text/plain' });
        fileName = `processed_${currentTool}_${Date.now()}.txt`;
    }
    
    const url = URL.createObjectURL(blob);
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.href = url;
    downloadBtn.download = fileName;
    
    downloadBtn.onclick = (e) => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };
}
