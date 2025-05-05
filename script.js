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
     * In a real implementation, this would call an AI service
     * For demo purposes, we'll simulate the process with a timeout
     */
    function generateBabyFace() {
        // Show loading indicator
        loadingIndicator.hidden = false;
        generateButton.disabled = true;
        
        // Simulate processing time (3 seconds)
        setTimeout(function() {
            // In a real implementation, this would be replaced with actual AI processing
            // For demo, we'll simulate by creating a blended image effect
            simulateImageProcessing();
            
            // Hide loading indicator
            loadingIndicator.hidden = true;
            generateButton.disabled = false;
        }, 3000);
    }
    
    /**
     * Simulate image processing by creating a more sophisticated blend
     * This is a more advanced simulation, but a real implementation would use AI
     */
    function simulateImageProcessing() {
        // Create a canvas to blend the images
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = 400;
        canvas.height = 400;
        
        // Draw father's image with transformations
        ctx.save();
        ctx.globalAlpha = 0.6;
        // Apply slight scaling to father's features (70%)
        ctx.drawImage(fatherPreview, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Draw mother's image with transformations
        ctx.save();
        ctx.globalAlpha = 0.7;
        // Apply slight scaling to mother's features (80%)
        ctx.drawImage(motherPreview, 0, 0, canvas.width, canvas.height);
        ctx.restore();
        
        // Create a temporary canvas for additional processing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Copy the blended image to the temporary canvas
        tempCtx.drawImage(canvas, 0, 0);
        
        // Apply softening effect (simulating baby's softer features)
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.filter = 'blur(2px)';
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
        
        // Apply color adjustments and other effects to make it look more like a baby
        ctx.save();
        // Brighten the image and increase saturation slightly
        ctx.filter = 'brightness(1.1) saturate(0.9) contrast(0.85)';
        ctx.globalAlpha = 0.8;
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
        
        // Apply final adjustments
        ctx.save();
        // Soften the image more with a subtle blur and color adjustment
        ctx.filter = 'brightness(1.05) blur(0.5px)';
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.7;
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
        
        // Set the result as baby's image
        babyPreview.src = canvas.toDataURL('image/jpeg');
        
        // Add some animation for the reveal
        babyPreview.style.transition = 'all 0.8s ease';
        babyPreview.style.transform = 'scale(1.05)';
        setTimeout(() => {
            babyPreview.style.transform = 'scale(1)';
        }, 800);
    }
    
    /**
     * Mobile navigation toggle
     */
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