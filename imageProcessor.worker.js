/**
 * BabyFaceMaker.pro - Image Processing Web Worker
 * 处理繁重的图像计算工作，避免阻塞主线程
 */

// 接收来自主线程的消息
self.addEventListener('message', function(e) {
    const data = e.data;
    
    if (data.type === 'processBabyFace') {
        try {
            // 开始处理父母图像数据
            const result = processBabyFace(data.fatherImageData, data.motherImageData);
            
            // 处理完成后向主线程发送结果
            self.postMessage({
                type: 'processingComplete',
                resultImageData: result,
                success: true
            });
        } catch (error) {
            // 发送错误信息回主线程
            self.postMessage({
                type: 'processingError',
                error: error.message,
                success: false
            });
        }
    }
});

/**
 * 处理父母图像数据生成婴儿面孔
 * @param {ImageData} fatherImageData - 父亲图像数据
 * @param {ImageData} motherImageData - 母亲图像数据
 * @returns {ImageData} - 生成的婴儿图像数据
 */
function processBabyFace(fatherImageData, motherImageData) {
    // 创建结果图像数据
    const resultData = new Uint8ClampedArray(fatherImageData.data.length);
    
    // 基础混合比例
    const regions = [
        // [x起点, y起点, 宽度, 高度, 父亲比例, 描述]
        [130, 120, 60, 40, 0.4, "左眼"],  // 左眼 (偏向母亲)
        [210, 120, 60, 40, 0.4, "右眼"],  // 右眼 (偏向母亲)
        [170, 180, 60, 50, 0.5, "鼻子"],  // 鼻子 (平衡)
        [150, 240, 100, 40, 0.6, "嘴巴"], // 嘴巴 (偏向父亲)
        [100, 180, 70, 60, 0.45, "左脸颊"], // 左脸颊
        [230, 180, 70, 60, 0.45, "右脸颊"], // 右脸颊
        [150, 80, 100, 60, 0.4, "额头"],   // 额头 (偏向母亲)
        [170, 270, 60, 40, 0.7, "下巴"]    // 下巴 (偏向父亲)
    ];
    
    // 图像尺寸
    const width = 400;
    const height = 400;
    
    // 清空结果画布 (白色背景)
    for (let i = 0; i < resultData.length; i += 4) {
        resultData[i] = 255;     // 红
        resultData[i + 1] = 255; // 绿
        resultData[i + 2] = 255; // 蓝
        resultData[i + 3] = 255; // 透明度
    }
    
    // 混合父母特征
    blendParentFeatures(fatherImageData.data, motherImageData.data, resultData, regions, width, height);
    
    // 应用婴儿特定调整
    applyBabyTransformations(resultData, width, height);
    
    // 添加最终增强效果
    applyFinalEnhancements(resultData, width, height);
    
    // 创建并返回结果ImageData
    return {
        data: resultData,
        width: width,
        height: height
    };
}

