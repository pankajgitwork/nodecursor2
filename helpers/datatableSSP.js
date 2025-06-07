class SSP {

    static getData(request, userSqlQuery, columns) {
        this.request = request.body;

        this.userSqlQuery = userSqlQuery;

        this.columns = columns;
        this.replacements = {};
        this.whereString = '';

        this.orderData = this.order();
        this.limitData = this.limit();

        this.dbcolumns = this.pluck(this.columns, 'db');

        this.selectColumns = (this.dbcolumns).map((e, i) => {
            return "`" + e + "`";
        }).join(',');

        return this;
    }


    static async sequelize(connection) {
        let finalRecord = {};

        this.filter('sequelize');

        let finalQuery = `SELECT SQL_CALC_FOUND_ROWS ${this.selectColumns} FROM (${this.userSqlQuery}) as temp ${this.whereString} ${this.orderData} ${this.limitData}`;

        try {
            const dbData = await connection.query(
                finalQuery,
                {
                    replacements: this.replacements,
                    type: connection.QueryTypes.SELECT
                }
            );

            const resFilterLength = (await connection.query('SELECT FOUND_ROWS()', {
                type: connection.QueryTypes.SELECT
            }));

            const recordsFiltered = resFilterLength[0]['FOUND_ROWS()'] ?? 0;

            const resTotalLength = await connection.query(`SELECT COUNT(*) as datatable_ssp_count FROM (${this.userSqlQuery}) AS temp`, {
                type: connection.QueryTypes.SELECT
            });

            const recordsTotal = resTotalLength[0]['datatable_ssp_count'] ?? 0;

            finalRecord.draw = parseInt(this.request.draw);
            finalRecord.recordsTotal = parseInt(recordsTotal);
            finalRecord.recordsFiltered = parseInt(recordsFiltered);

            const mappedData = await this.mapDbToDToColumn(this.columns, dbData);

            finalRecord.data = mappedData;

            return finalRecord;

        } catch (error) {
            console.error("Error in sequelize:", error);
            return null;
        }
    }

    static async mysql(connection) {
        let finalRecord = {};

        this.filter('mysql');

        let finalQuery = `SELECT SQL_CALC_FOUND_ROWS ${this.selectColumns} FROM (${this.userSqlQuery}) as temp ${this.whereString} ${this.orderData} ${this.limitData}`;

        try {
            const [dbData, fields] = await connection.query(finalQuery, this.replacements);
            const [resFilterLength, resFilterLengthfields] = await connection.query("SELECT FOUND_ROWS()");
            const recordsFiltered = resFilterLength[0]['FOUND_ROWS()'] ?? 0;
            const resTotalLength = await connection.query(`SELECT COUNT(*) as datatable_ssp_count FROM (${this.userSqlQuery}) AS temp`);
            const recordsTotal = resTotalLength[0][0].datatable_ssp_count ?? 0;

            finalRecord.draw = parseInt(this.request.draw);
            finalRecord.recordsTotal = parseInt(recordsTotal);
            finalRecord.recordsFiltered = parseInt(recordsFiltered);

            const mappedData = await this.mapDbToDToColumn(this.columns, dbData);

            finalRecord.data = mappedData;

            return finalRecord;

        } catch (error) {
            console.error("Error in Mysql:", error);
            return null;
        }

    }

    static async mapDbToDToColumn(columns, data) {
        var out = [];

        for (var i = 0, ien = data.length; i < ien; i++) {
            var row = {};

            for (var j = 0, jen = columns.length; j < jen; j++) {
                var column = columns[j];

                if (typeof column.formatter === 'function') {
                    var formatterResult = column.formatter(data[i][column.db], data[i]) || null;
                    if (formatterResult instanceof Promise) {
                        if (column.dt !== undefined) {
                            row[column.dt] = await formatterResult || null;
                        } else {
                            row[column.db] = await formatterResult || null;
                        }
                    } else {
                        if (column.dt !== undefined) {
                            row[column.dt] = formatterResult;
                        } else {
                            row[column.db] = formatterResult;
                        }
                    }
                } else {
                    if (column.dt !== undefined) {
                        row[column.dt] = data[i][columns[j].db];
                    } else {
                        row[column.db] = data[i][columns[j].db];
                    }
                }
            }
            out.push(row);
        }
        return out;
    }

    static filter(mode) {

        let request = this.request;
        let columns = this.columns;

        let globalSearch = [];

        let columnSearch = [];

        let dtColumns = columns.map(column => column.dt);


        if (mode === 'mysql') {
            this.replacements = [];
        }


        if (request.search && request.search.value !== '') {

            let str = request.search.value;
            for (let i = 0; i < request.columns.length; i++) {
                let requestColumn = request.columns[i];
                let columnIdx = dtColumns.indexOf(requestColumn.data);
                columnIdx = (columnIdx <= -1) ? 0 : columnIdx;

                let column = columns[columnIdx];

                if (requestColumn.searchable === 'true' || requestColumn.searchable === true) {

                    if (mode === 'sequelize') {
                        let binding = `ssp_search_value_${i}`;
                        globalSearch.push("`" + column.db + "` LIKE :" + binding);
                        this.replacements[binding] = `%${str}%`;
                    } else if (mode === 'mysql') {
                        globalSearch.push("`" + column.db + "` LIKE ?");
                        (this.replacements).push(`%${str}%`);
                    }
                }
            }
        }


        // Individual column filtering
        for (let i = 0; i < request.columns.length; i++) {
            let requestColumn = request.columns[i];
            let columnIdx = dtColumns.indexOf(requestColumn.data);

            columnIdx = (columnIdx <= -1) ? 0 : columnIdx;

            let column = columns[columnIdx];
            let str = requestColumn.search.value;

            if ((requestColumn.searchable === 'true' || requestColumn.searchable === true) && str !== '') {
                if (mode === 'sequelize') {
                    let binding2 = `ssp_search_value2_${i}`;
                    columnSearch.push("`" + column.db + "` LIKE :" + binding2);
                    let dynamicBindings2 = [];
                    dynamicBindings2.push({
                        key: binding2,
                        value: `%${str}%`
                    })
                } else if (mode === 'mysql') {
                    columnSearch.push("`" + column.db + "` LIKE ?");
                    this.replacements.push(`%${str}%`);
                }
            }
        }

        this.whereString = '';

        if (globalSearch.length > 0) {
            this.whereString = '(' + globalSearch.join(' OR ') + ')';
        }

        if (columnSearch.length > 0) {
            this.whereString = this.whereString === '' ?
                columnSearch.join(' AND ') :
                this.whereString + ' AND ' + columnSearch.join(' AND ');
        }

        if (this.whereString !== '') {
            this.whereString = 'WHERE ' + this.whereString;
        }

    }

    static order() {
        let columns = this.columns;
        let order = '';
        let request = this.request;
        if (request.order && request.order.length > 0) {
            let orderBy = [];
            let dtColumns = columns.map(column => (column.dt ?? column.db));

            for (let i = 0, ien = request.order.length; i < ien; i++) {
                // Convert the column index into the column data property
                let columnIdx = parseInt(request.order[i].column);
                let requestColumn = request.columns[columnIdx];
                columnIdx = dtColumns.indexOf(requestColumn.data);
                let column = columns[columnIdx];

                if (requestColumn.orderable === 'true' || requestColumn.orderable === true) {
                    let dir = request.order[i].dir === 'asc' ? 'ASC' : 'DESC';

                    orderBy.push('`' + column.db + '` ' + dir);
                }
            }

            order = 'ORDER BY ' + orderBy.join(', ');
        }

        return order;
    }

    static limit() {

        let start = this.request.start ?? 0;
        let length = this.request.length ?? 0;
        let limit = '';

        if (start !== undefined && length != -1) {
            limit = "LIMIT " + parseInt(start) + ", " + parseInt(length);
        }
        return limit;
    }

    static pluck(arrayOfObjects, key) {
        return arrayOfObjects.map(obj => obj[key]);
    }
}

export default SSP;