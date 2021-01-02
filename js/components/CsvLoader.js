import * as d3 from "d3"
export default class CsvLoader {

    readFile(pathToCsv) {
        return new Promise((resolve, reject) => {
            this.data = [];
            d3.csv(pathToCsv).then((data) => {
                this.data = data;
                resolve(data);
            });
        });
    }

    getPointsArray(xColumn, yColumn) {
        this.points = [];
        let i = 0
        this.data.forEach( (row) => {
            if(typeof(row[xColumn]) !== 'undefined' && typeof(row[yColumn]) !== 'undefined'){

                this.points.push({
                    x: i,
                    y: parseFloat(row[yColumn])
                });
                i++;
            }
        });
        return this.points;
    }
}