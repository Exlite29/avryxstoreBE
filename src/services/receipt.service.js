const { formatCurrency, formatDateTime } = require("../utils/helpers");

/**
 * Generate a text-based receipt for a sale
 */
const generateTextReceipt = (sale, storeName = "Sari-Sari Store") => {
  const separator = "--------------------------------";
  const doubleSeparator = "================================";
  
  let receipt = "";
  receipt += `${doubleSeparator}\n`;
  receipt += `${storeName.padStart(Math.floor((32 + storeName.length) / 2))}\n`;
  receipt += `${doubleSeparator}\n\n`;
  
  receipt += `Date: ${formatDateTime(sale.created_at || new Date())}\n`;
  receipt += `TXN: ${sale.transaction_number}\n`;
  receipt += `Cashier: ${sale.cashier_name || "Staff"}\n`;
  receipt += `${separator}\n`;
  
  receipt += "ITEM".padEnd(16) + "QTY".padStart(5) + "PRICE".padStart(11) + "\n";
  receipt += `${separator}\n`;
  
  sale.items.forEach(item => {
    const name = item.productName.substring(0, 15);
    const qty = item.quantity.toString();
    const price = formatCurrency(item.totalPrice);
    receipt += name.padEnd(16) + qty.padStart(5) + price.padStart(11) + "\n";
  });
  
  receipt += `${separator}\n`;
  receipt += "Subtotal:".padEnd(20) + formatCurrency(sale.subtotal).padStart(12) + "\n";
  
  if (parseFloat(sale.discount) > 0) {
    receipt += "Discount:".padEnd(20) + `-${formatCurrency(sale.discount)}`.padStart(12) + "\n";
  }
  
  receipt += "Tax (12%):".padEnd(20) + formatCurrency(sale.tax).padStart(12) + "\n";
  receipt += `${separator}\n`;
  receipt += "TOTAL:".padEnd(20) + formatCurrency(sale.total_amount || sale.totalAmount).padStart(12) + "\n";
  receipt += `${doubleSeparator}\n\n`;
  receipt += "Thank you for shopping!\n";
  receipt += "Please come again.\n";
  
  return receipt;
};

/**
 * Generate a JSON-based receipt (useful for frontend display or digital receipts)
 */
const generateJSONReceipt = (sale, store) => {
  return {
    header: {
      storeName: store?.name || "Sari-Sari Store",
      address: store?.address,
      phone: store?.phone,
      transactionNumber: sale.transaction_number,
      date: sale.created_at || new Date(),
    },
    items: sale.items.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
    totals: {
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total_amount || sale.totalAmount,
    },
    footer: {
      message: "Thank you for shopping!",
      cashier: sale.cashier_name,
    }
  };
};

module.exports = {
  generateTextReceipt,
  generateJSONReceipt,
};
