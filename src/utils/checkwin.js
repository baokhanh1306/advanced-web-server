module.exports = function (row, col, val, history) {
  //check row
  for (let i = 0; i <= 15; i++) {
    let count = 0;
    for (let j = 0; j < 5; j++) {
      if (history[row][i + j] === val) count++;
    }
    if (count == 5) return true;
  }
  //check col
  for (let i = 0; i <= 15; i++) {
    let count = 0;
    for (let j = 0; j < 5; j++) {
      if (history[i + j][col] === val) count++;
    }
    if (count == 5) return true;
  }

  //check Top left to Bottom right diagonal
  if (checkLeftSizeDiagonal(row,col,val,history)) return true;
  //check Top right to Bottom left diagonal
  if (checkRightSizeDiagonal(row,col,val,history)) return true;

  return false;
};

function checkLeftSizeDiagonal(row, col, val, history) {
  let topLeftRow = 0;
  let topLeftCol = 0;  
  for (let i = row, j = col; i >= 0 && j >= 0; i--, j--) {
      if (i === 0 || j === 0) {
          topLeftRow = i;
          topLeftCol = j;
      }
  }
  for (let i = topLeftRow, j = topLeftCol; i <= 15 && j <= 15; i++, j++) {
      let count = 0;
      for (let k = 0; k < 5; k++) {
          if (history[i+k][j+k] === val) count++;
      }
      if (count === 5) return true;
  }
  return false;
}

function checkRightSizeDiagonal(row,col,val,history) {
    let topRightRow = 0;
    let topRightCol = 0;
    for (let i = row, j = col; i>=0 && j < 20; i--, j++) {
        if (i === 0 || j === 19) {
            topRightRow = i;
            topRightCol = j;
        }
    }
    for (let i = topRightRow, j = topRightCol; i <= 15 && j >= 4; i++, j--) {
        let count = 0;  
        for (let k = 0; k < 5; k++) {
            if (history[i+k][j-k] === val) count++;
        }
        if (count === 5) return true;
    }
    return false;
}