/**
 * 混合父母特征
 * @param {Uint8ClampedArray} fatherData - 父亲图像数据
 * @param {Uint8ClampedArray} motherData - 母亲图像数据
 * @param {Uint8ClampedArray} resultData - 结果图像数据
 * @param {Array} regions - 面部区域及混合比例
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 */
function blendParentFeatures(fatherData, motherData, resultData, regions, width, height) {
    // 对每个面部区域进行处理
    regions.forEach(region => {
        const [startX, startY, regWidth, regHeight, fatherRatio, desc] = region;
        
        // 婴儿调整的比例 (婴儿特征的缩放)
        let babyScaleW = 1.0, babyScaleH = 1.0;
        
        // 根据不同的面部特征调整婴儿的比例
        if (desc.includes("眼")) {
            // 婴儿眼睛相对更大
            babyScaleW = 1.1;
            babyScaleH = 1.1;
        } else if (desc === "鼻子") {
            // 婴儿鼻子相对更小
            babyScaleW = 0.85;
            babyScaleH = 0.85;
        } else if (desc === "嘴巴") {
            // 婴儿嘴巴相对更小
            babyScaleW = 0.8;
            babyScaleH = 0.8;
        } else if (desc === "额头") {
            // 婴儿额头相对更大
            babyScaleW = 1.1;
            babyScaleH = 1.1;
        } else if (desc === "下巴") {
            // 婴儿下巴相对更小
            babyScaleW = 0.8;
            babyScaleH = 0.8;
        }
        
        // 计算调整后的区域尺寸
        const adjustedWidth = Math.floor(regWidth * babyScaleW);
        const adjustedHeight = Math.floor(regHeight * babyScaleH);
        
        // 计算偏移量，确保特征居中
        const offsetX = Math.floor((regWidth - adjustedWidth) / 2);
        const offsetY = Math.floor((regHeight - adjustedHeight) / 2);
        
        // 混合父母特征到调整后的区域
        for (let y = 0; y < adjustedHeight; y++) {
            for (let x = 0; x < adjustedWidth; x++) {
                // 源区域坐标
                const srcX = startX + x;
                const srcY = startY + y;
                
                // 目标区域坐标 (应用偏移)
                const destX = startX + offsetX + x;
                const destY = startY + offsetY + y;
                
                // 确保坐标在图像范围内
                if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height &&
                    destX >= 0 && destX < width && destY >= 0 && destY < height) {
                    // 计算像素索引
                    const srcIdx = (srcY * width + srcX) * 4;
                    const destIdx = (destY * width + destX) * 4;
                    
                    // 按比例混合父母特征
                    for (let c = 0; c < 3; c++) {
                        resultData[destIdx + c] = Math.round(
                            fatherData[srcIdx + c] * fatherRatio + 
                            motherData[srcIdx + c] * (1 - fatherRatio)
                        );
                    }
                    
                    // 设置透明度为不透明
                    resultData[destIdx + 3] = 255;
                }
            }
        }
        
        // 应用特征特定的调整
        applyFeatureSpecificEnhancements(resultData, startX, startY, adjustedWidth, adjustedHeight, width, desc);
    });
}

/**
 * 应用特征特定的增强效果
 * @param {Uint8ClampedArray} data - 图像数据
 * @param {number} startX - 区域起始X坐标
 * @param {number} startY - 区域起始Y坐标
 * @param {number} width - 区域宽度
 * @param {number} height - 区域高度
 * @param {number} imgWidth - 图像总宽度
 * @param {string} featureType - 特征类型
 */
function applyFeatureSpecificEnhancements(data, startX, startY, width, height, imgWidth, featureType) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const destX = startX + x;
            const destY = startY + y;
            
            // 确保坐标在图像范围内
            if (destX >= 0 && destX < imgWidth && destY >= 0 && destY < imgWidth) {
                const idx = (destY * imgWidth + destX) * 4;
                
                // 根据不同特征应用特定增强
                if (featureType.includes("眼")) {
                    // 增亮眼睛
                    data[idx] = Math.min(255, data[idx] + 20);
                    data[idx + 1] = Math.min(255, data[idx + 1] + 20);
                    data[idx + 2] = Math.min(255, data[idx + 2] + 20);
                } 
                else if (featureType.includes("脸颊")) {
                    // 给脸颊添加粉红色调
                    data[idx] = Math.min(255, data[idx] + 15);     // 增加红色
                    data[idx + 1] = Math.max(0, data[idx + 1] - 5); // 减少绿色
                    data[idx + 2] = Math.max(0, data[idx + 2] - 2); // 略微减少蓝色
                }
                else if (featureType === "嘴巴") {
                    // 使嘴唇更粉红
                    data[idx] = Math.min(255, data[idx] + 20);     // 增加红色
                    data[idx + 1] = Math.max(0, data[idx + 1] - 10); // 减少绿色
                    data[idx + 2] = Math.max(0, data[idx + 2] - 5);  // 减少蓝色
                }
            }
        }
    }
}

/**
 * 应用婴儿特定的变换
 * @param {Uint8ClampedArray} data - 图像数据
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 */
function applyBabyTransformations(data, width, height) {
    // 调整婴儿肤色
    adjustBabySkinTone(data);
    
    // 应用轻微模糊效果，使皮肤更柔和
    applyBlur(data, 1.8, width);
    
    // 增强面部高光，使婴儿面部更立体
    enhanceFacialHighlights(data, width);
}

/**
 * 调整为婴儿肤色
 * @param {Uint8ClampedArray} data - 图像数据
 */
