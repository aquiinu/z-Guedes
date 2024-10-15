const stockKey = 'products';
const salesKey = 'sales';
const closingKey = 'closings';
const expensesKey = 'expenses';

let products = JSON.parse(localStorage.getItem(stockKey)) || [];
let sales = JSON.parse(localStorage.getItem(salesKey)) || [];
let closings = JSON.parse(localStorage.getItem(closingKey)) || [];
let expenses = JSON.parse(localStorage.getItem(expensesKey)) || [];
let cart = [];
let filteredProducts = [];

const stockTable = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
const salesTable = document.getElementById('salesTable').getElementsByTagName('tbody')[0];
const closingTable = document.getElementById('closingTable').getElementsByTagName('tbody')[0];
const expenseTable = document.getElementById('expenseTable').getElementsByTagName('tbody')[0];
const totalValueElement = document.getElementById('totalValue');
const totalProfitElement = document.getElementById('totalProfit');
const saleProductSelect = document.getElementById('saleProduct');
const workingCapitalResult = document.getElementById('workingCapitalResult');
const productSearch = document.getElementById('productSearch');

window.onload = () => {
    updateTable();
    updateSalesTable();
    updateSummary();
    updateSaleProductSelect();
    updateClosingTable();
    updateExpenseTable();
};

function saveProducts() {
    localStorage.setItem(stockKey, JSON.stringify(products));
}

function saveSales() {
    localStorage.setItem(salesKey, JSON.stringify(sales));
}

function saveClosings() {
    localStorage.setItem(closingKey, JSON.stringify(closings));
}

function saveExpenses() {
    localStorage.setItem(expensesKey, JSON.stringify(expenses));
}

document.getElementById('addProduct').addEventListener('click', () => {
    const name = document.getElementById('productName').value;
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const value = parseFloat(document.getElementById('productValue').value);
    const profit = parseFloat(document.getElementById('productProfit').value);

    if (name && quantity > 0 && value >= 0 && profit >= 0) {
        const product = { name, quantity, value, profit };
        products.push(product);
        saveProducts();
        updateTable();
        updateSummary();
        updateSaleProductSelect();
        clearInputs();
    } else {
        alert("Por favor, preencha todos os campos corretamente.");
    }
});

function updateTable() {
    stockTable.innerHTML = '';
    products.forEach((product, index) => {
        const row = stockTable.insertRow();
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>R$ ${product.value.toFixed(2)}</td>
            <td>R$ ${product.profit.toFixed(2)}</td>
            <td><button onclick="removeProduct(${index})">Remover</button></td>
        `;
    });
}

function updateSummary() {
    const totalValue = products.reduce((sum, product) => sum + product.value * product.quantity, 0);
    const totalProfit = products.reduce((sum, product) => sum + product.profit * product.quantity, 0);
    totalValueElement.textContent = `Valor Total: R$ ${totalValue.toFixed(2)}`;
    totalProfitElement.textContent = `Lucro Total: R$ ${totalProfit.toFixed(2)}`;
}

function clearInputs() {
    document.getElementById('productName').value = '';
    document.getElementById('productQuantity').value = '';
    document.getElementById('productValue').value = '';
    document.getElementById('productProfit').value = '';
}

function removeProduct(index) {
    products.splice(index, 1);
    saveProducts();
    updateTable();
    updateSummary();
    updateSaleProductSelect();
}

function updateSaleProductSelect(searchTerm = '') {
    filteredProducts = products.filter(product => 
        product.quantity > 0 && product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    saleProductSelect.innerHTML = '';
    filteredProducts.forEach((product, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${product.name} - R$ ${product.value.toFixed(2)} (Qtd: ${product.quantity})`;
        saleProductSelect.appendChild(option);
    });
}

productSearch.addEventListener('input', (e) => {
    updateSaleProductSelect(e.target.value);
});

document.getElementById('addToCart').addEventListener('click', () => {
    const productIndex = parseInt(saleProductSelect.value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);

    if (productIndex >= 0 && quantity > 0 && quantity <= filteredProducts[productIndex].quantity) {
        const product = filteredProducts[productIndex];
        const cartItem = {
            name: product.name,
            quantity: quantity,
            price: product.value,
            profit: product.profit,
            subtotal: quantity * product.value
        };
        
        cart.push(cartItem);
        updateCartTable();
        clearSaleInputs();
    } else {
        alert("Quantidade inválida ou produto não selecionado.");
    }
});

