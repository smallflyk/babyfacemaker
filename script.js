/**
 * BabyFaceMaker.pro - Main JavaScript
 * Handles photo uploads and baby face generation
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fatherInput = document.getElementById('father-input');
    const motherInput = document.getElementById('mother-input');
    const fatherPreview = document.getElementById('father-image');
    const motherPreview = document.getElementById('mother-image');
    const babyPreview = document.getElementById('baby-image');
    const generateButton = document.getElementById('generate-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // 创建图像处理Worker
    let imageProcessor = null;
    try {
        imageProcessor = new Worker('imageProcessor.worker.js');
        
        // 监听Worker消息
        imageProcessor.addEventListener('message', handleWorkerMessage);
    } catch (error) {
        console.error("Web Worker创建失败，将使用主线程处理:", error);
    }
    
    // Track upload status
    let fatherUploaded = false;
    let motherUploaded = false;
    
    // Event Listeners
    fatherInput.addEventListener('change', function(e) {
        handleImageUpload(e, fatherPreview, 'father');
    });
    
    motherInput.addEventListener('change', function(e) {
        handleImageUpload(e, motherPreview, 'mother');
    });
    
    generateButton.addEventListener('click', generateBabyFace);
    
    /**
     * Handle image upload and preview
     * @param {Event} event - Input change event
     * @param {HTMLImageElement} previewElement - Image element to display preview
     * @param {string} parent - Parent type ('father' or 'mother')
     */
    function handleImageUpload(event, previewElement, parent) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file.');
            return;
        }
        
        // File size validation (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should not exceed 5MB.');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            // Hide the SVG placeholder and show the actual image
            const svgId = `${parent}-image-svg`;
            const svgElement = document.getElementById(svgId);
            if (svgElement) {
                svgElement.style.display = 'none';
            }
            
            // Show and update the image element
            previewElement.style.display = 'block';
            previewElement.src = e.target.result;
            
            // Update upload status
            if (parent === 'father') {
                fatherUploaded = true;
            } else if (parent === 'mother') {
                motherUploaded = true;
            }
            
            // Enable generate button if both photos are uploaded
            if (fatherUploaded && motherUploaded) {
                generateButton.disabled = false;
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Generate baby face from parent photos
     */
    function generateBabyFace() {
        try {
            // Show loading indicator
            loadingIndicator.hidden = false;
            generateButton.disabled = true;
            
            // Hide SVG placeholder for baby
            const babySvg = document.getElementById('baby-image-svg');
            if (babySvg) {
                babySvg.style.display = 'none';
            }
            
            // Make sure baby image element is visible
            babyPreview.style.display = 'block';
            
            // 如果支持Web Worker，使用Worker处理
            if (imageProcessor) {
                processWithWorker();
            } else {
                // 使用主线程处理（模拟API处理时间）
                setTimeout(function() {
                    try {
                        advancedBabyFaceGeneration();
                    } catch (error) {
                        handleProcessingError(error);
                    }
                    
                    // Hide loading indicator
                    loadingIndicator.hidden = true;
                    generateButton.disabled = false;
                }, 3500);
            }
        } catch (error) {
            console.error("Error in generate baby face function:", error);
            loadingIndicator.hidden = true;
            generateButton.disabled = false;
        }
    }
    
    /**
     * 使用Web Worker处理图像
     */
    function processWithWorker() {
        // 创建两个Canvas来获取图像数据
        const fatherCanvas = document.createElement('canvas');
        const fatherCtx = fatherCanvas.getContext('2d');
        fatherCanvas.width = 400;
        fatherCanvas.height = 400;
        
        const motherCanvas = document.createElement('canvas');
        const motherCtx = motherCanvas.getContext('2d');
        motherCanvas.width = 400;
        motherCanvas.height = 400;
        
        // 确保图像已加载
        if (!fatherPreview.complete || !motherPreview.complete || 
            fatherPreview.naturalWidth === 0 || motherPreview.naturalWidth === 0) {
            throw new Error("父母图像未完全加载");
        }
        
        // 绘制父母图像到Canvas
        try {
            fatherCtx.drawImage(fatherPreview, 0, 0, 400, 400);
            motherCtx.drawImage(motherPreview, 0, 0, 400, 400);
        } catch (error) {
            console.error("绘制父母图像时出错:", error);
            throw new Error("处理父母图像失败");
        }
        
        // 获取图像数据
        const fatherImageData = fatherCtx.getImageData(0, 0, 400, 400);
        const motherImageData = motherCtx.getImageData(0, 0, 400, 400);
        
        // 发送数据到Worker处理
        imageProcessor.postMessage({
            type: 'processBabyFace',
            fatherImageData: fatherImageData,
            motherImageData: motherImageData
        });
    }
    
    /**
     * 处理Worker返回的消息
     */
    function handleWorkerMessage(e) {
        const data = e.data;
        
        if (data.type === 'processingComplete' && data.success) {
            // 获取处理后的图像数据
            const resultImageData = data.resultImageData;
            
            // 创建Canvas显示结果
            const resultCanvas = document.createElement('canvas');
            const resultCtx = resultCanvas.getContext('2d');
            resultCanvas.width = resultImageData.width;
            resultCanvas.height = resultImageData.height;
            
            // 创建新的ImageData对象
            const imageData = new ImageData(
                new Uint8ClampedArray(resultImageData.data), 
                resultImageData.width, 
                resultImageData.height
            );
            
            // 绘制处理后的图像
            resultCtx.putImageData(imageData, 0, 0);
            
            // 设置结果为baby图像
            babyPreview.style.display = 'block';
            babyPreview.src = resultCanvas.toDataURL('image/jpeg');
            
            // 添加动画效果
            babyPreview.style.transition = 'all 1s ease';
            babyPreview.style.transform = 'scale(1.08)';
            setTimeout(() => {
                babyPreview.style.transform = 'scale(1)';
            }, 900);
        }
        else if (data.type === 'processingError' || !data.success) {
            handleProcessingError(new Error(data.error || "处理失败"));
        }
        
        // 隐藏加载指示器
        loadingIndicator.hidden = true;
        generateButton.disabled = false;
    }
    
    /**
     * 处理图像处理错误
     */
    function handleProcessingError(error) {
        console.error("生成婴儿面孔时出错:", error);
        alert("生成婴儿面孔时出错。请尝试上传不同的照片。");
        
        // 如果出错，显示SVG占位符
        const babySvg = document.getElementById('baby-image-svg');
        if (babySvg) {
            babySvg.style.display = 'block';
        }
        babyPreview.style.display = 'none';
    }
    
    // 以下是原始的图像处理函数，当Web Worker不可用时使用
    
    /**
     * Advanced baby face generation that creates a realistic baby face
     * Uses complex morphing techniques to generate a baby-like appearance
     */
    function advancedBabyFaceGeneration() {
        // Create work canvases
        const resultCanvas = document.createElement('canvas');
        const resultCtx = resultCanvas.getContext('2d');
        resultCanvas.width = 400;
        resultCanvas.height = 400;
        
        // Create separate source canvases
        const fatherCanvas = document.createElement('canvas');
        const fatherCtx = fatherCanvas.getContext('2d');
        fatherCanvas.width = 400;
        fatherCanvas.height = 400;
        
        const motherCanvas = document.createElement('canvas');
        const motherCtx = motherCanvas.getContext('2d');
        motherCanvas.width = 400;
        motherCanvas.height = 400;
        
        // Safety check: ensure images are loaded
        if (!fatherPreview.complete || !motherPreview.complete || 
            fatherPreview.naturalWidth === 0 || motherPreview.naturalWidth === 0) {
            throw new Error("Parent images not fully loaded");
        }
        
        // Draw parent images
        try {
            fatherCtx.drawImage(fatherPreview, 0, 0, 400, 400);
            motherCtx.drawImage(motherPreview, 0, 0, 400, 400);
        } catch (error) {
            console.error("Error drawing parent images:", error);
            throw new Error("Failed to process parent images");
        }
        
        // Start with a clean baby canvas
        resultCtx.fillStyle = '#ffffff';
        resultCtx.fillRect(0, 0, 400, 400);
        
        // Create baby features canvas
        const babyCanvas = document.createElement('canvas');
        const babyCtx = babyCanvas.getContext('2d');
        babyCanvas.width = 400;
        babyCanvas.height = 400;
        
        // Process the images and generate baby face
        processParentImage(fatherCtx, 0.3);
        processParentImage(motherCtx, 0.2);
        createBabyFacialStructure(babyCtx, fatherCanvas, motherCanvas);
        applyBabyTransformations(babyCtx);
        resultCtx.drawImage(babyCanvas, 0, 0);
        applyFinalEnhancements(resultCtx);
        
        // Set the final result as baby image
        babyPreview.style.display = 'block';
        babyPreview.src = resultCanvas.toDataURL('image/jpeg');
        
        // Add animation effect
        babyPreview.style.transition = 'all 1s ease';
        babyPreview.style.transform = 'scale(1.08)';
        setTimeout(() => {
            babyPreview.style.transform = 'scale(1)';
        }, 900);
    }
    
    /**
     * Process parent image to extract key features and prepare for morphing
     * @param {CanvasRenderingContext2D} ctx - Canvas context with parent image
     * @param {number} blurAmount - Amount of blur to apply (0.0-1.0)
     */
    function processParentImage(ctx, blurAmount) {
        // Apply a series of transformations to extract features
        const imgData = ctx.getImageData(0, 0, 400, 400);
        
        // Apply a moderate blur to soften features
        blurAmount = Math.max(0, Math.min(1, blurAmount)) * 10; // Scale to 0-10 range
        applyBlur(imgData.data, blurAmount, 400);
        
        // Brighten the image slightly
        adjustBrightness(imgData.data, 15);
        
        // Apply the processed data back to canvas
        ctx.putImageData(imgData, 0, 0);
    }
    
    /**
     * Creates the basic baby facial structure by morphing parent features
     * @param {CanvasRenderingContext2D} babyCtx - Canvas context for baby face
     * @param {HTMLCanvasElement} fatherCanvas - Father's processed image
     * @param {HTMLCanvasElement} motherCanvas - Mother's processed image
     */
    function createBabyFacialStructure(babyCtx, fatherCanvas, motherCanvas) {
        // Use facial feature map to build baby's face with adjusted proportions
        // This simulates the way genes are combined, with different features inheriting differently
        
        // Clear the baby canvas
        babyCtx.clearRect(0, 0, 400, 400);
        
        // Create a baby face structure with larger head proportions (characteristic of infants)
        
        // 1. First, create a base baby face shape
        // Draw a soft oval background slightly larger than adult proportions for baby's head
        babyCtx.save();
        babyCtx.fillStyle = '#fff5f1'; // Slight pink-ish white for baby skin tone base
        babyCtx.beginPath();
        babyCtx.ellipse(200, 200, 180, 200, 0, 0, Math.PI * 2);
        babyCtx.fill();
        babyCtx.restore();
        
        // 2. Create a working canvas for blending features
        const workCanvas = document.createElement('canvas');
        const workCtx = workCanvas.getContext('2d');
        workCanvas.width = 400;
        workCanvas.height = 400;
        
        // 3. Define the regions and inheritance ratios
        const regions = [
            // Format: [srcX, srcY, srcWidth, srcHeight, destX, destY, destWidth, destHeight, fatherRatio, description]
            // Apply baby proportions: bigger eyes, smaller nose and mouth, larger forehead
            
            // Eyes region (enlarged by 10% for baby-like appearance)
            [130, 120, 60, 40, 125, 140, 66, 44, 0.4, "left eye"],  // Left eye (slightly more mother)
            [210, 120, 60, 40, 205, 140, 66, 44, 0.4, "right eye"], // Right eye (slightly more mother)
            
            // Nose region (reduced by 15% for baby-like appearance)
            [170, 180, 60, 50, 170, 190, 51, 42, 0.5, "nose"],  // Perfectly balanced
            
            // Mouth region (reduced by 20% for baby-like appearance)
            [150, 240, 100, 40, 150, 240, 80, 32, 0.6, "mouth"], // Slightly more father
            
            // Cheeks (enlarged for baby-like chubbiness)
            [100, 180, 70, 60, 90, 190, 85, 70, 0.45, "left cheek"],  // Left cheek
            [230, 180, 70, 60, 225, 190, 85, 70, 0.45, "right cheek"], // Right cheek
            
            // Forehead (enlarged for baby-like proportions)
            [150, 80, 100, 60, 145, 65, 110, 70, 0.4, "forehead"], // More mother
            
            // Chin (reduced for baby-like appearance)
            [170, 270, 60, 40, 170, 270, 50, 30, 0.7, "chin"] // More father
        ];
        
        // 4. Blend features from both parents with transformations for baby appearance
        regions.forEach(region => {
            const [srcX, srcY, srcW, srcH, destX, destY, destW, destH, fatherRatio, desc] = region;
            
            // Clear work canvas
            workCtx.clearRect(0, 0, 400, 400);
            
            // Draw father's feature with appropriate weight
            workCtx.globalAlpha = fatherRatio;
            workCtx.drawImage(fatherCanvas, srcX, srcY, srcW, srcH, 0, 0, destW, destH);
            
            // Draw mother's feature with appropriate weight
            workCtx.globalAlpha = 1 - fatherRatio;
            workCtx.drawImage(motherCanvas, srcX, srcY, srcW, srcH, 0, 0, destW, destH);
            
            // Apply baby-specific transformations to this feature
            const featureData = workCtx.getImageData(0, 0, destW, destH);
            
            // Apply feature-specific enhancements
            if (desc.includes("eye")) {
                // Enlarge pupils slightly, brighten eyes
                brightenRegion(featureData.data, 20);
            } 
            else if (desc.includes("cheek")) {
                // Add subtle pink hue to cheeks
                addPinkTint(featureData.data, 0.15);
            }
            else if (desc === "mouth") {
                // Make lips slightly rosier
                addPinkTint(featureData.data, 0.2);
                // Make smaller for baby proportion
                featureData.data = scaleRegion(featureData.data, 0.9, destW, destH);
            }
            
            // Apply processed feature data back to work canvas
            workCtx.putImageData(featureData, 0, 0);
            
            // Draw the processed feature to baby canvas
            babyCtx.drawImage(workCanvas, 0, 0, destW, destH, destX, destY, destW, destH);
        });
        
        // 5. Apply a global treatment to smooth transitions between regions
        const babyFaceData = babyCtx.getImageData(0, 0, 400, 400);
        applyBlur(babyFaceData.data, 1, 400); // Very light blur to blend features
        babyCtx.putImageData(babyFaceData, 0, 0);
    }
    
    /**
     * Apply baby-specific transformations to the created face
     * @param {CanvasRenderingContext2D} ctx - Canvas context with baby face
     */
    function applyBabyTransformations(ctx) {
        // Get the current image data
        const imgData = ctx.getImageData(0, 0, 400, 400);
        
        // 1. Apply baby skin color adjustments
        adjustBabySkinTone(imgData.data);
        
        // 2. Soften the overall image for baby skin texture
        applyBlur(imgData.data, 1.8, 400);
        
        // 3. Enhance facial highlights for a more 3D baby face look
        enhanceFacialHighlights(imgData.data, 400);
        
        // Apply the processed image back to the canvas
        ctx.putImageData(imgData, 0, 0);
        
        // 4. Apply image processing filters that can't be done pixel by pixel
        ctx.save();
        ctx.filter = 'brightness(1.1) contrast(0.92) saturate(0.95)';
        ctx.globalAlpha = 0.85;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
    }
    
    /**
     * Apply final enhancements to the baby image
     * @param {CanvasRenderingContext2D} ctx - Canvas context with final baby image
     */
    function applyFinalEnhancements(ctx) {
        // 1. Apply a subtle glow effect
        ctx.save();
        ctx.filter = 'brightness(1.05) blur(0.8px)';
        ctx.globalAlpha = 0.3;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.restore();
        
        // 2. Apply a subtle vignette for aesthetic enhancement
        const width = 400;
        const height = 400;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.8;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.5,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        
        // 3. Add a subtle, warm highlight to simulate soft baby skin
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(255, 253, 240, 0.2)';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    /**
     * Adjusts the skin tone to be more baby-like
     * @param {Uint8ClampedArray} data - Image data to modify
     */
    function adjustBabySkinTone(data) {
        for (let i = 0; i < data.length; i += 4) {
            // Skip transparent pixels
            if (data[i + 3] === 0) continue;
            
            // Calculate luminosity to identify skin pixels
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const luminosity = (0.299 * r + 0.587 * g + 0.114 * b);
            
            // Focus on mid-tones which are likely skin
            if (luminosity > 80 && luminosity < 200) {
                // Make skin slightly pinker and brighter (baby-like)
                data[i] = Math.min(255, r * 1.08);          // Increase red
                data[i + 1] = Math.min(255, g * 1.02);      // Slight increase in green
                data[i + 2] = Math.min(255, b * 1.04);      // Slight increase in blue
            }
        }
    }
    
    /**
     * Enhances facial highlights to create more depth and baby-like roundness
     * @param {Uint8ClampedArray} data - Image data to modify
     * @param {number} width - Image width
     */
    function enhanceFacialHighlights(data, width) {
        // Create a copy of the data
        const tempData = new Uint8ClampedArray(data);
        const height = data.length / 4 / width;
        
        // Apply a custom highlight enhancement filter
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // Calculate local contrast
                const centerLuminosity = (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
                
                // Get surrounding pixels
                const topIdx = ((y - 1) * width + x) * 4;
                const topLuminosity = (tempData[topIdx] + tempData[topIdx + 1] + tempData[topIdx + 2]) / 3;
                
                const bottomIdx = ((y + 1) * width + x) * 4;
                const bottomLuminosity = (tempData[bottomIdx] + tempData[bottomIdx + 1] + tempData[bottomIdx + 2]) / 3;
                
                // If this is a highlight (brighter than pixels below it)
                if (centerLuminosity > bottomLuminosity + 10) {
                    // Enhance highlight
                    data[idx] = Math.min(255, tempData[idx] * 1.1);
                    data[idx + 1] = Math.min(255, tempData[idx + 1] * 1.1);
                    data[idx + 2] = Math.min(255, tempData[idx + 2] * 1.1);
                }
                // If this is a shadow (darker than pixels above it)
                else if (centerLuminosity < topLuminosity - 10) {
                    // Soften shadow - babies have less pronounced shadows
                    data[idx] = Math.min(255, tempData[idx] * 1.05);
                    data[idx + 1] = Math.min(255, tempData[idx + 1] * 1.05);
                    data[idx + 2] = Math.min(255, tempData[idx + 2] * 1.05);
                }
            }
        }
    }
    
    /**
     * Apply a simple box blur to image data
     * @param {Uint8ClampedArray} data - Image data to blur
     * @param {number} radius - Blur radius
     * @param {number} width - Image width
     */
    function applyBlur(data, radius, width) {
        // Create a copy of the data
        const tempData = new Uint8ClampedArray(data);
        const height = data.length / 4 / width;
        
        // Simple box blur implementation
        const size = Math.floor(radius);
        if (size <= 0) return;
        
        for (let y = size; y < height - size; y++) {
            for (let x = size; x < width - size; x++) {
                const idx = (y * width + x) * 4;
                
                // For each channel (R,G,B)
                for (let c = 0; c < 3; c++) {
                    let sum = 0;
                    let count = 0;
                    
                    // Sample neighborhood
                    for (let ky = -size; ky <= size; ky++) {
                        for (let kx = -size; kx <= size; kx++) {
                            const sampleIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                            sum += tempData[sampleIdx];
                            count++;
                        }
                    }
                    
                    // Average
                    data[idx + c] = Math.round(sum / count);
                }
            }
        }
    }
    
    /**
     * Adjust brightness of image data
     * @param {Uint8ClampedArray} data - Image data to modify
     * @param {number} amount - Brightness adjustment amount
     */
    function adjustBrightness(data, amount) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] + amount);
            data[i + 1] = Math.min(255, data[i + 1] + amount);
            data[i + 2] = Math.min(255, data[i + 2] + amount);
        }
    }
    
    /**
     * Add a pink tint to a region (for cheeks and lips)
     * @param {Uint8ClampedArray} data - Image data to modify
     * @param {number} amount - Amount of pink tint (0-1)
     */
    function addPinkTint(data, amount) {
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue; // Skip transparent pixels
            
            // Add pink tint by increasing red and slightly reducing green/blue
            data[i] = Math.min(255, data[i] + amount * 50);            // More red
            data[i + 1] = Math.max(0, data[i + 1] - amount * 10);      // Less green
            data[i + 2] = Math.max(0, data[i + 2] - amount * 5);       // Slightly less blue
        }
    }
    
    /**
     * Brighten a specific region
     * @param {Uint8ClampedArray} data - Image data to modify
     * @param {number} amount - Brightness amount
     */
    function brightenRegion(data, amount) {
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue; // Skip transparent pixels
            
            data[i] = Math.min(255, data[i] + amount);
            data[i + 1] = Math.min(255, data[i + 1] + amount);
            data[i + 2] = Math.min(255, data[i + 2] + amount);
        }
    }
    
    /**
     * Scale a region (currently a stub - would require more complex implementation)
     * @param {Uint8ClampedArray} data - Image data
     * @param {number} scale - Scale factor
     * @param {number} width - Region width
     * @param {number} height - Region height
     * @returns {Uint8ClampedArray} - Scaled data (simplified implementation)
     */
    function scaleRegion(data, scale, width, height) {
        // For simplicity in this demo, we'll just return the original data
        // A real implementation would scale the region properly
        return data;
    }
    
    // Mobile navigation toggle
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<span></span><span></span><span></span>';
    
    const nav = document.querySelector('nav');
    const headerContainer = document.querySelector('header .container');
    
    // Only add mobile menu for smaller screens
    if (window.innerWidth <= 768) {
        headerContainer.appendChild(menuToggle);
        nav.classList.add('mobile-hidden');
        
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('mobile-hidden');
            menuToggle.classList.toggle('active');
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (!headerContainer.contains(menuToggle)) {
                headerContainer.appendChild(menuToggle);
                nav.classList.add('mobile-hidden');
            }
        } else {
            if (headerContainer.contains(menuToggle)) {
                headerContainer.removeChild(menuToggle);
                nav.classList.remove('mobile-hidden');
            }
        }
    });
    
    // Add smooth scrolling to all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                if (nav.classList.contains('mobile-hidden') === false) {
                    nav.classList.add('mobile-hidden');
                    menuToggle.classList.remove('active');
                }
                
                // Scroll to target
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add additional styles for mobile menu
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .menu-toggle {
                display: block;
                background: none;
                border: none;
                cursor: pointer;
                padding: 10px;
                z-index: 100;
            }
            
            .menu-toggle span {
                display: block;
                width: 25px;
                height: 3px;
                background-color: var(--text-color);
                margin: 5px 0;
                transition: all 0.3s ease;
            }
            
            .menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(5px, -5px);
            }
            
            nav.mobile-hidden {
                display: none;
            }
            
            nav {
                position: absolute;
                top: 60px;
                left: 0;
                width: 100%;
                background-color: var(--white);
                box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
                padding: 20px;
            }
            
            nav ul {
                flex-direction: column;
                align-items: center;
            }
            
            nav ul li {
                margin: 10px 0;
            }
        }
    `;
    document.head.appendChild(style);
}); 