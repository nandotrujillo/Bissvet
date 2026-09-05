const { sql, conectarBD } = require('../config/database');

async function obtenerUsuarios() {
    console.log ("Conectar a la base de 111 ");
    const pool = await conectarBD();
    console.log ("Conectar a la base de datos222 ");
    console.log (pool);
    const resultado = await pool.request()
        .query(`
            SELECT
                UsuarioId,
                Username,
                PasswordHash
                FROM Usuarios
            ORDER BY UsuarioId
        `);

    return resultado.recordset;
}


async function obtenerUsuarioPorId(id) {

    const pool = await conectarBD();
    console.log("Consulta pr id");
    console.log(pool);
    const resultado = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT
                UsuarioId,
                Username,
                PasswordHash
            FROM Usuarios
            WHERE UsuarioId = @id
        `);

    return resultado.recordset[0];
}


async function validarUsuario(usuario, contraseña) {

     console.log('=================================');
        console.log('VALIDACIÓN DE LOGIN');
        console.log('Usuario recibido:', usuario);
        console.log('Contraseña recibida:', contraseña);
        console.log('=================================');
    const pool = await conectarBD();

    const resultado = await pool.request()
        .input('usuario', sql.NVarChar(50), usuario)
        .input('contraseña', sql.NVarChar(255), contraseña)
        .query(`
            SELECT
                UsuarioId,
                Username,
                PasswordHash            
            FROM Usuarios
            WHERE Username = @usuario
            AND PasswordHash = @contraseña
        `);

    return resultado.recordset[0];
}


async function crearUsuario(usuario, contraseña) {

    const pool = await conectarBD();

    const resultado = await pool.request()
        .input('usuario', sql.NVarChar(50), usuario)
        .input('contraseña', sql.NVarChar(255), contraseña)
        .query(`
            INSERT INTO Usuarios
            (
                Username,
                PasswordHash                        )
            OUTPUT INSERTED.UsuarioId,
                   INSERTED.Username
            VALUES
            (
                @usuario,
                @contraseña
            )
        `);

    return resultado.recordset[0];
}





module.exports = {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    validarUsuario,
    crearUsuario
};