function updateCartTable() {
    const cartTable = document.getElementById('cartTable').getElementsByTagName('tbody')[0];
    cartTable.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const row = cartTable.insertRow();
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>R$ ${item.price.toFixed(2)}</td>
            <td>R$ ${item.subtotal.toFixed(2)}</td>
            <td><button onclick="removeFromCart(${index})">Remover</button></td>
        `;
        total += item.subtotal;
    });

    document.getElementById('cartTotal').textContent = `Total: R$ ${total.toFixed(2)}`;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartTable();
}

document.getElementById('finalizeSale').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("O carrinho está vazio. Adicione produtos antes de finalizar a venda.");
        return;
    }

    const paymentMethod = document.getElementById('paymentMethod').value;
    let totalValue = 0;
    let totalProfit = 0;
    const date = new Date().toISOString();

    cart.forEach(item => {
        totalValue += item.subtotal;
        totalProfit += item.quantity * item.profit;
    });

    const sale = {
        items: cart,
        totalValue,
        totalProfit,
        paymentMethod,
        date
    };

    sales.push(sale);
    saveSales();

    // Atualizar o estoque
    cart.forEach(item => {
        const productIndex = products.findIndex(p => p.name === item.name);
        if (productIndex !== -1) {
            products[productIndex].quantity -= item.quantity;
        }
    });
    saveProducts();

    updateSalesTable();
    updateTable();
    updateSummary();
    updateSaleProductSelect();

    // Limpar o carrinho
    cart = [];
    updateCartTable();

    alert("Venda finalizada com sucesso!");
});

function updateSalesTable(filter = 'all') {
    salesTable.innerHTML = '';
    const now = new Date();

    sales
        .filter(sale => {
            const saleDate = new Date(sale.date);
            if (filter === 'day') {
                return saleDate.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                return saleDate >= startOfWeek && saleDate <= new Date();
            } else if (filter === 'month') {
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            }
            return true;
        })
        .forEach(sale => {
            const row = salesTable.insertRow();
            row.innerHTML = `
                <td>${new Date(sale.date).toLocaleString()}</td>
                <td>${sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}</td>
                <td>R$ ${sale.totalValue.toFixed(2)}</td>
                <td>R$ ${sale.totalProfit.toFixed(2)}</td>
                <td>${sale.paymentMethod}</td>
            `;
        });
}

document.getElementById('closeCashRegister').addEventListener('click', () => {
    const initialCash = parseFloat(document.getElementById('initialCash').value) || 0;
    const paymentSummary = {
        dinheiro: 0,
        cartao: 0,
        pix: 0,
    };
    const productSales = {};

    // Filtrar vendas do dia atual
    const today = new Date().toDateString();
    const todaySales = sales.filter(sale => new Date(sale.date).toDateString() === today);

    todaySales.forEach(sale => {
        paymentSummary[sale.paymentMethod] += sale.totalValue;
        sale.items.forEach(item => {
            if (productSales[item.name]) {
                productSales[item.name].quantity += item.quantity;
                productSales[item.name].total += item.subtotal;
            } else {
                productSales[item.name] = {
                    quantity: item.quantity,
                    total: item.subtotal
                };
            }
        });
    });

    const totalReceived = Object.values(paymentSummary).reduce((acc, value) => acc + value, 0);
    const closingData = {
        date: new Date().toISOString(),
        ...paymentSummary,
        total: initialCash + totalReceived,
    };

    closings.push(closingData);
    saveClosings();
    updateClosingTable();

    const cashSummary = `
        <h3>Fechamento de Caixa</h3>
        <p>Saldo Inicial: R$ ${initialCash.toFixed(2)}</p>
        <p>Dinheiro: R$ ${paymentSummary.dinheiro.toFixed(2)}</p>
        <p>Cartão: R$ ${paymentSummary.cartao.toFixed(2)}</p>
        <p>PIX: R$ ${paymentSummary.pix.toFixed(2)}</p>
        <p>Total Recebido: R$ ${totalReceived.toFixed(2)}</p>
        <p>Total em Caixa: R$ ${closingData.total.toFixed(2)}</p>
    `;

    document.getElementById('cashSummary').innerHTML = cashSummary;

    // Gerar relatório
    generateReport(productSales, paymentSummary, totalReceived);
});

function updateClosingTable(filter = 'all') {
    closingTable.innerHTML = '';
    const now = new Date();

    closings
        .filter(closing => {
            const closingDate = new Date(closing.date);
            if (filter === 'day') {
                return closingDate.toDateString() === now.toDateString();
            } else if (filter === 'week') {
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                return closingDate >= startOfWeek && closingDate <= new Date();
            } else if (filter === 'month') {
                return closingDate.getMonth() === now.getMonth() && closingDate.getFullYear() === now.getFullYear();
            }
            return true;
        })
        .forEach(closing => {
            const row = closingTable.insertRow();
            row.innerHTML = `
                <td>${new Date(closing.date).toLocaleString()}</td>
                <td>R$ ${closing.dinheiro.toFixed(2)}</td>
                <td>R$ ${closing.cartao.toFixed(2)}</td>
                <td>R$ ${closing.pix.toFixed(2)}</td>
                <td>R$ ${closing.total.toFixed(2)}</td>
            `;
        });
}

document.getElementById('closingFilter').addEventListener('change', (event) => {
    const filterValue = event.target.value;
    updateClosingTable(filterValue);
});

document.getElementById('clearSales').addEventListener('click', () => {
    if (confirm("Você tem certeza que deseja limpar o histórico de vendas?")) {
        sales = [];
        saveSales();
        updateSalesTable();
    }
});

document.getElementById('clearClosings').addEventListener('click', () => {
    if (confirm("Você tem certeza que deseja limpar o histórico de fechamento de caixa?")) {
        closings = [];
        saveClosings();
        updateClosingTable();
    }
});

document.getElementById('addExpense').addEventListener('click', () => {
    const description = document.getElementById('expenseDescription').value;
    const value = parseFloat(document.getElementById('expenseValue').value);

    if (description && value >= 0) {
        const expense = { description, value };
        expenses.push(expense);
        saveExpenses();
        updateExpenseTable();
        clearExpenseInputs();
    } else {
        alert("Por favor, preencha todos os campos corretamente.");
    }
});

function updateExpenseTable() {
    expenseTable.innerHTML = '';
    expenses.forEach(expense => {
        const row = expenseTable.insertRow();
        row.innerHTML = `
            <td>${expense.description}</td>
            <td>R$ ${expense.value.toFixed(2)}</td>
        `;
    });
}

function clearExpenseInputs() {
    document.getElementById('expenseDescription').value = '';
    document.getElementById('expenseValue').value = '';
}

document.getElementById('calculateWorkingCapital').addEventListener('click', () => {
    const expensesValue = parseFloat(document.getElementById('expenses').value) || 0;
    const taxesValue = parseFloat(document.getElementById('taxes').value) || 0;

    const totalProfitFromSales = sales.reduce((sum, sale) => sum + sale.totalProfit, 0);
    const totalValueInStock = products.reduce((sum, product) => sum + (product.value * product.quantity), 0);

    const workingCapital = totalProfitFromSales + totalValueInStock - expensesValue - taxesValue;

    workingCapitalResult.innerHTML = `<h3>Capital de Giro: R$ ${workingCapital.toFixed(2)}</h3>`;
});

document.getElementById('clearExpenses').addEventListener('click', () => {
    if (confirm("Você tem certeza que deseja limpar o histórico de despesas?")) {
        expenses = [];
        saveExpenses();
        updateExpenseTable();
    }
});

function clearSaleInputs() {
    document.getElementById('saleQuantity').value = '';
    document.getElementById('productSearch').value = '';
    updateSaleProductSelect();
}

document.getElementById('filter').addEventListener('change', (event) => {
    const filterValue = event.target.value;
    updateSalesTable(filterValue);
});

function generateReport(productSales, paymentSummary, totalReceived) {
    let report = "RELATÓRIO DE FECHAMENTO DE CAIXA\n";
    report += "================================\n\n";
    report += `Data: ${new Date().toLocaleString()}\n\n`;

    report += "PRODUTOS VENDIDOS:\n";
    report += "-------------------\n";
    for (const [productName, data] of Object.entries(productSales)) {
        report += `${productName}:\n`;
        report += `  Quantidade: ${data.quantity}\n`;
        report += `  Total: R$ ${data.total.toFixed(2)}\n\n`;
    }

    report += "RESUMO POR FORMA DE PAGAMENTO:\n";
    report += "------------------------------\n";
    for (const [method, value] of Object.entries(paymentSummary)) {
        report += `${method.charAt(0).toUpperCase() + method.slice(1)}: R$ ${value.toFixed(2)}\n`;
    }

    report += `\nTOTAL VENDIDO: R$ ${totalReceived.toFixed(2)}\n`;

    // Criar um blob com o conteúdo do relatório
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Criar um link para download e clicar nele automaticamente
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
