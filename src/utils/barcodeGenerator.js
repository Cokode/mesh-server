
//Generates random number as barcode number.
export const barcodeGenerator = () => {
  return Math.floor(Math.random() * (1847453838 - 837968473)) + 837968473;
}

console.log("answer", barcodeGenerator());