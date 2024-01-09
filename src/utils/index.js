import { EXTRACTION_TYPES } from 'consts/extraction-types';

export function descendingComparator(a, b, orderBy) {
  const reA = /[^a-zA-Z]/g;
  const reN = /[^0-9]/g;
  if (!a[orderBy] || !b[orderBy]) return 0;
  const aA = a[orderBy].replace(reA, '');
  const bA = b[orderBy].replace(reA, '');
  if (aA === bA) {
    var aN = parseInt(a[orderBy].replace(reN, ''), 10);
    var bN = parseInt(b[orderBy].replace(reN, ''), 10);
    return aN === bN ? 0 : aN > bN ? 1 : -1;
  } else {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export const dateFormat = 'MM/DD/YYYY';
export const rowsPerPageOptions = [10, 20, 30];

export const getExtractionType = (type) => {
  let text = '';
  switch (type) {
    case EXTRACTION_TYPES.DATA_EXTRACTION.value:
      text = EXTRACTION_TYPES.DATA_EXTRACTION.label;
      break;

    case EXTRACTION_TYPES.ANALYTICS_EXTRACTION.value:
      text = EXTRACTION_TYPES.ANALYTICS_EXTRACTION.label;
      break;

    default:
      break;
  }
  return text;
};
