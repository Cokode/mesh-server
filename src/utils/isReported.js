

export default function isReportExist(value, id) {
  const copyValue = value;
  const isExist = copyValue.find(element => element._id == id );

  return isExist;
}