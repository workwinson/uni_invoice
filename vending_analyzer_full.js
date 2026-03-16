(function() {
    'use strict';
    
    window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('runtime.lastError')) {
            e.stopImmediatePropagation();
            return true;
        }
    }, true);
    
    function createSelectionDialog() {
        const clientList = [
            '基隆所', '台北所', '新店所', '桃園所', '中壢所', '新竹所',
            '台中所', '嘉義所', '彰化所', '台南所', '高雄所', '屏東所', 'all'
        ];
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
        `;
        
        dialog.innerHTML = `
            <style>
                .vending-dialog * {
                    box-sizing: border-box;
                    font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
                }
                .vending-dialog h2 {
                    margin: 0 0 20px 0;
                    color: #333;
                    font-size: 24px;
                    text-align: center;
                }
                .vending-dialog label {
                    display: block;
                    margin-bottom: 8px;
                    color: #555;
                    font-weight: bold;
                    font-size: 14px;
                }
                .vending-dialog select,
                .vending-dialog input {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    margin-bottom: 20px;
                    transition: border-color 0.3s;
                }
                .vending-dialog select:focus,
                .vending-dialog input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .vending-dialog .button-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 25px;
                }
                .vending-dialog button {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .vending-dialog .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .vending-dialog .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }
                .vending-dialog .btn-secondary {
                    background: #e0e0e0;
                    color: #666;
                }
                .vending-dialog .btn-secondary:hover {
                    background: #d0d0d0;
                }
                .vending-dialog .hint {
                    font-size: 12px;
                    color: #888;
                    margin-top: -15px;
                    margin-bottom: 20px;
                }
            </style>
            <div class="vending-dialog">
                <h2>🔍 機台分析工具</h2>
                
                <label for="clientSelect">選擇地點：</label>
                <select id="clientSelect">
                    <option value="">-- 請選擇 --</option>
                    ${clientList.map(name => `<option value="${name}">${name}</option>`).join('')}
                    <option value="custom">✏️ 自訂輸入...</option>
                </select>
                
                <div id="customInputGroup" style="display: none;">
                    <label for="customClient">自訂 Client Name：</label>
                    <input type="text" id="customClient" placeholder="請輸入 client_name">
                </div>
                
                <label for="dateSelect">選擇結束日期：</label>
                <input type="date" id="dateSelect" value="${new Date().toISOString().split('T')[0]}">
                <div class="hint">只分析結束時間符合此日期的機台</div>
                
                <div class="button-group">
                    <button class="btn-secondary" id="cancelBtn">取消</button>
                    <button class="btn-primary" id="confirmBtn">開始分析</button>
                </div>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const clientSelect = dialog.querySelector('#clientSelect');
        const customInputGroup = dialog.querySelector('#customInputGroup');
        const customClient = dialog.querySelector('#customClient');
        
        clientSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customInputGroup.style.display = 'block';
                customClient.focus();
            } else {
                customInputGroup.style.display = 'none';
            }
        });
        
        dialog.querySelector('#cancelBtn').addEventListener('click', function() {
            document.body.removeChild(overlay);
        });
        
        dialog.querySelector('#confirmBtn').addEventListener('click', function() {
            const selectedClient = clientSelect.value;
            const customValue = customClient.value.trim();
            const selectedDate = dialog.querySelector('#dateSelect').value;
            
            let finalClient = '';
            
            if (selectedClient === 'custom') {
                if (!customValue) {
                    alert('請輸入 client_name');
                    return;
                }
                finalClient = customValue;
            } else if (selectedClient) {
                finalClient = selectedClient;
            } else {
                alert('請選擇地點');
                return;
            }
            
            if (!selectedDate) {
                alert('請選擇日期');
                return;
            }
            
            document.body.removeChild(overlay);
            openAndAnalyze(finalClient, selectedDate);
        });
    }
    
    function openAndAnalyze(clientName, filterDate) {
        const url = `https://manage.yallvend.com/secret/univend_inv_stock_check_v3?client_name=${encodeURIComponent(clientName)}`;
        
        console.log(`準備開啟: ${url}`);
        console.log(`篩選日期: ${filterDate}`);
        
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
            alert('無法開啟新視窗，請檢查瀏覽器彈出視窗設定');
            return;
        }
        
        newWindow.addEventListener('load', function() {
            setTimeout(function() {
                analyzeData(newWindow, clientName, filterDate);
            }, 1000);
        });
    }
    
    function analyzeData(targetWindow, clientName, filterDate) {
        console.log('開始分析機台資料...');
        
        const errorMachines = [];
        const pageText = targetWindow.document.body.innerText;
        const machines = pageText.split('=================================================================================');
        
        console.log(`找到 ${machines.length} 個區塊`);
        
        machines.forEach((machineBlock) => {
            if (machineBlock.trim().length < 50) return;
            
            const finishSections = machineBlock.split(/== FINISH ID:/);
            
            finishSections.forEach((section, sectionIndex) => {
                if (section.trim().length < 50) return;
                
                let machineIdMatch;
                if (sectionIndex === 0) {
                    machineIdMatch = section.match(/(\d+):\s*(TW\d+)\s*\|\s*([^\n]+)/);
                } else {
                    machineIdMatch = machineBlock.match(/(\d+):\s*(TW\d+)\s*\|\s*([^\n]+)/);
                }
                
                if (!machineIdMatch) return;
                
                const machineCode = machineIdMatch[1];
                const machineId = machineIdMatch[2];
                const machineName = machineIdMatch[3].trim();
                
                const endTimeMatch = section.match(/結束時間\s*(\d{4}-\d{2}-\d{2})/);
                if (!endTimeMatch) return;
                
                const endDate = endTimeMatch[1];
                
                if (endDate !== filterDate) {
                    return;
                }
                
                const startTimeMatch = section.match(/開始時間\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
                const endTimeFullMatch = section.match(/結束時間\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/);
                const timeRange = startTimeMatch && endTimeFullMatch ? 
                    `${startTimeMatch[1]} ~ ${endTimeFullMatch[1]}` : endDate;
                
                const invoiceTotalMatch = section.match(/發票總交易數量:\s*(\d+)/);
                const stockTotalMatch = section.match(/庫存總交易數量:\s*(\d+)/);
                
                if (!invoiceTotalMatch || !stockTotalMatch) return;
                
                const invoiceTotal = parseInt(invoiceTotalMatch[1]);
                const stockTotal = parseInt(stockTotalMatch[1]);
                
                const condition1 = invoiceTotal < stockTotal;
                
                let condition2 = false;
                const remainingIssues = [];
                
                const remainingTableMatch = section.match(/====== 倉道剩餘可分配數量 ======\s*([\s\S]*?)(?=======|$)/);
                
                if (remainingTableMatch) {
                    const tableText = remainingTableMatch[1];
                    const lines = tableText.split('\n').filter(line => line.trim());
                    
                    let remainingLine = null;
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.includes('剩餘') && line.includes('|')) {
                            remainingLine = line;
                        }
                    }
                    
                    if (remainingLine) {
                        const values = remainingLine.split('|')
                            .map(v => v.trim())
                            .filter(v => v && v !== '剩餘');
                        
                        values.forEach((val, idx) => {
                            const num = parseInt(val);
                            if (!isNaN(num) && num >= 1) {
                                condition2 = true;
                                remainingIssues.push({
                                    channel: idx + 1,
                                    remaining: num,
                                    isHighAlert: num > 5
                                });
                            }
                        });
                    }
                }
                
                if (condition1 || condition2) {
                    errorMachines.push({
                        code: machineCode,
                        id: machineId,
                        name: machineName,
                        endDate: endDate,
                        timeRange: timeRange,
                        invoiceTotal: invoiceTotal,
                        stockTotal: stockTotal,
                        condition1: condition1,
                        condition2: condition2,
                        remainingIssues: remainingIssues
                    });
                }
            });
        });
        
        console.log(`分析完成，找到 ${errorMachines.length} 台有問題的機器`);
        
        generateReport(errorMachines, clientName, filterDate);
    }
    
    function generateReport(errorMachines, clientName, filterDate) {
        const reportHTML = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>機台異常分析報表 - ${clientName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Microsoft JhengHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header .summary {
            font-size: 16px;
            opacity: 0.9;
        }
        
        .header .filters {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.3);
            font-size: 14px;
        }
        
        .content {
            padding: 30px;
        }
        
        .machine-card {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }
        
        .machine-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .machine-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .machine-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        
        .machine-id {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .machine-date {
            font-size: 12px;
            color: #888;
            margin-top: 3px;
        }
        
        .error-badge {
            background: #ff4444;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .info-row {
            display: flex;
            gap: 30px;
            margin-bottom: 15px;
        }
        
        .info-item {
            flex: 1;
        }
        
        .info-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
        }
        
        .info-value {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        
        .condition-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        
        .condition-box.error {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        
        .condition-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #856404;
        }
        
        .condition-box.error .condition-title {
            color: #721c24;
        }
        
        .condition-detail {
            font-size: 14px;
            color: #666;
        }
        
        .remaining-table {
            margin-top: 10px;
            width: 100%;
            border-collapse: collapse;
        }
        
        .remaining-table th,
        .remaining-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
        }
        
        .remaining-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        
        .highlight {
            background: #ffebee;
            font-weight: bold;
            color: #c62828;
        }
        
        .high-alert {
            background: #b71c1c;
            font-weight: bold;
            color: white;
            animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .no-error {
            text-align: center;
            padding: 40px;
            color: #28a745;
            font-size: 20px;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #888;
            font-size: 14px;
            border-top: 1px solid #e0e0e0;
        }
        
        .generate-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 15px;
            transition: all 0.3s;
        }
        
        .generate-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .transaction-output {
            margin-top: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-height: 300px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 機台異常分析報表</h1>
            <div class="summary">
                分析時間: ${new Date().toLocaleString('zh-TW')} | 異常機台數量: <strong>${errorMachines.length}</strong> 台
            </div>
            <div class="filters">
                📍 地點: <strong>${clientName}</strong> | 📅 結束日期: <strong>${filterDate}</strong>
            </div>
        </div>
        
        <div class="content">
            ${errorMachines.length === 0 ? 
                \`<div class="no-error">✅ 太好了！在 ${filterDate} 結束的機台都正常，沒有發現異常情況。</div>\` :
                errorMachines.map(machine => \`
                    <div class="machine-card">
                        <div class="machine-header">
                            <div>
                                <div class="machine-title">\${machine.name}</div>
                                <div class="machine-id">機台編號: \${machine.id} (\${machine.code})</div>
                                <div class="machine-date">時間區段: \${machine.timeRange}</div>
                            </div>
                            <div class="error-badge">異常</div>
                        </div>
                        
                        <div class="info-row">
                            <div class="info-item">
                                <div class="info-label">發票總交易數量</div>
                                <div class="info-value">\${machine.invoiceTotal}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">庫存總交易數量</div>
                                <div class="info-value">\${machine.stockTotal}</div>
                            </div>
                        </div>
                        
                        \${machine.condition1 ? \`
                            <div class="condition-box error">
                                <div class="condition-title">❌ 條件1: 發票總交易數量小於庫存總交易數量</div>
                                <div class="condition-detail">
                                    發票 (\${machine.invoiceTotal}) < 庫存 (\${machine.stockTotal})
                                    → 差異: \${machine.stockTotal - machine.invoiceTotal} 筆
                                </div>
                                <button class="generate-btn" onclick="generateTransactions('\${machine.id}', \${machine.stockTotal - machine.invoiceTotal}, '\${machine.timeRange}')">
                                    產生補單資料
                                </button>
                                <div id="output-\${machine.id}" class="transaction-output" style="display:none;"></div>
                            </div>
                        \` : ''}
                        
                        \${machine.condition2 ? \`
                            <div class="condition-box error">
                                <div class="condition-title">❌ 條件2: 倉道剩餘可分配數量有大於等於1</div>
                                <div class="condition-detail">
                                    發現 \${machine.remainingIssues.length} 個倉道剩餘數量異常:
                                    <table class="remaining-table">
                                        <tr>
                                            <th>倉道編號</th>
                                            <th>剩餘數量</th>
                                        </tr>
                                        \${machine.remainingIssues.map(issue => \`
                                            <tr>
                                                <td>CH \${issue.channel}</td>
                                                <td class="\${issue.isHighAlert ? 'high-alert' : 'highlight'}">\${issue.remaining}\${issue.isHighAlert ? ' ⚠️' : ''}</td>
                                            </tr>
                                        \`).join('')}
                                    </table>
                                </div>
                            </div>
                        \` : ''}
                    </div>
                \`).join('')
            }
        </div>
        
        <div class="footer">
            ${clientName} 機台分析系統 | 自動化資料分析工具
        </div>
    </div>
    
    <script>
        function generateTransactions(machineId, count, timeRange) {
            const timeMatch = timeRange.match(/(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})\\s*~\\s*(\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2})/);
            
            if (!timeMatch) {
                alert('無法解析時間區段');
                return;
            }
            
            const startTime = new Date(timeMatch[1]);
            const endTime = new Date(timeMatch[2]);
            
            const transactions = [];
            for (let i = 0; i < count; i++) {
                const randomTime = new Date(startTime.getTime() + Math.random() * (endTime.getTime() - startTime.getTime()));
                const formattedTime = randomTime.toISOString().replace('T', ' ').substring(0, 19);
                transactions.push(formattedTime);
            }
            
            transactions.sort();
            
            const output = document.getElementById('output-' + machineId);
            output.style.display = 'block';
            output.innerHTML = '<strong>產生的補單交易時間：</strong><br><br>' + 
                               transactions.map((t, i) => \`\${i + 1}. \${t}\`).join('<br>');
        }
    </script>
</body>
</html>
        `;
        
        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(reportHTML);
        reportWindow.document.close();
    }
    
    createSelectionDialog();
})();
