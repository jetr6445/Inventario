// 1. Configuración de Supabase
const SUPABASE_URL = 'https://emedutxubsqpjcwuqabs.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qoZAxsELwapEaHjaQsalcw_IYnwg43n';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let productosGlobal = [];

// 2. Función para LEER (Read)
async function cargarProductos() {
    const { data, error } = await supabaseClient
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
        alert('Error al cargar productos: ' + error.message);
        return;
    }

    productosGlobal = data;
    renderizarAdmin(data);
    renderizarConsulta(data);
}

function renderizarAdmin(productos) {
    const contenedor = document.getElementById('listaAdmin');
    contenedor.innerHTML = '';
    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="producto-item">
                <span>${p.nombre} - <span class="precio">$${p.precio}</span></span>
                <!-- Agregamos el div contenedor aquí -->
                <div class="acciones-container">
                    <button class="btn-accion btn-editar" onclick="prepararEdicion(${p.id}, '${p.nombre}', ${p.precio})">Editar</button>
                    <button class="btn-accion btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
                </div>
            </div>
        `;
    });
}

function renderizarConsulta(productos) {
    const contenedor = document.getElementById('listaConsulta');
    contenedor.innerHTML = '';
    productos.forEach(p => {
        contenedor.innerHTML += `
            <div class="producto-item">
                <span>${p.nombre}</span>
                <span class="precio">$${p.precio}</span>
            </div>
        `;
    });
}

// 3. Función para CREAR o ACTUALIZAR
async function crearProducto() {
    const nombre = document.getElementById('nombreInput').value;
    const precio = parseFloat(document.getElementById('precioInput').value);
    const id = document.getElementById('productoId').value;

    if (!nombre || isNaN(precio)) {
        alert('Por favor, completa ambos campos.');
        return;
    }

    if (id) {
        const { error } = await supabaseClient
            .from('productos')
            .update({ nombre, precio })
            .eq('id', id);
        if (error) alert('Error al actualizar: ' + error.message);
    } else {
        const { error } = await supabaseClient
            .from('productos')
            .insert([{ nombre, precio }]);
        if (error) alert('Error al crear: ' + error.message);
    }

    document.getElementById('nombreInput').value = '';
    document.getElementById('precioInput').value = '';
    document.getElementById('productoId').value = '';
    document.getElementById('buscarAdminInput').value = '';
    cargarProductos();
}

// 4. Función para preparar la EDICIÓN
function prepararEdicion(id, nombre, precio) {
    document.getElementById('productoId').value = id;
    document.getElementById('nombreInput').value = nombre;
    document.getElementById('precioInput').value = precio;

    document.getElementById('buscarAdminInput').value = '';
    renderizarAdmin(productosGlobal);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('nombreInput').focus();
}

// 5. Función para ELIMINAR
async function eliminarProducto(id) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    
    const { error } = await supabaseClient
        .from('productos')
        .delete()
        .eq('id', id);
    
    if (error) alert('Error al eliminar: ' + error.message);
    document.getElementById('buscarAdminInput').value = '';
    cargarProductos();
}

// 6. Filtro para la consulta
function filtrarProductos() {
    const texto = document.getElementById('buscarInput').value.toLowerCase();
    const filtrados = productosGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto)
    );
    renderizarConsulta(filtrados);
}

// 7. Filtro para administración
function filtrarAdmin() {
    const texto = document.getElementById('buscarAdminInput').value.toLowerCase();
    const filtrados = productosGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto)
    );
    renderizarAdmin(filtrados);
}

// 8. NUEVA FUNCIÓN: Controlar las Pestañas
function cambiarPestana(nombrePestana, botonClickeado) {
    // 1. Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('active'));
    
    // 2. Quitar la clase 'active' de todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // 3. Mostrar la sección seleccionada y activar su botón
    document.getElementById('seccion-' + nombrePestana).classList.add('active');
    botonClickeado.classList.add('active');
}

// 9. Inicializar la app
cargarProductos();