function adjustBabySkinTone(data) {
    for (let i = 0; i < data.length; i += 4) {
        // 跳过透明像素
        if (data[i + 3] === 0) continue;
        
        // 计算亮度识别皮肤像素
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const luminosity = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // 主要处理中间调，这些通常是皮肤
        if (luminosity > 80 && luminosity < 200) {
            // 使皮肤略微偏粉，更像婴儿
            data[i] = Math.min(255, r * 1.08);     // 增加红色
            data[i + 1] = Math.min(255, g * 1.02); // 略微增加绿色
            data[i + 2] = Math.min(255, b * 1.04); // 略微增加蓝色
        }
    }
}

/**
 * 增强面部高光
 * @param {Uint8ClampedArray} data - 图像数据
 * @param {number} width - 图像宽度
 */
function enhanceFacialHighlights(data, width) {
    // 创建数据副本
    const tempData = new Uint8ClampedArray(data);
    const height = data.length / 4 / width;
    
    // 应用高光增强滤镜
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            
            // 计算局部对比度
            const centerLuminosity = (tempData[idx] + tempData[idx + 1] + tempData[idx + 2]) / 3;
            
            // 获取周围像素
            const topIdx = ((y - 1) * width + x) * 4;
            const topLuminosity = (tempData[topIdx] + tempData[topIdx + 1] + tempData[topIdx + 2]) / 3;
            
            const bottomIdx = ((y + 1) * width + x) * 4;
            const bottomLuminosity = (tempData[bottomIdx] + tempData[bottomIdx + 1] + tempData[bottomIdx + 2]) / 3;
            
            // 如果这是高光（比下方像素亮）
            if (centerLuminosity > bottomLuminosity + 10) {
                // 增强高光
                data[idx] = Math.min(255, tempData[idx] * 1.1);
                data[idx + 1] = Math.min(255, tempData[idx + 1] * 1.1);
                data[idx + 2] = Math.min(255, tempData[idx + 2] * 1.1);
            }
            // 如果这是阴影（比上方像素暗）
            else if (centerLuminosity < topLuminosity - 10) {
                // 减弱阴影 - 婴儿面部阴影较弱
                data[idx] = Math.min(255, tempData[idx] * 1.05);
                data[idx + 1] = Math.min(255, tempData[idx + 1] * 1.05);
                data[idx + 2] = Math.min(255, tempData[idx + 2] * 1.05);
            }
        }
    }
}

/**
 * 应用最终增强效果
 * @param {Uint8ClampedArray} data - 图像数据
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 */
function applyFinalEnhancements(data, width, height) {
    // 添加温暖的高光，模拟柔和的婴儿皮肤
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue; // 跳过透明像素
        
        // 应用柔和的温暖色调
        data[i] = Math.min(255, data[i] + 5);     // 略微增加红色
        data[i + 1] = Math.min(255, data[i + 1] + 3); // 略微增加绿色
        data[i + 2] = Math.min(255, data[i + 2] + 1); // 略微增加蓝色
    }
}

/**
 * 应用简单的方框模糊
 * @param {Uint8ClampedArray} data - 图像数据
 * @param {number} radius - 模糊半径
 * @param {number} width - 图像宽度
 */
function applyBlur(data, radius, width) {
    // 创建数据副本
    const tempData = new Uint8ClampedArray(data);
    const height = data.length / 4 / width;
    
    // 简单的方框模糊实现
    const size = Math.floor(radius);
    if (size <= 0) return;
    
    for (let y = size; y < height - size; y++) {
        for (let x = size; x < width - size; x++) {
            const idx = (y * width + x) * 4;
            
            // 对每个通道 (R,G,B)
            for (let c = 0; c < 3; c++) {
                let sum = 0;
                let count = 0;
                
                // 采样邻域
                for (let ky = -size; ky <= size; ky++) {
                    for (let kx = -size; kx <= size; kx++) {
                        const sampleIdx = ((y + ky) * width + (x + kx)) * 4 + c;
                        sum += tempData[sampleIdx];
                        count++;
                    }
                }
                
                // 平均值
                data[idx + c] = Math.round(sum / count);
            }
        }
    }
} 