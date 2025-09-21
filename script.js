// Mathematical utility functions for Hill Cipher
function modInverse(a, m) {
    for (let i = 1; i < m; i++) {
        if ((a * i) % m === 1) {
            return i;
        }
    }
    return -1;
}

function determinantMod26(matrix) {
    const n = matrix.length;
    if (n === 1) return matrix[0][0] % 26;
    if (n === 2) {
        const det = (matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]) % 26;
        return det < 0 ? det + 26 : det;
    }
    
    let det = 0;
    for (let i = 0; i < n; i++) {
        const subMatrix = [];
        for (let j = 1; j < n; j++) {
            const row = [];
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    row.push(matrix[j][k]);
                }
            }
            subMatrix.push(row);
        }
        const sign = i % 2 === 0 ? 1 : -1;
        det += sign * matrix[0][i] * determinantMod26(subMatrix);
    }
    det = det % 26;
    return det < 0 ? det + 26 : det;
}

function matrixInverseMod26(matrix) {
    const n = matrix.length;
    const det = determinantMod26(matrix);
    const detInv = modInverse(det, 26);
    
    if (detInv === -1) {
        throw new Error("Matrix is not invertible (determinant has no inverse mod 26)");
    }
    
    const augmented = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            row.push(matrix[i][j]);
        }
        for (let j = 0; j < n; j++) {
            row.push(i === j ? 1 : 0);
        }
        augmented.push(row);
    }
    
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                maxRow = k;
            }
        }
        
        if (maxRow !== i) {
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
        }
        
        const pivot = augmented[i][i];
        const pivotInv = modInverse(pivot % 26, 26);
        if (pivotInv === -1) {
            throw new Error("Matrix is not invertible");
        }
        
        for (let j = 0; j < 2 * n; j++) {
            augmented[i][j] = (augmented[i][j] * pivotInv) % 26;
            if (augmented[i][j] < 0) augmented[i][j] += 26;
        }
        
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmented[k][i];
                for (let j = 0; j < 2 * n; j++) {
                    augmented[k][j] = (augmented[k][j] - factor * augmented[i][j]) % 26;
                    if (augmented[k][j] < 0) augmented[k][j] += 26;
                }
            }
        }
    }
    
    const inverse = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = n; j < 2 * n; j++) {
            row.push(augmented[i][j]);
        }
        inverse.push(row);
    }
    
    return inverse;
}

// Text processing functions
function textToNumbers(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '').split('').map(char => char.charCodeAt(0) - 65);
}

function numbersToText(numbers) {
    return numbers.map(num => String.fromCharCode(num + 65)).join('');
}

function matrixMultiply(vector, matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];
    
    for (let j = 0; j < cols; j++) {
        let sum = 0;
        for (let i = 0; i < rows; i++) {
            sum += vector[i] * matrix[i][j];
        }
        result.push(sum % 26);
    }
    
    return result;
}

// UI functions
function generateMatrixGrid(size) {
    const matrixGrid = document.getElementById('matrixGrid');
    matrixGrid.innerHTML = '';
    matrixGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'key-input';
            input.min = '0';
            input.max = '25';
            input.value = i === j ? '1' : '0';
            input.id = `matrix_${i}_${j}`;
            
            input.addEventListener('input', function() {
                let value = parseInt(this.value);
                if (isNaN(value) || value < 0) {
                    this.value = '0';
                } else if (value > 25) {
                    this.value = '25';
                }
            });
            
            matrixGrid.appendChild(input);
        }
    }
    
    // Set default values for 2x2 matrix
    if (size === 2) {
        document.getElementById('matrix_0_0').value = '3';
        document.getElementById('matrix_0_1').value = '2';
        document.getElementById('matrix_1_0').value = '5';
        document.getElementById('matrix_1_1').value = '7';
    }
}

function getKeyMatrix() {
    const size = parseInt(document.getElementById('matrixSize').value);
    const matrix = [];
    
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const input = document.getElementById(`matrix_${i}_${j}`);
            const value = parseInt(input.value) || 0;
            if (value < 0 || value > 25) {
                throw new Error(`Matrix value at position (${i+1},${j+1}) must be between 0-25`);
            }
            row.push(value);
        }
        matrix.push(row);
    }
    
    return matrix;
}

function showResult(title, text) {
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultText').textContent = text;
    document.getElementById('result').style.display = 'block';
    document.getElementById('error').style.display = 'none';
}

function showError(message) {
    document.getElementById('error').textContent = message;
    document.getElementById('error').style.display = 'block';
    document.getElementById('result').style.display = 'none';
}

// Copy to clipboard functionality
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent || element.value;
    
    if (navigator.clipboard && window.isSecureContext) {
        // Use modern clipboard API
        navigator.clipboard.writeText(text).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopyNotification();
        }
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopyNotification() {
    const notification = document.getElementById('copyNotification');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// Main cipher functions
function encryptText() {
    try {
        const text = document.getElementById('inputText').value;
        const keyMatrix = getKeyMatrix();
        
        if (!text.trim()) {
            showError("Please enter some plaintext to encrypt.");
            return;
        }
        
        const numbers = textToNumbers(text);
        const blockSize = keyMatrix.length;
        
        // Pad with X's if necessary
        while (numbers.length % blockSize !== 0) {
            numbers.push(23); // X = 23
        }
        
        let encrypted = [];
        
        for (let i = 0; i < numbers.length; i += blockSize) {
            const block = numbers.slice(i, i + blockSize);
            const encryptedBlock = matrixMultiply(block, keyMatrix);
            encrypted.push(...encryptedBlock);
        }
        
        const result = numbersToText(encrypted);
        showResult("🔒 Encrypted Result:", result);
        
    } catch (error) {
        showError("Encryption failed: " + error.message);
    }
}

function decryptText() {
    try {
        const text = document.getElementById('inputText').value;
        const keyMatrix = getKeyMatrix();
        
        if (!text.trim()) {
            showError("Please enter some ciphertext to decrypt.");
            return;
        }
        
        const numbers = textToNumbers(text);
        const blockSize = keyMatrix.length;
        
        if (numbers.length % blockSize !== 0) {
            showError(`Ciphertext length must be divisible by ${blockSize} for this matrix size.`);
            return;
        }
        
        const inverseMatrix = matrixInverseMod26(keyMatrix);
        let decrypted = [];
        
        for (let i = 0; i < numbers.length; i += blockSize) {
            const block = numbers.slice(i, i + blockSize);
            const decryptedBlock = matrixMultiply(block, inverseMatrix);
            decrypted.push(...decryptedBlock);
        }
        
        const result = numbersToText(decrypted);
        showResult("🔓 Decrypted Result:", result);
        
    } catch (error) {
        showError("Decryption failed: " + error.message);
    }
}

function updateMatrixSizeDisplay() {
    const size = parseInt(document.getElementById('matrixSize').value);
    document.getElementById('matrixSizeDisplay').textContent = size;
    generateMatrixGrid(size);
}

function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    const matrixSizeInput = document.getElementById('matrixSize');
    matrixSizeInput.addEventListener('input', updateMatrixSizeDisplay);
    generateMatrixGrid(2);
});