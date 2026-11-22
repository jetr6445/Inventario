// 1. Configuración de Supabase
const SUPABASE_URL = 'https://emedutxubsqpjcwuqabs.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_qoZAxsELwapEaHjaQsalcw_IYnwg43n';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let productosGlobal = [];
let carrito = {}; // Aquí guardamos los productos seleccionados y sus cantidades

// --- NUEVA FUNCIÓN: Formatear precios con puntos y comas ---
function formatearPrecio(valor) {
    return Number(valor).toLocaleString('es-CO', {
        minimumFractionDigits: 0, // Si el precio es entero (ej. 2500), no muestra decimales (2.500)
        maximumFractionDigits: 2  // Si tiene decimales (ej. 2500.50), muestra hasta 2 (2.500,50)
    });
}

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
                <span>${p.nombre} - <span class="precio">$${formatearPrecio(p.precio)}</span></span>
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
                <span class="precio">$${formatearPrecio(p.precio)}</span>
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
    
    // Usar 'flex' en lugar de 'block' para mantener el centrado de la X
    document.getElementById('btnLimpiarConsulta').style.display = texto.length > 0 ? 'flex' : 'none';

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

// 8. Controlar las Pestañas
function cambiarPestana(nombrePestana, botonClickeado) {
    document.querySelectorAll('.seccion').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('seccion-' + nombrePestana).classList.add('active');
    botonClickeado.classList.add('active');

     if (nombrePestana === 'carrito') {
        renderizarCarrito();
    }
}

// 9. Limpiar el buscador
function limpiarBuscador(idInput, idBoton) {
    const input = document.getElementById(idInput);
    const boton = document.getElementById(idBoton);
    
    input.value = ''; // Vaciamos el input usando la variable
    boton.style.display = 'none'; // Ocultamos la X
    
    renderizarConsulta(productosGlobal); // Restauramos la lista completa
    input.focus(); // Volvemos a poner el cursor en el campo
}

// 10. Funciones para el Carrito / Cotizador Avanzado
// Función que busca productos para añadir (no dibuja los que ya están seleccionados)
function filtrarCarrito() {
    const texto = document.getElementById('buscarCarritoInput').value.toLowerCase();
    const contenedor = document.getElementById('resultadosBusquedaCarrito');
    
    // Mostrar/ocultar la X del buscador
    document.getElementById('btnLimpiarCarrito').style.display = texto.length > 0 ? 'flex' : 'none';

    if (texto.length === 0) {
        contenedor.innerHTML = ''; // Si está vacío, no muestra nada
        return;
    }

    // Filtramos los productos que coinciden y que NO estén ya en el carrito
    const filtrados = productosGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto) && !carrito[p.id]
    );

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p style="color: #888; font-size: 0.9rem;">No se encontraron productos con ese nombre.</p>';
        return;
    }

    contenedor.innerHTML = filtrados.map(p => `
        <div class="producto-item" style="cursor: pointer; padding: 0.5rem; border-bottom: 1px solid #eee; border-radius: 4px; transition: background 0.2s;" 
             onclick="agregarAlCarrito(${p.id})" onmouseover="this.style.background='#f1f3f4'" onmouseout="this.style.background='none'">
            <span>${p.nombre} <span style="color:#888;">($${formatearPrecio(p.precio)})</span></span>
            <span style="color: #00a8ff; font-weight: bold; font-size: 1.2rem;">+</span>
        </div>
    `).join('');
}

// Agrega el producto al carrito (se activa al hacer clic en un resultado de búsqueda)
function agregarAlCarrito(id) {
    carrito[id] = 1; // Agrega con cantidad 1 por defecto
    document.getElementById('buscarCarritoInput').value = ''; // Limpia el buscador
    document.getElementById('resultadosBusquedaCarrito').innerHTML = ''; // Limpia resultados
    document.getElementById('btnLimpiarCarrito').style.display = 'none'; // Oculta la X
    
    renderizarCarrito(); // Redibuja la lista de seleccionados
}

// Limpia el buscador del carrito manualmente (con la X)
function limpiarBuscadorCarrito() {
    document.getElementById('buscarCarritoInput').value = '';
    document.getElementById('resultadosBusquedaCarrito').innerHTML = '';
    document.getElementById('btnLimpiarCarrito').style.display = 'none';
    document.getElementById('buscarCarritoInput').focus();
}

// Dibuja SOLO los productos que ya están en el carrito
function renderizarCarrito() {
    const contenedor = document.getElementById('listaCarrito');
    contenedor.innerHTML = '';

    const idsEnCarrito = Object.keys(carrito);

    if (idsEnCarrito.length === 0) {
        contenedor.innerHTML = '<p style="color: #888;">Aún no has seleccionado ningún producto. Usa el buscador de arriba para añadirlos.</p>';
        calcularTotal();
        return;
    }

    idsEnCarrito.forEach(id => {
        const producto = productosGlobal.find(p => p.id == id);
        if (!producto) return;

        const cantidad = carrito[id];

        contenedor.innerHTML += `
            <div class="producto-item">
                <div style="flex: 1;">
                    <span style="font-weight: 500;">${producto.nombre}</span> 
                    <span style="color:#888; font-size:0.9rem;">- $${formatearPrecio(producto.precio)} c/u</span>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                    <input type="number" 
                        value="${cantidad}" 
                        min="1" 
                        onchange="cambiarCantidad(${producto.id}, this.value)"
                        style="width: 60px; text-align: center; padding: 0.3rem;">
                    
                    <button class="btn-accion btn-eliminar" onclick="quitarDelCarrito(${producto.id})" style="padding: 0.3rem 0.6rem;">Quitar</button>
                </div>
            </div>
        `;
    });

    calcularTotal();
}

// Cambia la cantidad de un producto seleccionado
function cambiarCantidad(id, nuevaCantidad) {
    const cant = parseInt(nuevaCantidad);
    if (cant > 0) {
        carrito[id] = cant;
    } else {
        delete carrito[id]; // Si la cantidad es 0, se quita
    }
    calcularTotal();
}

// Elimina un producto del carrito
function quitarDelCarrito(id) {
    delete carrito[id];
    renderizarCarrito();
}

// Suma los precios y muestra el total
function calcularTotal() {
    let total = 0;
    for (const id in carrito) {
        const producto = productosGlobal.find(p => p.id == id);
        if (producto) {
            total += producto.precio * carrito[id];
        }
    }
    document.getElementById('totalCarrito').textContent = '$' + formatearPrecio(total);
}

// Elimina todos los productos del carrito de una sola vez
function vaciarCarrito() {
    // Pedimos confirmación para evitar borrados accidentales
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        carrito = {}; // Vaciamos el objeto
        renderizarCarrito(); // Redibujamos el carrito (quedará vacío)
        
        // También limpiamos cualquier texto que haya quedado en el buscador del carrito
        document.getElementById('buscarCarritoInput').value = '';
        document.getElementById('resultadosBusquedaCarrito').innerHTML = '';
        document.getElementById('btnLimpiarCarrito').style.display = 'none';
    }
}

// 11. Inicializar la app
cargarProductos();
