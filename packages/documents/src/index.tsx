export function renderReceiptHtml(data: { invoiceNumber: string; amountPaise: number }) {
  return `<html><body><h1>Receipt ${data.invoiceNumber}</h1><p>${data.amountPaise} paise</p></body></html>`;
}
