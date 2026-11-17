// 1. Configuración de Supabase (Reemplaza con tus credenciales del Paso 1)
const SUPABASE_URL = 'TU_PROJECT_URL_AQUI';
const SUPABASE_KEY = 'TU_ANON_KEY_AQUI';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Variable global para almacenar los productos
let productosGlobal = [];

// 2. Función para LEER (Read) y mostrar en ambas listas
async function cargarProductos() {
    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al cargar:', error);
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
                <div>
                    <button onclick="prepararEdicion(${p.id}, '${p.nombre}', ${p.precio})">Editar</button>
                    <button onclick="eliminarProducto(${p.id})">Eliminar</button>
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

// 3. Función para CREAR o ACTUALIZAR (Create / Update)
async function crearProducto() {
    const nombre = document.getElementById('nombreInput').value;
    const precio = parseFloat(document.getElementById('precioInput').value);
    const id = document.getElementById('productoId').value;

    if (!nombre || isNaN(precio)) {
        alert('Por favor, completa ambos campos.');
        return;
    }

    if (id) {
        // Actualizar
        const { error } = await supabase
            .from('productos')
            .update({ nombre, precio })
            .eq('id', id);
        if (error) alert('Error al actualizar: ' + error.message);
    } else {
        // Crear
        const { error } = await supabase
            .from('productos')
            .insert([{ nombre, precio }]);
        if (error) alert('Error al crear: ' + error.message);
    }

    // Limpiar formulario y recargar
    document.getElementById('nombreInput').value = '';
    document.getElementById('precioInput').value = '';
    document.getElementById('productoId').value = '';
    cargarProductos();
}

// 4. Función para preparar la EDICIÓN
function prepararEdicion(id, nombre, precio) {
    document.getElementById('productoId').value = id;
    document.getElementById('nombreInput').value = nombre;
    document.getElementById('precioInput').value = precio;
}

// 5. Función para ELIMINAR (Delete)
async function eliminarProducto(id) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    
    const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);
    
    if (error) alert('Error al eliminar: ' + error.message);
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

// 7. Inicializar la app
cargarProductos();