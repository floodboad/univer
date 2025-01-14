/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IRange } from '@univerjs/core';
import { ObjectMatrix, Range } from '@univerjs/core';

const createTopMatrix = (ranges: IRange[]) => {
    const matrix = new ObjectMatrix<number>();
    ranges.forEach((range) => {
        Range.foreach(range, (row, col) => {
            matrix.setValue(row, col, 1);
        });
    });
    matrix.forValue((row, col) => {
        const theLastRowValue = matrix.getValue(row - 1, col);
        if (theLastRowValue) {
            matrix.setValue(row, col, theLastRowValue + 1);
        }
    });
    return matrix;
};
const findMaximalRectangle = (topMatrix: ObjectMatrix<number>) => {
    const res: {
        area: number;
        range?: IRange;
    } = {
        area: 0,
    };
    const checkArea = (area: number, range: IRange) => {
        if (res.area < area) {
            res.area = area;
            res.range = range;
            return true;
        }
        return false;
    };

    topMatrix.forValue((row, col, lineArea) => {
        let cols = 1;
        let rows = lineArea;
        checkArea(cols * rows, {
            startRow: row - rows + 1,
            endRow: row,
            startColumn: col,
            endColumn: col,
        });
        const _range = {
            startRow: row - rows + 1,
            endRow: row,
            startColumn: 0,
            endColumn: col,
        };
        for (let k = col - 1; k >= 0; k--) {
            if (!topMatrix.getValue(row, k)) break;
            else {
                rows = Math.min(topMatrix.getValue(row, k) || 0, rows);
                cols++;
                const area = rows * cols;
                _range.startColumn = k;
                _range.startRow = row - rows + 1;
                checkArea(area, _range);
            }
        }
    });
    return res;
};

const filterLeftMatrix = (topMatrix: ObjectMatrix<number>, range: IRange) => {
    Range.foreach(range, (row, col) => {
        topMatrix.realDeleteValue(row, col);
        let theNextRow = row + 1;
        let theNextRowValue = topMatrix.getValue(theNextRow, col) || 0;
        while (theNextRowValue > 1) {
            topMatrix.setValue(theNextRow, col, theNextRowValue - 1);
            theNextRow += 1;
            theNextRowValue = topMatrix.getValue(theNextRow, col) || 0;
        }
    });
    return topMatrix;
};

const findAllRectangle = (topMatrix: ObjectMatrix<number>) => {
    const resultList = [];
    let result = findMaximalRectangle(topMatrix);
    while (result.area > 0) {
        if (result.range) {
            resultList.push(result.range);
            filterLeftMatrix(topMatrix, result.range);
        }
        result = findMaximalRectangle(topMatrix);
    }
    return resultList;
};

/**
 * Some operations generate sparse ranges such as paste/autofill/ref-range, and this function merge some small ranges into some large ranges to reduce transmission size.
 * Time Complexity: O(mn) , where m and n are rows and columns. It takes O(mn) to compute the markMatrix and O(n) to apply the histogram algorithm to each column.
 * ps. column sparse matrices have better performance
 * @param {IRange[]} ranges
 * @returns {IRange[]}
 */
export const rangeMerge = (ranges: IRange[]) => {
    const topMatrix = createTopMatrix(ranges);
    return findAllRectangle(topMatrix);
};
