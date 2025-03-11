
export function isReportExist(value, id) {
  const copyValue = value;
  console.log("dataBase Index 1: ", copyValue[0]?._id);
  console.log("Lost Item ID: ", id);

  const isExist = copyValue.find(element => element._id.toString() === id );
  console.log("IsExist: ", isExist?._id)

  return isExist;
}

export function deleteItem(id, dataSet) {
  console.log("You are in the delte function")

  const itemIdex = dataSet.findIndex(element => element._id.toString() == id);

  dataSet.forEach(element => {
    console.log(element._id.toString());
  });

  console.log("Index value. ", itemIdex);
  if (itemIdex == -1) return;

  console.log("Item will be deleted...");
  const newSet = dataSet.toSpliced(itemIdex);

  console.log("Array new lenght", newSet.length);
  return newSet;
}
