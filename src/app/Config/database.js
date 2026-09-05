const sql = require('mssql/msnodesqlv8');

const config = {
    server: 'DESKTOP-75JCIE2\\SQLEXPRESS',
    database: 'BissVet',

    options: {
        trustedConnection: true,
        trustServerCertificate: true
    },

    driver: 'msnodesqlv8'
};

let pool;

async function conectarBD() {

    try {

        if (!pool) {

            pool = await sql.connect(config);

            console.log('=================================');
            console.log('Conectado a SQL Server');
            console.log('Base de datos: BissVet');
            console.log('=================================');
        }

        return pool;

    } catch (error) {

        console.error('Error conectando a SQL Server:');
        console.error(error);

        throw error;
    }
}

module.exports = {
    sql,
    conectarBD
};