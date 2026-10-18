/**
 * Passbook OCR Client: Upload, Webcam, Sample Loading & Entity Extraction
 */
const OCRClient = {
  isProcessing: false,
  webcamStream: null,

  init() {
    this.bindEvents();
    this.loadSamplesGallery();
  },

  bindEvents() {
    // Dropzone drag & drop
    const dropzone = document.getElementById("passbookDropzone");
    const fileInput = document.getElementById("passbookFileInput");

    if (dropzone && fileInput) {
      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Camera / Webcam modal
    const openCamBtn = document.getElementById("openCameraBtn");
    if (openCamBtn) {
      openCamBtn.addEventListener("click", () => this.startWebcam());
    }

    const capturePhotoBtn = document.getElementById("capturePhotoBtn");
    if (capturePhotoBtn) {
      capturePhotoBtn.addEventListener("click", () => this.captureWebcamPhoto());
    }

    const closeCamBtn = document.getElementById("closeCameraBtn");
    if (closeCamBtn) {
      closeCamBtn.addEventListener("click", () => this.stopWebcam());
    }
  },

  async loadSamplesGallery() {
    try {
      const res = await fetch("/api/samples");
      const data = await res.json();
      const container = document.getElementById("samplePassbooksGrid");
      if (!container || !data.samples) return;

      container.innerHTML = data.samples.map(s => `
        <div class="sample-card ${s.id}" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span class="bank-tag">${s.id.toUpperCase()}</span>
              <a href="${s.image_url}" download="${s.id}_passbook.png" title="Download sample image to test upload" class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:0.72rem; text-decoration:none;" onclick="event.stopPropagation();">
                📥 Download
              </a>
            </div>
            <div class="sample-card-holder">${s.account_holder}</div>
            <div class="sample-card-acc">${s.bank_name}</div>
          </div>
          <button class="btn btn-primary btn-sm" style="margin-top:0.75rem; width:100%; font-size:0.78rem;" onclick="OCRClient.loadSample('${s.id}')">
            ⚡ 1-Click Scan
          </button>
        </div>
      `).join("");
    } catch (e) {
      console.error("Failed to load sample gallery", e);
    }
  },

  showOCRStatus(message) {
    const statusBox = document.getElementById("ocrStatusBox");
    const statusText = document.getElementById("ocrStatusText");
    if (statusBox && statusText) {
      statusText.innerHTML = message;
      statusBox.style.display = "flex";
    }
  },

  hideOCRStatus() {
    const statusBox = document.getElementById("ocrStatusBox");
    if (statusBox) statusBox.style.display = "none";
  },

  async handleFileUpload(file) {
    if (!file) return;
    this.isProcessing = true;
    this.showOCRStatus('<span class="spinner"></span> Reading Passbook Image & Preprocessing (OpenCV)...');

    // Display image preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      this.displayPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setTimeout(() => {
        this.showOCRStatus('<span class="spinner"></span> Windows Media OCR Running & Extracting Entities...');
      }, 500);

      const res = await fetch("/api/ocr/scan", {
        method: "POST",
        headers: Security.getAuthHeader(),
        body: formData
      });

      const result = await res.json();
      if (res.ok && result.success) {
        this.onOCRSuccess(result);
      } else {
        alert(result.detail || result.error || "OCR failed to process passbook.");
      }
    } catch (err) {
      alert("Error uploading and processing passbook.");
    } finally {
      this.isProcessing = false;
      this.hideOCRStatus();
    }
  },

  async loadSample(sampleId) {
    this.isProcessing = true;
    this.showOCRStatus(`<span class="spinner"></span> Loading & Scanning ${sampleId.toUpperCase()} Passbook with Native OCR...`);
    
    // Display preview of sample
    this.displayPreview(`/static/samples/${sampleId}_passbook.png`);

    try {
      const res = await fetch(`/api/samples/load/${sampleId}`, {
        method: "POST",
        headers: Security.getAuthHeader()
      });

      const result = await res.json();
      if (res.ok && result.success) {
        this.onOCRSuccess(result);
      } else {
        alert(result.detail || "Failed to load sample passbook.");
      }
    } catch (e) {
      alert("Error loading sample passbook.");
    } finally {
      this.isProcessing = false;
      this.hideOCRStatus();
    }
  },

  onOCRSuccess(result) {
    const profile = result.data;
    if (window.App) {
      window.App.setProfile(profile);
      window.App.renderProfile();
      // Render raw lines preview
      window.App.renderRawOcrLines(result.lines || []);
      // Switch tab to Review & Forms
      window.App.notifySuccess(`Passbook scanned successfully in ${result.processing_time_ms} ms! Bank: ${profile.bank_name || 'Detected'}`);
    }
  },

  displayPreview(src) {
    const container = document.getElementById("passbookPreviewContainer");
    const img = document.getElementById("passbookPreviewImg");
    const placeholder = document.getElementById("passbookPreviewPlaceholder");
    if (img && container) {
      img.src = src;
      img.style.display = "block";
      if (placeholder) placeholder.style.display = "none";
    }
  },

  // Webcam Capture
  async startWebcam() {
    const modal = document.getElementById("webcamModal");
    const video = document.getElementById("webcamVideo");
    try {
      this.webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "environment" }
      });
      video.srcObject = this.webcamStream;
      modal.classList.add("active");
    } catch (err) {
      alert("Unable to access camera. Please allow camera permissions or upload an image.");
    }
  },

  captureWebcamPhoto() {
    const video = document.getElementById("webcamVideo");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], "webcam_passbook.png", { type: "image/png" });
      this.stopWebcam();
      this.handleFileUpload(file);
    }, "image/png");
  },

  stopWebcam() {
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => track.stop());
      this.webcamStream = null;
    }
    const modal = document.getElementById("webcamModal");
    if (modal) modal.classList.remove("active");
  }
};
